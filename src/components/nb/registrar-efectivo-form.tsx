"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registrarEfectivoAction } from "@/lib/actions/aportes";

type Familia = { id: string; nombre: string; estudiantes: { id: string; nombre: string }[] };

export function RegistrarEfectivoForm({ familias }: { familias: Familia[] }) {
  const [familiaId, setFamiliaId] = useState(familias[0]?.id ?? "");
  const [estudianteId, setEstudianteId] = useState(familias[0]?.estudiantes[0]?.id ?? "");
  const [monto, setMonto] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const estudiantes = useMemo(
    () => familias.find((f) => f.id === familiaId)?.estudiantes ?? [],
    [familias, familiaId]
  );

  function cambiarFamilia(id: string) {
    setFamiliaId(id);
    const primero = familias.find((f) => f.id === id)?.estudiantes[0]?.id ?? "";
    setEstudianteId(primero);
  }

  function enviar() {
    if (!familiaId || !estudianteId) return toast.error("Selecciona familia y estudiante");
    if (!monto || Number(monto) < 1) return toast.error("El monto mínimo es S/ 1");

    startTransition(async () => {
      const res = await registrarEfectivoAction({ familiaId, estudianteId, monto: Number(monto) });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Efectivo registrado. Falta que otro responsable lo confirme.");
      setMonto("");
      router.refresh();
    });
  }

  if (familias.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay familias registradas.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Familia</Label>
        <Select
          items={Object.fromEntries(familias.map((f) => [f.id, f.nombre]))}
          value={familiaId}
          onValueChange={(v) => v && cambiarFamilia(v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {familias.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
        <Label>Monto recibido (S/)</Label>
        <Input type="number" min={1} value={monto} onChange={(e) => setMonto(e.target.value)} />
      </div>
      <Button onClick={enviar} disabled={pending}>
        {pending ? "Registrando..." : "Registrar efectivo"}
      </Button>
    </div>
  );
}
