"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { formatFechaLima, ESTADO_PAGO_LABEL } from "@/lib/format";

type PagoReporte = {
  proveedor: string;
  motivo: string;
  monto: number;
  estado: string;
  createdDate: Date;
};

export function DescargarReporteGastos({
  bolsaNombre,
  colegio,
  saldo,
  totalAportado,
  totalPagado,
  pagos,
}: {
  bolsaNombre: string;
  colegio: string;
  saldo: number;
  totalAportado: number;
  totalPagado: number;
  pagos: PagoReporte[];
}) {
  async function descargar() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Nuestra Bolsa · Reporte de gastos", 20, 20);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`${bolsaNombre} · ${colegio}`, 20, 28);
    doc.text(`Generado el ${formatFechaLima(new Date())}`, 20, 34);

    doc.setDrawColor(220);
    doc.line(20, 40, 190, 40);

    doc.setTextColor(20);
    doc.setFontSize(11);
    doc.text(`Aportado: S/ ${totalAportado.toFixed(2)}`, 20, 48);
    doc.text(`Pagado: S/ ${totalPagado.toFixed(2)}`, 80, 48);
    doc.text(`Saldo: S/ ${saldo.toFixed(2)}`, 140, 48);

    let y = 60;
    doc.setFont("helvetica", "bold");
    doc.text("Proveedor", 20, y);
    doc.text("Motivo", 65, y);
    doc.text("Monto", 140, y);
    doc.text("Estado", 165, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.setDrawColor(230);
    doc.line(20, y - 4, 190, y - 4);

    for (const p of pagos) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(p.proveedor.slice(0, 22), 20, y);
      doc.text(p.motivo.slice(0, 35), 65, y, { maxWidth: 70 });
      doc.text(`S/ ${p.monto.toFixed(2)}`, 140, y);
      doc.text(ESTADO_PAGO_LABEL[p.estado] ?? p.estado, 165, y);
      y += 8;
    }

    doc.save(`reporte-gastos-${bolsaNombre.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  }

  return (
    <Button variant="outline" onClick={descargar}>
      <Download className="size-4" /> Descargar reporte PDF
    </Button>
  );
}
