import Link from "next/link";
import { notFound } from "next/navigation";
import { getBolsaPublica } from "@/lib/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { buttonVariants } from "@/components/ui/button";
import { formatSoles, formatFechaLima, ESTADO_PAGO_LABEL } from "@/lib/format";

export default async function BolsaPublicaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const data = await getBolsaPublica(codigo.toUpperCase());
  if (!data) notFound();

  const { bolsa, saldo, familiasRegistradas, pagos } = data;
  const meta = Number(bolsa.meta ?? 0);
  const porcentaje = meta > 0 ? Math.min(100, Math.round((saldo.totalAportado / meta) * 100)) : 0;

  return (
    <main className="flex-1 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center space-y-1">
          <Badge variant="secondary">Vista pública de transparencia</Badge>
          <h1 className="text-2xl font-bold">{bolsa.nombre}</h1>
          <p className="text-muted-foreground">{bolsa.colegio}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Avance de la meta</CardTitle>
            <CardDescription>
              {familiasRegistradas} familias registradas · cuota S/ {Number(bolsa.cuota).toFixed(2)} por estudiante
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={porcentaje} />
            <div className="flex justify-between text-sm">
              <span>{formatSoles(saldo.totalAportado)} aportado</span>
              <span className="text-muted-foreground">meta {formatSoles(meta)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span>Pagado hasta ahora</span>
              <span>{formatSoles(saldo.totalPagado)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Saldo actual</span>
              <span>{formatSoles(saldo.saldo)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gastos de la bolsa</CardTitle>
            <CardDescription>Cada pago necesita la aprobación de los 3 responsables del comité</CardDescription>
          </CardHeader>
          <CardContent>
            {pagos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no se propuso ningún pago.</p>
            ) : (
              <ul className="space-y-3">
                {pagos.map((p) => (
                  <li key={p.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                    <div className="space-y-1">
                      <p className="font-medium">{p.proveedor}</p>
                      <p className="text-sm text-muted-foreground">{p.motivo}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFechaLima(p.pagadoEn ?? p.createdDate)}
                      </p>
                    </div>
                    <div className="text-right space-y-1 shrink-0">
                      <p className="font-medium">{formatSoles(p.monto)}</p>
                      <Badge
                        variant={
                          p.estado === "pagado"
                            ? "default"
                            : p.estado === "rechazado" || p.estado === "vencido"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {ESTADO_PAGO_LABEL[p.estado]}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href={`/b/${bolsa.codigoPublico}/registro`} className={buttonVariants({ variant: "outline" })}>
            Ver registro encadenado verificable
          </Link>
          <Link href="/comprobante" className={buttonVariants({ variant: "outline" })}>
            Consultar un comprobante por código
          </Link>
        </div>
      </div>
    </main>
  );
}
