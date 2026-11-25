"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { crearAdminAction } from "@/lib/actions/usuarios";
import type { ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creando..." : "Crear administrador"}
    </Button>
  );
}

export function CrearAdminForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(crearAdminAction, null);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombres</Label>
        <Input id="nombre" name="nombre" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="apellidos">Apellidos</Label>
        <Input id="apellidos" name="apellidos" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dni">DNI</Label>
        <Input id="dni" name="dni" inputMode="numeric" maxLength={8} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="celular">Celular</Label>
        <Input id="celular" name="celular" inputMode="numeric" maxLength={9} required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="contrasena">Contraseña inicial</Label>
        <Input id="contrasena" name="contrasena" type="password" minLength={6} required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        {state && !state.ok && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}
        {state?.ok && <p className="text-sm text-green-700">Administrador creado: {state.data?.nombre}</p>}
        <SubmitButton />
      </div>
    </form>
  );
}
