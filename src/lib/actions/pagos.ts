"use server";

import { prisma } from "@/lib/prisma";
import { appendRegistro } from "@/lib/registro";
import { getSession } from "@/lib/session";
import { proponerPagoSchema, decidirPagoSchema, type ProponerPagoInput } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

export type FormResult = { ok: true } | { ok: false; error: string };

const DIAS_VENCIMIENTO = 7;

export async function proponerPagoAction(input: ProponerPagoInput): Promise<FormResult> {
  const session = await getSession();
  if (!session || session.tipo !== "responsable") {
    return { ok: false, error: "Solo un responsable del comité puede proponer un pago" };
  }
  const parsed = proponerPagoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const proponente = await prisma.responsable.findUniqueOrThrow({ where: { id: session.responsableId } });
  const venceEn = new Date(Date.now() + DIAS_VENCIMIENTO * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    const registro = await appendRegistro(tx, {
      bolsaId: session.bolsaId,
      tipo: "pago_propuesto",
      detalle: `${proponente.nombre} propone pagar S/ ${data.monto.toFixed(2)} a ${data.proveedor}: ${data.motivo}`,
    });

    const pago = await tx.pago.create({
      data: {
        bolsaId: session.bolsaId,
        proveedor: data.proveedor,
        cuentaProveedor: data.cuentaProveedor,
        monto: data.monto,
        motivo: data.motivo,
        proponenteId: proponente.id,
        proponenteNombre: proponente.nombre,
        estado: "pendiente",
        venceEn,
        comprobanteUri: data.comprobanteUri,
        registroId: registro.id,
      },
    });

    await tx.aprobacion.create({
      data: {
        bolsaId: session.bolsaId,
        pagoId: pago.id,
        responsableId: proponente.id,
        responsableNombre: proponente.nombre,
        decision: "aprobo",
      },
    });
  });

  revalidatePath("/comite");
  return { ok: true };
}

export async function decidirPagoAction(input: {
  pagoId: string;
  decision: "aprobo" | "rechazo";
  motivoRechazo?: string;
}): Promise<FormResult> {
  const session = await getSession();
  if (!session || session.tipo !== "responsable") {
    return { ok: false, error: "Solo un responsable del comité puede decidir sobre un pago" };
  }
  const parsed = decidirPagoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;

  const pago = await prisma.pago.findFirst({
    where: { id: data.pagoId, bolsaId: session.bolsaId },
    include: { aprobaciones: true },
  });
  if (!pago) return { ok: false, error: "Pago no encontrado" };
  if (pago.estado !== "pendiente") return { ok: false, error: "Este pago ya no está pendiente" };

  const yaDecidio = pago.aprobaciones.some((a) => a.responsableId === session.responsableId);
  if (yaDecidio) return { ok: false, error: "Ya registraste una decisión sobre este pago" };

  const responsable = await prisma.responsable.findUniqueOrThrow({ where: { id: session.responsableId } });

  if (data.decision === "rechazo") {
    await prisma.$transaction(async (tx) => {
      await tx.aprobacion.create({
        data: {
          bolsaId: session.bolsaId,
          pagoId: pago.id,
          responsableId: responsable.id,
          responsableNombre: responsable.nombre,
          decision: "rechazo",
        },
      });

      const registro = await appendRegistro(tx, {
        bolsaId: session.bolsaId,
        tipo: "pago_rechazado",
        detalle: `${responsable.nombre} rechazó el pago a ${pago.proveedor}: ${data.motivoRechazo ?? "sin motivo indicado"}`,
      });

      await tx.pago.update({
        where: { id: pago.id },
        data: { estado: "rechazado", motivoRechazo: data.motivoRechazo, registroId: registro.id },
      });
    });

    revalidatePath("/comite");
    return { ok: true };
  }

  const totalAprobaciones = pago.aprobaciones.length + 1;

  await prisma.$transaction(async (tx) => {
    await tx.aprobacion.create({
      data: {
        bolsaId: session.bolsaId,
        pagoId: pago.id,
        responsableId: responsable.id,
        responsableNombre: responsable.nombre,
        decision: "aprobo",
      },
    });

    if (totalAprobaciones >= 3) {
      const registro = await appendRegistro(tx, {
        bolsaId: session.bolsaId,
        tipo: "pago_pagado",
        detalle: `Pago de S/ ${Number(pago.monto).toFixed(2)} a ${pago.proveedor} completó 3 de 3 aprobaciones y fue pagado`,
      });
      await tx.pago.update({
        where: { id: pago.id },
        data: { estado: "pagado", pagadoEn: new Date(), registroId: registro.id },
      });
    } else {
      const registro = await appendRegistro(tx, {
        bolsaId: session.bolsaId,
        tipo: "pago_aprobado",
        detalle: `${responsable.nombre} aprobó el pago a ${pago.proveedor} (${totalAprobaciones} de 3)`,
      });
      await tx.pago.update({ where: { id: pago.id }, data: { registroId: registro.id } });
    }
  });

  revalidatePath("/comite");
  return { ok: true };
}

/** Marca como vencidos los pagos pendientes cuya fecha límite ya pasó. Se llama antes de listar pagos. */
export async function marcarVencidos(bolsaId: string) {
  const vencidos = await prisma.pago.findMany({
    where: { bolsaId, estado: "pendiente", venceEn: { lt: new Date() } },
  });

  for (const pago of vencidos) {
    await prisma.$transaction(async (tx) => {
      const registro = await appendRegistro(tx, {
        bolsaId,
        tipo: "pago_vencido",
        detalle: `El pago de S/ ${Number(pago.monto).toFixed(2)} a ${pago.proveedor} venció sin completar las aprobaciones`,
      });
      await tx.pago.update({ where: { id: pago.id }, data: { estado: "vencido", registroId: registro.id } });
    });
  }
}
