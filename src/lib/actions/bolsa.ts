"use server";

import { prisma } from "@/lib/prisma";
import { hashSecret, generatePublicCode, generateInviteCode } from "@/lib/crypto";
import { createSession, getSession } from "@/lib/session";
import { crearBolsaSchema, unirseSchema, type CrearBolsaInput, type UnirseInput } from "@/lib/schemas";
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

  await prisma.bolsa.create({
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
      createdById: session.usuarioId,
      responsables: {
        create: data.responsables.map((r) => {
          const { hash, salt } = hashSecret(r.contrasena);
          return {
            nombre: r.nombre,
            apellidos: r.apellidos,
            dni: r.dni,
            celular: r.celular,
            rol: r.rol,
            esTesorero: r.rol === "tesorero",
            dniFotoUri: r.dniFotoUri,
            contrasenaHash: hash,
            contrasenaSalt: salt,
          };
        }),
      },
    },
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

  const existente = await prisma.familia.findFirst({ where: { bolsaId: bolsa.id, dni: data.dni } });
  if (existente) {
    return { ok: false, error: "Ya existe una familia registrada con ese DNI en esta bolsa" };
  }

  const { hash, salt } = hashSecret(data.contrasena);
  const familia = await prisma.familia.create({
    data: {
      bolsaId: bolsa.id,
      nombre: data.nombreFamilia,
      dni: data.dni,
      celular: data.celular,
      contrasenaHash: hash,
      contrasenaSalt: salt,
      estudiantes: {
        create: data.estudiantes.map((e) => ({ bolsaId: bolsa.id, nombre: e.nombre })),
      },
    },
  });

  await createSession({ tipo: "familia", familiaId: familia.id, bolsaId: bolsa.id });
  redirect("/inicio");
}
