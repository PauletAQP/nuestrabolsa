import { notFound } from "next/navigation";
import { requireFamilia, getBolsa } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSoles, formatFechaLima, MEDIO_LABEL } from "@/lib/format";
import { DescargarRecibo } from "@/components/nb/descargar-recibo";

export default async function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireFamilia();
  const { id } = await params;

  const aporte = await prisma.aporte.findFirst({ where: { id, familiaId: session.familiaId } });
  if (!aporte) notFound();
  const bolsa = await getBolsa(session.bolsaId);

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Recibo de tu aporte</CardTitle>
          <CardDescription>
            {bolsa.nombre} · {bolsa.colegio}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estudiante</span>
            <span className="font-medium">{aporte.estudianteNombre}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monto</span>
            <span className="font-medium">{formatSoles(aporte.monto)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Medio</span>
            <span className="font-medium">{MEDIO_LABEL[aporte.medio]}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estado</span>
            <Badge variant={aporte.estado === "confirmado" ? "default" : "secondary"}>
              {aporte.estado === "confirmado" ? "Confirmado" : "Por confirmar"}
            </Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fecha</span>
            <span>{formatFechaLima(aporte.fecha)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Código</span>
            <span className="font-mono">{aporte.codigoComprobante}</span>
          </div>
          <div className="pt-2">
            <DescargarRecibo
              bolsaNombre={bolsa.nombre}
              colegio={bolsa.colegio}
              familiaNombre={aporte.familiaNombre ?? ""}
              estudianteNombre={aporte.estudianteNombre ?? ""}
              monto={Number(aporte.monto)}
              medio={aporte.medio}
              estado={aporte.estado}
              fecha={aporte.fecha}
              codigoComprobante={aporte.codigoComprobante}
            />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
