"use server";

import { prisma } from "@/lib/prisma";
import { hashSecret, verifySecret, generatePublicCode, generateInviteCode } from "@/lib/crypto";
import { createSession, getSession } from "@/lib/session";
import { crearBolsaSchema, unirseSchema, type CrearBolsaInput, type UnirseInput } from "@/lib/schemas";
import { inscribirEstudiantes } from "@/lib/inscripciones";
import { redirect } from "next/navigation";

export type FormResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function crearBolsaAction(input: CrearBolsaInput): Promise<FormResult> {
  const session = await getSession();
  if (!session || session.tipo !== "usuario" || session.rol !== "admin") {
    return { ok: false, error: "Solo un administrador puede crear bolsas" };
  }
  const parsed = crearBolsaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const dnis = data.responsables.map((r) => r.dni);
  if (new Set(dnis).size !== dnis.length) {
    return { ok: false, error: "Los 3 responsables deben tener DNI distintos" };
  }

  const codigoPublico = generatePublicCode();
  const codigoInvitacion = generateInviteCode();
  const meta = data.cuota * data.estudiantesEsperados;

  const tesorero = data.responsables.find((r) => r.rol === "tesorero");
  if (!tesorero) {
    return { ok: false, error: "Un responsable debe tener el rol de tesorero" };
  }

  await prisma.$transaction(async (tx) => {
    // Cada responsable es un Usuario (cuenta única por DNI). Si ya existe se reutiliza
    // tal cual: no se cambian su nombre ni su contraseña.
    const usuarios: Awaited<ReturnType<typeof tx.usuario.create>>[] = [];
    for (const r of data.responsables) {
      const existente = await tx.usuario.findUnique({ where: { dni: r.dni } });
      if (existente) {
        usuarios.push(existente);
        continue;
      }
      const { hash, salt } = hashSecret(r.contrasena);
      usuarios.push(
        await tx.usuario.create({
          data: {
            nombre: r.nombre,
            apellidos: r.apellidos,
            dni: r.dni,
            celular: r.celular,
            dniFotoUri: r.dniFotoUri,
            rol: "usuario",
            contrasenaHash: hash,
            contrasenaSalt: salt,
            createdById: session.usuarioId,
          },
        })
      );
    }

    await tx.bolsa.create({
      data: {
        nombre: data.nombre,
        colegio: data.colegio,
        cuota: data.cuota,
        estudiantesEsperados: data.estudiantesEsperados,
        meta,
        actaUri: data.actaUri,
        codigoPublico,
        codigoInvitacion,
        estado: "activa",
        adminId: session.usuarioId,
        createdById: session.usuarioId,
        responsables: {
          // TODO(refactor/usuario-unico): nombre, dni, celular y dniFotoUri se duplican
          // desde Usuario hasta eliminar esas columnas de Responsable.
          create: data.responsables.map((r, i) => {
            const u = usuarios[i];
            return {
              usuarioId: u.id,
              nombre: u.nombre,
              apellidos: u.apellidos,
              dni: u.dni,
              celular: u.celular,
              dniFotoUri: u.dniFotoUri ?? r.dniFotoUri,
              rol: r.rol,
            };
          }),
        },
      },
    });
  });

  redirect("/admin");
}

export async function unirseAction(input: UnirseInput): Promise<FormResult> {
  const parsed = unirseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const bolsa = await prisma.bolsa.findUnique({ where: { codigoInvitacion: data.codigoInvitacion } });
  if (!bolsa || bolsa.estado !== "activa") {
    return { ok: false, error: "El código de invitación no es válido" };
  }

  // Cuenta única por DNI: si ya existe, debe confirmar su contraseña actual para unirse.
  let usuario = await prisma.usuario.findUnique({ where: { dni: data.dni } });
  if (usuario) {
    if (!verifySecret(data.contrasena, usuario.contrasenaHash, usuario.contrasenaSalt)) {
      return {
        ok: false,
        error: "Ya tienes una cuenta con ese DNI. Ingresa tu contraseña actual para unirte a esta bolsa",
      };
    }
    const yaEsMiembro = await prisma.familia.findFirst({ where: { bolsaId: bolsa.id, usuarioId: usuario.id } });
    if (yaEsMiembro) {
      return { ok: false, error: "Ya perteneces a esta bolsa. Inicia sesión con tu DNI" };
    }
  }

  const familia = await prisma.$transaction(async (tx) => {
    if (!usuario) {
      const { hash, salt } = hashSecret(data.contrasena);
      usuario = await tx.usuario.create({
        data: {
          nombre: data.nombre,
          apellidos: data.apellidos,
          dni: data.dni,
          celular: data.celular,
          rol: "usuario",
          contrasenaHash: hash,
          contrasenaSalt: salt,
        },
      });
    }
    const u = usuario;

    // TODO(refactor/usuario-unico): nombre, dni y celular se duplican desde Usuario
    // hasta eliminar esas columnas de Familia.
    const nueva = await tx.familia.create({
      data: {
        bolsaId: bolsa.id,
        usuarioId: u.id,
        nombre: `${u.nombre} ${u.apellidos}`,
        dni: u.dni,
        celular: u.celular,
      },
    });

    await inscribirEstudiantes(tx, {
      bolsaId: bolsa.id,
      familiaId: nueva.id,
      apoderadoId: u.id,
      nombres: data.estudiantes.map((e) => e.nombre),
    });
    return { id: nueva.id, usuarioId: u.id };
  });

  await createSession({ tipo: "familia", usuarioId: familia.usuarioId, familiaId: familia.id, bolsaId: bolsa.id });
  redirect("/inicio");
}
