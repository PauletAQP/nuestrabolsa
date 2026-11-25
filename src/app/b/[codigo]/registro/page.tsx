import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getRegistroBolsa } from "@/lib/queries";
import { verificarCadena } from "@/lib/registro";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RegistroList } from "@/components/nb/registro-list";
import { ShieldCheck, ShieldAlert } from "lucide-react";

export default async function RegistroEncadenadoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const bolsa = await prisma.bolsa.findUnique({ where: { codigoPublico: codigo.toUpperCase() } });
  if (!bolsa) notFound();

  const registros = await getRegistroBolsa(bolsa.id);
  const { valido, detalle } = verificarCadena(registros);

  return (
    <main className="flex-1 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">Registro encadenado</h1>
          <p className="text-muted-foreground">{bolsa.nombre}</p>
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-3">
            {valido ? (
              <ShieldCheck className="size-8 text-emerald-600" />
            ) : (
              <ShieldAlert className="size-8 text-destructive" />
            )}
            <div>
              <CardTitle>{valido ? "Cadena verificada" : "La cadena no coincide"}</CardTitle>
              <CardDescription>
                {valido
                  ? "Cada movimiento fue recalculado a partir del anterior y coincide con lo guardado."
                  : "Alguno de los códigos no coincide con lo que se recalculó. Repórtalo al comité."}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movimientos</CardTitle>
            <CardDescription>
              <Badge variant="secondary">{registros.length} movimientos</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegistroList registros={registros} validez={detalle} />
          </CardContent>
        </Card>

        <p className="text-center text-sm">
          <Link href={`/b/${bolsa.codigoPublico}`} className="underline underline-offset-4">
            Volver a la bolsa
          </Link>
        </p>
      </div>
    </main>
  );
}
