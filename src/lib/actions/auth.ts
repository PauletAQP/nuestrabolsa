"use server";

import { prisma } from "@/lib/prisma";
import { hashSecret, verifySecret, generateRecoveryCode } from "@/lib/crypto";
import { createSession, destroySession, getSession } from "@/lib/session";
import { getOpcionesIngreso, sesionParaOpcion, destinoParaSesion } from "@/lib/ingreso";
import { loginSchema, recuperarSchema } from "@/lib/schemas";
import { redirect } from "next/navigation";

export type ActionResult = { ok: true; data?: Record<string, string> } | { ok: false; error: string };

export async function loginAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    dni: formData.get("dni"),
    contrasena: formData.get("contrasena"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { dni, contrasena } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { dni } });
  if (!usuario || !verifySecret(contrasena, usuario.contrasenaHash, usuario.contrasenaSalt)) {
    return { ok: false, error: "DNI o contraseña incorrectos" };
  }

  const opciones = await getOpcionesIngreso(usuario.id);
  if (opciones.length === 0) {
    return { ok: false, error: "Tu cuenta no pertenece a ninguna bolsa activa" };
  }

  // Con una sola opción entra directo; con varias elige en /elegir.
  const session =
    opciones.length === 1 ? sesionParaOpcion(usuario.id, opciones[0]) : ({ tipo: "pendiente", usuarioId: usuario.id } as const);
  await createSession(session);
  redirect(destinoParaSesion(session));
}

/** Entra con una de las opciones del usuario logueado (panel o membresía en una bolsa). */
export async function elegirIngresoAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/");

  const tipo = formData.get("tipo");
  const id = formData.get("id");
  const opciones = await getOpcionesIngreso(session.usuarioId);
  // Solo se acepta una opción que realmente pertenezca al usuario de la sesión.
  const opcion = opciones.find((o) => {
    if (o.tipo !== tipo) return false;
    if (o.tipo === "usuario") return o.rol === id;
    if (o.tipo === "familia") return o.familiaId === id;
    return o.responsableId === id;
  });
  if (!opcion) redirect("/elegir");

  const nueva = sesionParaOpcion(session.usuarioId, opcion);
  await createSession(nueva);
  redirect(destinoParaSesion(nueva));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function recuperarAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = recuperarSchema.safeParse({
    dni: formData.get("dni"),
    codigoRecuperacion: formData.get("codigoRecuperacion"),
    nuevaContrasena: formData.get("nuevaContrasena"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { dni, codigoRecuperacion, nuevaContrasena } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { dni } });
  if (!usuario?.recuperacionHash || !usuario.recuperacionSalt) {
    return { ok: false, error: "No existe una cuenta con ese DNI" };
  }
  if (!verifySecret(codigoRecuperacion.toUpperCase(), usuario.recuperacionHash, usuario.recuperacionSalt)) {
    return { ok: false, error: "Código de recuperación incorrecto" };
  }

  const nuevaPass = hashSecret(nuevaContrasena);
  const codigoNuevo = generateRecoveryCode();
  const nuevoCodigoHash = hashSecret(codigoNuevo);
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      contrasenaHash: nuevaPass.hash,
      contrasenaSalt: nuevaPass.salt,
      recuperacionHash: nuevoCodigoHash.hash,
      recuperacionSalt: nuevoCodigoHash.salt,
    },
  });

  return { ok: true, data: { codigoNuevo } };
}
