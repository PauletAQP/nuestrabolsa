"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { editarFamiliaSchema, type EditarFamiliaInput } from "@/lib/schemas";
import { inscribirEstudiantes } from "@/lib/inscripciones";
import { revalidatePath } from "next/cache";

export type FormResult = { ok: true } | { ok: false; error: string };

/**
 * El comité edita los datos de un padre y los hijos inscritos en su bolsa.
 * Los datos personales viven en Usuario (cuenta única), así que el cambio se ve en todas sus bolsas.
 */
export async function editarFamiliaAction(input: EditarFamiliaInput): Promise<FormResult> {
  const session = await getSession();
  if (!session || session.tipo !== "responsable") {
    return { ok: false, error: "Solo un miembro del comité puede editar los datos de una familia" };
  }

  const parsed = editarFamiliaSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  // La familia debe pertenecer a la bolsa del comité
  const familia = await prisma.familia.findFirst({
    where: { id: data.familiaId, bolsaId: session.bolsaId },
    include: { usuario: true, inscripciones: { select: { estudianteId: true } } },
  });
  if (!familia?.usuario) {
    return { ok: false, error: "La familia no existe o no pertenece a esta bolsa" };
  }
  const usuario = familia.usuario;

  // El DNI identifica a la cuenta: no puede repetirse en toda la plataforma
  const dni = data.dni.trim();
  if (dni !== usuario.dni) {
    const duplicado = await prisma.usuario.findUnique({ where: { dni } });
    if (duplicado) {
      return { ok: false, error: "Ya existe otra cuenta con ese número de DNI" };
    }
  }

  // Solo se pueden editar estudiantes inscritos por esta familia en esta bolsa
  const inscritos = new Set(familia.inscripciones.map((i) => i.estudianteId));
  const existentes = data.estudiantes
    .filter((e) => e.id && !e.id.startsWith("nuevo_"))
    .map((e) => ({ id: e.id as string, nombre: e.nombre.trim() }));
  if (existentes.some((e) => !inscritos.has(e.id))) {
    return { ok: false, error: "Uno de los estudiantes no pertenece a esta familia" };
  }
  const nuevos = data.estudiantes
    .filter((e) => !e.id || e.id.startsWith("nuevo_"))
    .map((e) => e.nombre.trim());

  await prisma.$transaction(async (tx) => {
    await tx.usuario.update({
      where: { id: usuario.id },
      data: {
        nombre: data.nombre.trim(),
        apellidos: data.apellidos.trim(),
        dni,
        celular: data.celular.trim(),
      },
    });

    // Quitar de la bolsa a los estudiantes que ya no están en la lista. El Estudiante
    // se conserva: puede tener aportes o estar inscrito en otras bolsas.
    await tx.inscripcion.deleteMany({
      where: { familiaId: familia.id, estudianteId: { notIn: existentes.map((e) => e.id) } },
    });

    for (const est of existentes) {
      await tx.estudiante.update({ where: { id: est.id }, data: { nombre: est.nombre } });
    }

    await inscribirEstudiantes(tx, {
      bolsaId: session.bolsaId,
      familiaId: familia.id,
      apoderadoId: usuario.id,
      nombres: nuevos,
    });
  });

  revalidatePath("/comite/crm");
  revalidatePath("/comite/familias");
  revalidatePath("/comite");

  return { ok: true };
}
