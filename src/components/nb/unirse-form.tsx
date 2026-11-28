"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { unirseAction } from "@/lib/actions/bolsa";
import { Trash2, Plus } from "lucide-react";

export function UnirseForm({ codigoInvitacion }: { codigoInvitacion: string }) {
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [dni, setDni] = useState("");
  const [celular, setCelular] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [estudiantes, setEstudiantes] = useState<string[]>([""]);
  const [pending, startTransition] = useTransition();

  function enviar() {
    if (!nombre.trim()) return toast.error("Ingresa tu nombre");
    if (!apellidos.trim()) return toast.error("Ingresa tus apellidos");
    if (!/^\d{8}$/.test(dni)) return toast.error("El DNI debe tener 8 dígitos");
    if (!/^\d{9}$/.test(celular)) return toast.error("El celular debe tener 9 dígitos");
    if (contrasena.length < 6) return toast.error("La contraseña debe tener al menos 6 caracteres");
    const nombresValidos = estudiantes.map((e) => e.trim()).filter(Boolean);
    if (nombresValidos.length === 0) return toast.error("Agrega al menos un estudiante");

    startTransition(async () => {
      const res = await unirseAction({
        codigoInvitacion,
        nombre,
        apellidos,
        dni,
        celular,
        contrasena,
        estudiantes: nombresValidos.map((nombre) => ({ nombre })),
      });
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nombres</Label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombres del padre o madre" />
      </div>
      <div className="space-y-2">
        <Label>Apellidos</Label>
        <Input value={apellidos} onChange={(e) => setApellidos(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>DNI (será tu usuario)</Label>
        <Input maxLength={8} value={dni} onChange={(e) => setDni(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Celular</Label>
        <Input maxLength={9} value={celular} onChange={(e) => setCelular(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Contraseña</Label>
        <p className="text-xs text-muted-foreground">Si ya tienes cuenta en otra bolsa, usa tu contraseña actual.</p>
        <Input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Estudiantes</Label>
        {estudiantes.map((nombre, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={nombre}
              onChange={(e) =>
                setEstudiantes((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)))
              }
              placeholder={`Nombre del estudiante ${i + 1}`}
            />
            {estudiantes.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setEstudiantes((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setEstudiantes((prev) => [...prev, ""])}>
          <Plus className="size-4" /> Agregar otro estudiante
        </Button>
      </div>

      <Button className="w-full" onClick={enviar} disabled={pending}>
        {pending ? "Uniéndome..." : "Unirme a la bolsa"}
      </Button>
    </div>
  );
}
