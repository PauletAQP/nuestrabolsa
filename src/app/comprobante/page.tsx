import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getComprobantePorCodigo } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { formatSoles, formatFechaLima, MEDIO_LABEL } from "@/lib/format";
import Link from "next/link";

export default async function ComprobantePage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  const aporte = codigo ? await getComprobantePorCodigo(codigo.trim().toUpperCase()) : null;
  const bolsa = aporte ? await prisma.bolsa.findUnique({ where: { id: aporte.bolsaId } }) : null;

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Consultar comprobante</CardTitle>
          <CardDescription>Ingresa el código de 10 caracteres del comprobante</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input id="codigo" name="codigo" defaultValue={codigo} placeholder="Ej.: AB3D5F7H2K" required />
            </div>
            <Button type="submit" className="w-full">
              Buscar
            </Button>
          </form>

          {codigo && !aporte && (
            <p className="text-sm text-destructive">No se encontró un comprobante con ese código.</p>
          )}

          {aporte && (
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Bolsa</span>
                <span className="text-sm font-medium">{bolsa?.nombre}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Familia</span>
                <span className="text-sm font-medium">{aporte.familiaNombre}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estudiante</span>
                <span className="text-sm font-medium">{aporte.estudianteNombre}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Monto</span>
                <span className="text-sm font-medium">{formatSoles(aporte.monto)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Medio</span>
                <span className="text-sm font-medium">{MEDIO_LABEL[aporte.medio]}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado</span>
                <Badge variant={aporte.estado === "confirmado" ? "default" : "secondary"}>
                  {aporte.estado === "confirmado" ? "Confirmado" : "Por confirmar"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fecha</span>
                <span className="text-sm">{formatFechaLima(aporte.fecha)}</span>
              </div>
            </div>
          )}

          <p className="text-center text-sm">
            <Link href="/" className="underline underline-offset-4">
              Volver al inicio
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
