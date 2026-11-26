import Link from "next/link";
import {
  requireResponsable,
  getBolsa,
  getSaldoBolsa,
  getPagosBolsa,
  getEfectivoPorConfirmar,
} from "@/lib/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatSoles, formatFechaLima, ESTADO_PAGO_LABEL } from "@/lib/format";

export default async function ComitePage() {
  const session = await requireResponsable();
  const [bolsa, saldo, pagos, efectivo] = await Promise.all([
    getBolsa(session.bolsaId),
    getSaldoBolsa(session.bolsaId),
    getPagosBolsa(session.bolsaId),
    getEfectivoPorConfirmar(session.bolsaId),
  ]);

  const pendientes = pagos.filter((p) => p.estado === "pendiente");
  const porDecidir = pendientes.filter((p) => !p.aprobaciones.some((a) => a.responsableId === session.responsableId));

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">{bolsa.nombre}</h1>
        <p className="text-muted-foreground">{bolsa.colegio}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo actual</CardDescription>
            <CardTitle className="text-xl">{formatSoles(saldo.saldo)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aportado</CardDescription>
            <CardTitle className="text-xl">{formatSoles(saldo.totalAportado)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pagado</CardDescription>
            <CardTitle className="text-xl">{formatSoles(saldo.totalPagado)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comparte estos códigos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>Invitación para familias</span>
            <span className="font-mono font-semibold">{bolsa.codigoInvitacion}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span>Enlace público de transparencia</span>
            <Link href={`/b/${bolsa.codigoPublico}`} className="font-mono font-semibold underline underline-offset-4">
              /b/{bolsa.codigoPublico}
            </Link>
          </div>
        </CardContent>
      </Card>

      {efectivo.length > 0 && (
        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle>Efectivo por confirmar</CardTitle>
            <CardDescription>{efectivo.length} aporte(s) esperando confirmación</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/comite/efectivo" className={buttonVariants({ variant: "outline" })}>
              Revisar efectivo
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pagos pendientes de tu decisión</CardTitle>
          <CardDescription>{porDecidir.length} pago(s) esperan tu aprobación</CardDescription>
        </CardHeader>
        <CardContent>
          {porDecidir.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes pagos pendientes por decidir.</p>
          ) : (
            <ul className="space-y-2">
              {porDecidir.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/comite/pagos/${p.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted"
                  >
                    <div>
                      <p className="font-medium">{p.proveedor}</p>
                      <p className="text-muted-foreground">{p.motivo}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatSoles(p.monto)}</p>
                      <p className="text-xs text-muted-foreground">{p.aprobaciones.length}/3 aprobaciones</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todos los pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {pagos.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/comite/pagos/${p.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm hover:bg-muted"
                >
                  <div>
                    <p className="font-medium">{p.proveedor}</p>
                    <p className="text-xs text-muted-foreground">{formatFechaLima(p.createdDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatSoles(p.monto)}</span>
                    <Badge
                      variant={
                        p.estado === "pagado" ? "default" : p.estado === "pendiente" ? "secondary" : "destructive"
                      }
                    >
                      {ESTADO_PAGO_LABEL[p.estado]}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
