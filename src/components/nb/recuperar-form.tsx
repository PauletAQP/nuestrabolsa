"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { recuperarAction, type ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Guardando..." : "Cambiar contraseña"}
    </Button>
  );
}

export function RecuperarForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(recuperarAction, null);

  if (state?.ok) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm">Tu contraseña se cambió. Tu nuevo código de recuperación es:</p>
        <p className="rounded-md bg-muted p-3 font-mono text-lg font-semibold">
          {state.data?.codigoNuevo}
        </p>
        <p className="text-xs text-muted-foreground">
          Guárdalo en un lugar seguro: lo necesitarás la próxima vez que olvides tu contraseña.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dni">DNI</Label>
        <Input id="dni" name="dni" inputMode="numeric" maxLength={8} placeholder="12345678" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="codigoRecuperacion">Código de recuperación</Label>
        <Input id="codigoRecuperacion" name="codigoRecuperacion" placeholder="DEMO-2026" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nuevaContrasena">Nueva contraseña</Label>
        <Input id="nuevaContrasena" name="nuevaContrasena" type="password" required minLength={6} />
      </div>
      {state && !state.ok && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
