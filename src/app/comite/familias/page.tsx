import { requireResponsable, getFamiliasConAvance } from "@/lib/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { formatSoles } from "@/lib/format";

export default async function FamiliasPage() {
  const session = await requireResponsable();
  const familias = await getFamiliasConAvance(session.bolsaId);

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-bold">Familias y avance de aportes</h1>
      {familias.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no se unió ninguna familia.</p>
      ) : (
        familias.map(({ familia, cuotaEsperada, totalAportado, porcentaje }) => (
          <Card key={familia.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{familia.nombre}</CardTitle>
                <Badge variant={totalAportado >= cuotaEsperada ? "default" : "secondary"}>
                  {totalAportado >= cuotaEsperada ? "Al día" : "Pendiente"}
                </Badge>
              </div>
              <CardDescription>{familia.estudiantes.map((e) => e.nombre).join(", ")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={porcentaje} />
              <div className="flex justify-between text-sm">
                <span>{formatSoles(totalAportado)}</span>
                <span className="text-muted-foreground">de {formatSoles(cuotaEsperada)}</span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </main>
  );
}
