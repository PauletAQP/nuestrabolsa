import { requireResponsable, getEfectivoPorConfirmar, getFamiliasBolsa } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSoles, formatFechaLima } from "@/lib/format";
import { RegistrarEfectivoForm } from "@/components/nb/registrar-efectivo-form";
import { ConfirmarEfectivoButton } from "@/components/nb/confirmar-efectivo-button";

export default async function EfectivoPage() {
  const session = await requireResponsable();
  const [responsable, familias, pendientes] = await Promise.all([
    prisma.responsable.findUniqueOrThrow({ where: { id: session.responsableId } }),
    getFamiliasBolsa(session.bolsaId),
    getEfectivoPorConfirmar(session.bolsaId),
  ]);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {responsable.esTesorero ? (
        <Card>
          <CardHeader>
            <CardTitle>Registrar efectivo recibido</CardTitle>
            <CardDescription>Como tesorero, anota el efectivo que te entregó una familia</CardDescription>
          </CardHeader>
          <CardContent>
            <RegistrarEfectivoForm familias={familias} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Registrar efectivo</CardTitle>
            <CardDescription>Solo el tesorero puede anotar un aporte en efectivo</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Por confirmar</CardTitle>
          <CardDescription>
            Otro responsable (no quien lo registró) debe confirmar para que cuente en el saldo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay efectivo pendiente de confirmación.</p>
          ) : (
            <ul className="space-y-2">
              {pendientes.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {a.familiaNombre} · {a.estudianteNombre}
                    </p>
                    <p className="text-muted-foreground">{formatFechaLima(a.fecha)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{formatSoles(a.monto)}</span>
                    {a.registradoPor !== session.responsableId ? (
                      <ConfirmarEfectivoButton aporteId={a.id} />
                    ) : (
                      <span className="text-xs text-muted-foreground">Esperando a otro responsable</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
