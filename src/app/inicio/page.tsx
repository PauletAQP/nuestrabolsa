import Link from "next/link";
import { requireFamilia, getFamiliaConEstudiantes, getAvanceFamilia, getBolsa, getAportesFamilia } from "@/lib/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatSoles, formatFechaLima, MEDIO_LABEL } from "@/lib/format";

export default async function InicioPage() {
  const session = await requireFamilia();
  const [familia, avance, bolsa, aportes] = await Promise.all([
    getFamiliaConEstudiantes(session.familiaId),
    getAvanceFamilia(session.bolsaId, session.familiaId),
    getBolsa(session.bolsaId),
    getAportesFamilia(session.familiaId),
  ]);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Hola, {familia.nombre}</h1>
        <p className="text-muted-foreground">
          {bolsa.nombre} · {bolsa.colegio}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu avance de aportes</CardTitle>
          <CardDescription>
            {familia.estudiantes.map((e) => e.nombre).join(", ")} · cuota S/ {Number(bolsa.cuota).toFixed(2)} por
            estudiante
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={avance.porcentaje} />
          <div className="flex items-center justify-between text-sm">
            <span>{formatSoles(avance.totalAportado)} aportado</span>
            <span className="text-muted-foreground">de {formatSoles(avance.cuotaEsperada)}</span>
          </div>
          <Badge variant={avance.alDia ? "default" : "secondary"}>
            {avance.alDia ? "Estás al día" : "Te falta completar tu cuota"}
          </Badge>
          <div className="pt-2">
            <Link href="/inicio/aportar" className={buttonVariants()}>
              Aportar la cuota
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tus últimos aportes</CardTitle>
        </CardHeader>
        <CardContent>
          {aportes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no registras ningún aporte.</p>
          ) : (
            <ul className="space-y-2">
              {aportes.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {a.estudianteNombre} · {MEDIO_LABEL[a.medio]}
                    </p>
                    <p className="text-muted-foreground">{formatFechaLima(a.fecha)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{formatSoles(a.monto)}</span>
                    <Badge variant={a.estado === "confirmado" ? "default" : "secondary"}>
                      {a.estado === "confirmado" ? "Confirmado" : "Por confirmar"}
                    </Badge>
                    <Link href={`/inicio/recibo/${a.id}`} className="underline underline-offset-4">
                      Recibo
                    </Link>
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
