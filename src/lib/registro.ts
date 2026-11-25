import type { Prisma, TipoMovimiento } from "@prisma/client";
import { computeChainCode } from "./crypto";

type Tx = Prisma.TransactionClient;

/**
 * Agrega un movimiento a la cadena de la bolsa dentro de una transacción.
 * Lee la secuencia/código anterior y encadena el nuevo código a partir de él,
 * para que cualquiera pueda verificar que nada se alteró.
 */
export async function appendRegistro(
  tx: Tx,
  params: { bolsaId: string; tipo: TipoMovimiento; detalle: string }
) {
  const ultimo = await tx.registro.findFirst({
    where: { bolsaId: params.bolsaId },
    orderBy: { secuencia: "desc" },
  });

  const secuencia = (ultimo?.secuencia ?? 0) + 1;
  const anterior = ultimo?.codigo ?? null;
  const codigo = computeChainCode({
    bolsaId: params.bolsaId,
    secuencia,
    tipo: params.tipo,
    detalle: params.detalle,
    anterior,
  });

  return tx.registro.create({
    data: {
      bolsaId: params.bolsaId,
      tipo: params.tipo,
      detalle: params.detalle,
      secuencia,
      codigo,
      anterior,
      fuente: "demostracion",
    },
  });
}

/** Recalcula la cadena completa y dice si cada eslabón es consistente. */
export function verificarCadena(
  registros: { secuencia: number; codigo: string; anterior: string | null; tipo: string; detalle: string; bolsaId: string }[]
) {
  const ordenados = [...registros].sort((a, b) => a.secuencia - b.secuencia);
  let anteriorEsperado: string | null = null;
  const resultado: { secuencia: number; valido: boolean }[] = [];

  for (const r of ordenados) {
    const codigoEsperado = computeChainCode({
      bolsaId: r.bolsaId,
      secuencia: r.secuencia,
      tipo: r.tipo,
      detalle: r.detalle,
      anterior: anteriorEsperado,
    });
    const valido = codigoEsperado === r.codigo && r.anterior === anteriorEsperado;
    resultado.push({ secuencia: r.secuencia, valido });
    anteriorEsperado = r.codigo;
  }

  return { valido: resultado.every((r) => r.valido), detalle: resultado };
}
