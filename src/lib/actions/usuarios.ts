"use server";

import { prisma } from "@/lib/prisma";
import { hashSecret } from "@/lib/crypto";
import { getSession } from "@/lib/session";
import { crearAdminSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actions/auth";

/** Solo el superadmin crea cuentas con rol de administrador. */
export async function crearAdminAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const session = await getSession();
  if (!session || session.tipo !== "usuario" || session.rol !== "superadmin") {
    return { ok: false, error: "Solo el superadmin puede crear administradores" };
  }

  const parsed = crearAdminSchema.safeParse({
    nombre: formData.get("nombre"),
    apellidos: formData.get("apellidos"),
    dni: formData.get("dni"),
    celular: formData.get("celular"),
    contrasena: formData.get("contrasena"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { contrasena, ...data } = parsed.data;

  if (await prisma.usuario.findUnique({ where: { dni: data.dni } })) {
    return { ok: false, error: "Ya existe un usuario con ese DNI" };
  }

  const { hash, salt } = hashSecret(contrasena);
  await prisma.usuario.create({
    data: { ...data, rol: "admin", contrasenaHash: hash, contrasenaSalt: salt, createdById: session.usuarioId },
  });

  revalidatePath("/superadmin");
  return { ok: true, data: { nombre: `${data.nombre} ${data.apellidos}` } };
}
