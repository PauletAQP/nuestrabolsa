"use server";

import { prisma } from "@/lib/prisma";
import { hashSecret, verifySecret, generateRecoveryCode } from "@/lib/crypto";
import { createSession, destroySession } from "@/lib/session";
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
  if (usuario && verifySecret(contrasena, usuario.contrasenaHash, usuario.contrasenaSalt)) {
    await createSession({ tipo: "usuario", usuarioId: usuario.id, rol: usuario.rol });
    redirect(usuario.rol === "superadmin" ? "/superadmin" : "/admin");
  }

  const responsable = await prisma.responsable.findFirst({ where: { dni } });
  if (responsable?.contrasenaHash && responsable.contrasenaSalt) {
    if (verifySecret(contrasena, responsable.contrasenaHash, responsable.contrasenaSalt)) {
      await createSession({
        tipo: "responsable",
        responsableId: responsable.id,
        bolsaId: responsable.bolsaId,
        rol: responsable.rol,
      });
      redirect("/comite");
    }
  }

  const familia = await prisma.familia.findFirst({ where: { dni } });
  if (familia?.contrasenaHash && familia.contrasenaSalt) {
    if (verifySecret(contrasena, familia.contrasenaHash, familia.contrasenaSalt)) {
      await createSession({ tipo: "familia", familiaId: familia.id, bolsaId: familia.bolsaId });
      redirect("/inicio");
    }
  }

  return { ok: false, error: "DNI o contraseña incorrectos" };
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

  const familia = await prisma.familia.findFirst({ where: { dni } });
  if (!familia?.recuperacionHash || !familia.recuperacionSalt) {
    return { ok: false, error: "No existe una cuenta con ese DNI" };
  }
  if (!verifySecret(codigoRecuperacion.toUpperCase(), familia.recuperacionHash, familia.recuperacionSalt)) {
    return { ok: false, error: "Código de recuperación incorrecto" };
  }

  const nuevaPass = hashSecret(nuevaContrasena);
  const codigoNuevo = generateRecoveryCode();
  const nuevoCodigoHash = hashSecret(codigoNuevo);
  await prisma.familia.update({
    where: { id: familia.id },
    data: {
      contrasenaHash: nuevaPass.hash,
      contrasenaSalt: nuevaPass.salt,
      recuperacionHash: nuevoCodigoHash.hash,
      recuperacionSalt: nuevoCodigoHash.salt,
    },
  });

  return { ok: true, data: { codigoNuevo } };
}
