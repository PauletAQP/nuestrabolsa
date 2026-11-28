import { notFound } from "next/navigation";
import { requireResponsable, getPagoDetalle, getResponsables } from "@/lib/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSoles, formatFechaLima, ESTADO_PAGO_LABEL } from "@/lib/format";
import { DecidirPago } from "@/components/nb/decidir-pago";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export default async function PagoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireResponsable();
  const { id } = await params;
  const [pago, responsables] = await Promise.all([
    getPagoDetalle(session.bolsaId, id),
    getResponsables(session.bolsaId),
  ]);
  if (!pago) notFound();

  const yaDecidio = pago.aprobaciones.some((a) => a.responsableId === session.responsableId);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{pago.proveedor}</CardTitle>
              <CardDescription>{pago.motivo}</CardDescription>
            </div>
            <Badge
              variant={
                pago.estado === "pagado" ? "default" : pago.estado === "pendiente" ? "secondary" : "destructive"
              }
            >
              {ESTADO_PAGO_LABEL[pago.estado]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monto</span>
            <span className="font-medium">{formatSoles(pago.monto)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Propuesto por</span>
            <span className="font-medium">{pago.proponenteNombre}</span>
          </div>
          {pago.cuentaProveedor && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cuenta del proveedor</span>
              <span className="font-medium">{pago.cuentaProveedor}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Propuesto el</span>
            <span>{formatFechaLima(pago.createdDate)}</span>
          </div>
          {pago.venceEn && pago.estado === "pendiente" && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vence</span>
              <span>{formatFechaLima(pago.venceEn)}</span>
            </div>
          )}
          {pago.motivoRechazo && (
            <div className="rounded-lg bg-destructive/10 p-3 text-destructive">
              Motivo de rechazo: {pago.motivoRechazo}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aprobaciones (3 de 3 requeridas)</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {responsables.map((r) => {
              const aprobacion = pago.aprobaciones.find((a) => a.responsableId === r.id);
              return (
                <li key={r.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <span>
                    {r.nombre} {r.apellidos} · <span className="text-muted-foreground">{r.cargo}</span>
                  </span>
                  {!aprobacion ? (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="size-4" /> Pendiente
                    </span>
                  ) : aprobacion.decision === "aprobo" ? (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="size-4" /> Aprobó
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-destructive">
                      <XCircle className="size-4" /> Rechazó
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {pago.estado === "pendiente" && !yaDecidio && (
        <Card>
          <CardHeader>
            <CardTitle>Tu decisión</CardTitle>
          </CardHeader>
          <CardContent>
            <DecidirPago pagoId={pago.id} />
          </CardContent>
        </Card>
      )}
    </main>
  );
}
