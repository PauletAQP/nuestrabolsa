"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aportarAction } from "@/lib/actions/aportes";

const MEDIOS = [
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
  { value: "tarjeta", label: "Tarjeta" },
] as const;

export function AportarForm({ estudiantes }: { estudiantes: { id: string; nombre: string }[] }) {
  const [estudianteId, setEstudianteId] = useState(estudiantes[0]?.id ?? "");
  const [monto, setMonto] = useState("");
  const [medio, setMedio] = useState<(typeof MEDIOS)[number]["value"]>("yape");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function enviar() {
    if (!estudianteId) return toast.error("Selecciona un estudiante");
    if (!monto || Number(monto) < 1) return toast.error("El monto mínimo es S/ 1");

    startTransition(async () => {
      const res = await aportarAction({ estudianteId, monto: Number(monto), medio });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Aporte confirmado. Gracias por tu cuota.");
      router.push("/inicio");
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Estudiante</Label>
        <Select
          items={Object.fromEntries(estudiantes.map((e) => [e.id, e.nombre]))}
          value={estudianteId}
          onValueChange={(v) => v && setEstudianteId(v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {estudiantes.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Monto (S/)</Label>
        <Input type="number" min={1} value={monto} onChange={(e) => setMonto(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Medio de pago</Label>
        <Select
          items={Object.fromEntries(MEDIOS.map((m) => [m.value, m.label]))}
          value={medio}
          onValueChange={(v) => v && setMedio(v as typeof medio)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MEDIOS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          ¿Pagaste en efectivo? Entrégaselo al tesorero; él lo registra y otro responsable lo confirma.
        </p>
      </div>
      <Button className="w-full" onClick={enviar} disabled={pending}>
        {pending ? "Confirmando..." : "Confirmar aporte"}
      </Button>
    </div>
  );
}
