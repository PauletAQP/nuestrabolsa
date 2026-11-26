import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UnirseForm } from "@/components/nb/unirse-form";

export default async function UnirseCodigoPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const codigoInvitacion = codigo.toUpperCase();
  const bolsa = await prisma.bolsa.findUnique({ where: { codigoInvitacion } });
  if (!bolsa || bolsa.estado !== "activa") notFound();

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Unirme a {bolsa.nombre}</CardTitle>
          <CardDescription>{bolsa.colegio}</CardDescription>
        </CardHeader>
        <CardContent>
          <UnirseForm codigoInvitacion={codigoInvitacion} />
        </CardContent>
      </Card>
    </main>
  );
}
