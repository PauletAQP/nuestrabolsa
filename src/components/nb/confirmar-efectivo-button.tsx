"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { confirmarEfectivoAction } from "@/lib/actions/aportes";

export function ConfirmarEfectivoButton({ aporteId }: { aporteId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirmar() {
    startTransition(async () => {
      const res = await confirmarEfectivoAction(aporteId);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Efectivo confirmado");
        router.refresh();
      }
    });
  }

  return (
    <Button size="sm" onClick={confirmar} disabled={pending}>
      {pending ? "Confirmando..." : "Confirmar"}
    </Button>
  );
}
