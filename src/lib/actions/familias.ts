"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { editarFamiliaSchema, type EditarFamiliaInput } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export type FormResult = { ok: true } | { ok: false; error: string };

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

  // Verificar que la familia pertenece a la bolsa del comité
  const familia = await prisma.familia.findFirst({
    where: { id: data.familiaId, bolsaId: session.bolsaId },
    include: { estudiantes: true },
  });

  if (!familia) {
    return { ok: false, error: "La familia no existe o no pertenece a esta bolsa" };
  }

  // Si cambia el DNI, validar que no exista duplicado en esta bolsa
  if (data.dni !== familia.dni) {
    const duplicado = await prisma.familia.findFirst({
      where: {
        bolsaId: session.bolsaId,
        dni: data.dni,
        id: { not: data.familiaId },
      },
    });

    if (duplicado) {
      return { ok: false, error: "Ya existe otra familia con ese número de DNI en esta bolsa" };
    }
  }

  // Aplicar cambios en una transacción
  await prisma.$transaction(async (tx) => {
    // 1. Actualizar datos principales de la familia
    await tx.familia.update({
      where: { id: familia.id },
      data: {
        nombre: data.nombre.trim(),
        dni: data.dni.trim(),
        celular: data.celular.trim(),
      },
    });

    // 2. Gestionar estudiantes
    const estudiantesEntrantes = data.estudiantes.map((e) => ({
      id: e.id && !e.id.startsWith("nuevo_") ? e.id : undefined,
      nombre: e.nombre.trim(),
    }));

    const idsParaMantener = estudiantesEntrantes
      .map((e) => e.id)
      .filter((id): id is string => Boolean(id));

    // Borrar estudiantes que ya no están en la lista
    if (idsParaMantener.length > 0) {
      await tx.estudiante.deleteMany({
        where: {
          familiaId: familia.id,
          id: { notIn: idsParaMantener },
        },
      });
    }

    // Actualizar los existentes y crear los nuevos
    for (const est of estudiantesEntrantes) {
      if (est.id) {
        await tx.estudiante.update({
          where: { id: est.id },
          data: { nombre: est.nombre },
        });
      } else {
        await tx.estudiante.create({
          data: {
            bolsaId: session.bolsaId,
            familiaId: familia.id,
            nombre: est.nombre,
          },
        });
      }
    }
  });

  revalidatePath("/comite/crm");
  revalidatePath("/comite/familias");
  revalidatePath("/comite");

  return { ok: true };
}
