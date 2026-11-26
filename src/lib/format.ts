export function formatSoles(monto: number | string | { toString(): string }): string {
  const n = typeof monto === "number" ? monto : Number(monto.toString());
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(n);
}

export function formatFechaLima(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export const MEDIO_LABEL: Record<string, string> = {
  yape: "Yape",
  plin: "Plin",
  tarjeta: "Tarjeta",
  efectivo: "Efectivo",
};

export const ESTADO_PAGO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  pagado: "Pagado",
  rechazado: "Rechazado",
  vencido: "Vencido",
};

export const TIPO_MOVIMIENTO_LABEL: Record<string, string> = {
  aporte: "Aporte",
  pago_propuesto: "Pago propuesto",
  pago_aprobado: "Pago aprobado",
  pago_pagado: "Pago pagado",
  pago_rechazado: "Pago rechazado",
  pago_vencido: "Pago vencido",
};
