"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/nb/file-upload";
import { proponerPagoAction } from "@/lib/actions/pagos";

export function ProponerPagoForm() {
  const [proveedor, setProveedor] = useState("");
  const [cuentaProveedor, setCuentaProveedor] = useState("");
  const [monto, setMonto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [comprobanteUri, setComprobanteUri] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function enviar() {
    if (!proveedor.trim()) return toast.error("Indica a quién se le paga");
    if (!monto || Number(monto) < 1) return toast.error("El monto mínimo es S/ 1");
    if (!motivo.trim()) return toast.error("Indica el motivo del gasto");

    startTransition(async () => {
      const res = await proponerPagoAction({
        proveedor,
        cuentaProveedor: cuentaProveedor || undefined,
        monto: Number(monto),
        motivo,
        comprobanteUri,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Pago propuesto. Ya quedó como tu primera aprobación.");
      router.push("/comite");
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Proveedor</Label>
        <Input value={proveedor} onChange={(e) => setProveedor(e.target.value)} placeholder="¿A quién se le paga?" />
      </div>
      <div className="space-y-2">
        <Label>Cuenta o Yape/Plin del proveedor (opcional)</Label>
        <Input value={cuentaProveedor} onChange={(e) => setCuentaProveedor(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Monto (S/)</Label>
        <Input type="number" min={1} value={monto} onChange={(e) => setMonto(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Motivo</Label>
        <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="¿Para qué es el gasto?" />
      </div>
      <FileUpload id="comprobante" label="Foto de la cotización (privada, opcional)" onUploaded={setComprobanteUri} />
      <Button className="w-full" onClick={enviar} disabled={pending}>
        {pending ? "Proponiendo..." : "Proponer pago"}
      </Button>
      <p className="text-xs text-muted-foreground">
        El pago vence en 7 días si no se completan las 3 aprobaciones.
      </p>
    </div>
  );
}
