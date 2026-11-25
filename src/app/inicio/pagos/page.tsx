import { requireFamilia, getPagosBolsa, getRegistroBolsa, getSaldoBolsa, getBolsa } from "@/lib/queries";
import { verificarCadena } from "@/lib/registro";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RegistroList } from "@/components/nb/registro-list";
import { formatSoles, formatFechaLima, ESTADO_PAGO_LABEL } from "@/lib/format";

export default async function PagosFamiliaPage() {
  const session = await requireFamilia();
  const [pagos, registros, saldo, bolsa] = await Promise.all([
    getPagosBolsa(session.bolsaId),
    getRegistroBolsa(session.bolsaId),
    getSaldoBolsa(session.bolsaId),
    getBolsa(session.bolsaId),
  ]);
  const { detalle } = verificarCadena(registros);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Saldo de {bolsa.nombre}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="text-muted-foreground">Aportado</p>
            <p className="font-semibold">{formatSoles(saldo.totalAportado)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Pagado</p>
            <p className="font-semibold">{formatSoles(saldo.totalPagado)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Saldo</p>
            <p className="font-semibold">{formatSoles(saldo.saldo)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagos propuestos</CardTitle>
          <CardDescription>Cada uno necesita 3 de 3 aprobaciones del comité</CardDescription>
        </CardHeader>
        <CardContent>
          {pagos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no se propuso ningún pago.</p>
          ) : (
            <ul className="space-y-3">
              {pagos.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{p.proveedor}</p>
                    <p className="text-sm text-muted-foreground">{p.motivo}</p>
                    <p className="text-xs text-muted-foreground">{formatFechaLima(p.createdDate)}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="font-medium">{formatSoles(p.monto)}</p>
                    <Badge
                      variant={
                        p.estado === "pagado" ? "default" : p.estado === "pendiente" ? "secondary" : "destructive"
                      }
                    >
                      {ESTADO_PAGO_LABEL[p.estado]}
                    </Badge>
                    {p.estado === "pendiente" && (
                      <p className="text-xs text-muted-foreground">{p.aprobaciones.length}/3 aprobaciones</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registro encadenado de movimientos</CardTitle>
          <CardDescription>Verificable desde el enlace público de la bolsa</CardDescription>
        </CardHeader>
        <CardContent>
          <RegistroList registros={registros} validez={detalle} />
        </CardContent>
      </Card>
    </main>
  );
}
