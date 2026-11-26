"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { decidirPagoAction } from "@/lib/actions/pagos";
import { ThumbsUp, ThumbsDown } from "lucide-react";

export function DecidirPago({ pagoId }: { pagoId: string }) {
  const [motivo, setMotivo] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function aprobar() {
    startTransition(async () => {
      const res = await decidirPagoAction({ pagoId, decision: "aprobo" });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Aprobación registrada");
        router.refresh();
      }
    });
  }

  function rechazar() {
    startTransition(async () => {
      const res = await decidirPagoAction({ pagoId, decision: "rechazo", motivoRechazo: motivo });
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Pago rechazado");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button onClick={aprobar} disabled={pending}>
        <ThumbsUp className="size-4" /> Aprobar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="outline" disabled={pending} />}>
          <ThumbsDown className="size-4" /> Rechazar
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar pago</DialogTitle>
            <DialogDescription>El pago quedará anulado y anotado con el motivo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Motivo del rechazo</Label>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Explica por qué rechazas este pago" />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={rechazar} disabled={pending || !motivo.trim()}>
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
