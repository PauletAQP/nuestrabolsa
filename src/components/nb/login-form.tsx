"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type ActionResult } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Ingresando..." : "Ingresar"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(loginAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dni">DNI</Label>
        <Input id="dni" name="dni" inputMode="numeric" maxLength={8} placeholder="12345678" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contrasena">Contraseña</Label>
        <Input id="contrasena" name="contrasena" type="password" required />
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
