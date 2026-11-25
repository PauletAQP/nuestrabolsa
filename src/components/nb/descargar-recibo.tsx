"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatFechaLima, MEDIO_LABEL } from "@/lib/format";

export function DescargarRecibo({
  bolsaNombre,
  colegio,
  familiaNombre,
  estudianteNombre,
  monto,
  medio,
  estado,
  fecha,
  codigoComprobante,
}: {
  bolsaNombre: string;
  colegio: string;
  familiaNombre: string;
  estudianteNombre: string;
  monto: number;
  medio: string;
  estado: string;
  fecha: Date;
  codigoComprobante: string;
}) {
  async function descargar() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Nuestra Bolsa · Recibo de aporte", 20, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${bolsaNombre} · ${colegio}`, 20, 28);

    doc.setDrawColor(220);
    doc.line(20, 34, 190, 34);

    const filas: [string, string][] = [
      ["Familia", familiaNombre],
      ["Estudiante", estudianteNombre],
      ["Monto", `S/ ${monto.toFixed(2)}`],
      ["Medio de pago", MEDIO_LABEL[medio] ?? medio],
      ["Estado", estado === "confirmado" ? "Confirmado" : "Por confirmar"],
      ["Fecha", formatFechaLima(fecha)],
      ["Código de comprobante", codigoComprobante],
    ];

    let y = 46;
    doc.setTextColor(20);
    for (const [label, valor] of filas) {
      doc.setFont("helvetica", "bold");
      doc.text(label, 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(valor, 80, y);
      y += 9;
    }

    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(
      "Este comprobante puede verificarse en cualquier momento buscando el código en la vista pública de la bolsa.",
      20,
      y + 6,
      { maxWidth: 170 }
    );

    doc.save(`recibo-${codigoComprobante}.pdf`);
  }

  return (
    <Button variant="outline" onClick={descargar}>
      <Download className="size-4" /> Descargar recibo PDF
    </Button>
  );
}
