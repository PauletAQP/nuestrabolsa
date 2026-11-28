"use server";

import { prisma } from "@/lib/prisma";
import { appendRegistro } from "@/lib/registro";
import { generateComprobanteCode } from "@/lib/crypto";
import { getSession } from "@/lib/session";
import { getFamiliaConEstudiantes } from "@/lib/queries";
import { aportarSchema, type AportarInput } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export type FormResult = { ok: true } | { ok: false; error: string };

async function uniqueComprobanteCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const codigo = generateComprobanteCode();
    const existe = await prisma.aporte.findUnique({ where: { codigoComprobante: codigo } });
    if (!existe) return codigo;
  }
  throw new Error("No se pudo generar un código único de comprobante");
}

/** La familia registra un aporte digital (Yape, Plin, tarjeta): se confirma al instante. */
export async function aportarAction(input: AportarInput): Promise<FormResult> {
  const session = await getSession();
  if (!session || session.tipo !== "familia") {
    return { ok: false, error: "Debes iniciar sesión como padre o madre de familia" };
  }
  const parsed = aportarSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;
  if (data.medio === "efectivo") {
    return { ok: false, error: "El efectivo lo registra el tesorero" };
  }

  const familia = await getFamiliaConEstudiantes(session.familiaId);
  const estudiante = familia.estudiantes.find((e) => e.id === data.estudianteId);
  if (!estudiante) {
    return { ok: false, error: "Ese estudiante no pertenece a tu familia" };
  }
  const codigoComprobante = await uniqueComprobanteCode();

  await prisma.$transaction(async (tx) => {
    const registro = await appendRegistro(tx, {
      bolsaId: session.bolsaId,
      tipo: "aporte",
      detalle: `Aporte de S/ ${data.monto.toFixed(2)} de ${familia.nombre} para ${estudiante.nombre} (${data.medio})`,
    });

    await tx.aporte.create({
      data: {
        bolsaId: session.bolsaId,
        familiaId: familia.id,
        familiaNombre: familia.nombre,
        estudianteId: estudiante.id,
        estudianteNombre: estudiante.nombre,
        monto: data.monto,
        medio: data.medio,
        estado: "confirmado",
        registradoPor: familia.id,
        codigoComprobante,
        registroId: registro.id,
      },
    });
  });

  revalidatePath("/inicio");
  return { ok: true };
}

/** El tesorero anota un aporte en efectivo; queda pendiente hasta que otro responsable lo confirme. */
export async function registrarEfectivoAction(input: {
  familiaId: string;
  estudianteId: string;
  monto: number;
}): Promise<FormResult> {
  const session = await getSession();
  if (!session || session.tipo !== "responsable") {
    return { ok: false, error: "Solo un responsable del comité puede registrar efectivo" };
  }
  if (input.monto < 1) {
    return { ok: false, error: "El monto mínimo es S/ 1" };
  }

  const enBolsa = await prisma.familia.findFirst({
    where: { id: input.familiaId, bolsaId: session.bolsaId, estado: "activa" },
    select: { id: true },
  });
  const familia = enBolsa ? await getFamiliaConEstudiantes(enBolsa.id) : null;
  const estudiante = familia?.estudiantes.find((e) => e.id === input.estudianteId);
  if (!estudiante || !familia) {
    return { ok: false, error: "Familia o estudiante no encontrados en esta bolsa" };
  }

  const codigoComprobante = await uniqueComprobanteCode();

  await prisma.aporte.create({
    data: {
      bolsaId: session.bolsaId,
      familiaId: familia.id,
      familiaNombre: familia.nombre,
      estudianteId: estudiante.id,
      estudianteNombre: estudiante.nombre,
      monto: input.monto,
      medio: "efectivo",
      estado: "por_confirmar",
      registradoPor: session.responsableId,
      codigoComprobante,
    },
  });

  revalidatePath("/comite/efectivo");
  revalidatePath("/comite/crm");
  revalidatePath("/comite");
  return { ok: true };
}

/** Un responsable distinto al que registró el efectivo lo confirma; ahí recién cuenta en el saldo. */
export async function confirmarEfectivoAction(aporteId: string): Promise<FormResult> {
  const session = await getSession();
  if (!session || session.tipo !== "responsable") {
    return { ok: false, error: "Solo un responsable del comité puede confirmar" };
  }

  const aporte = await prisma.aporte.findFirst({ where: { id: aporteId, bolsaId: session.bolsaId } });
  if (!aporte || aporte.estado !== "por_confirmar") {
    return { ok: false, error: "Este aporte ya no está pendiente de confirmación" };
  }
  if (aporte.registradoPor === session.responsableId) {
    return { ok: false, error: "Otro responsable debe confirmar este efectivo, no quien lo registró" };
  }

  await prisma.$transaction(async (tx) => {
    const registro = await appendRegistro(tx, {
      bolsaId: session.bolsaId,
      tipo: "aporte",
      detalle: `Aporte en efectivo de S/ ${Number(aporte.monto).toFixed(2)} de ${aporte.familiaNombre} para ${aporte.estudianteNombre} confirmado`,
    });

    await tx.aporte.update({
      where: { id: aporte.id },
      data: { estado: "confirmado", confirmadoPor: session.responsableId, registroId: registro.id },
    });
  });

  revalidatePath("/comite/efectivo");
  revalidatePath("/comite/crm");
  revalidatePath("/comite");
  return { ok: true };
}
