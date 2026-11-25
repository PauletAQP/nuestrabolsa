import Link from "next/link";
import { TopNav } from "@/components/nb/top-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { requireUsuario } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { formatFechaLima } from "@/lib/format";

export default async function AdminPage() {
  const session = await requireUsuario(["admin"]);
  const bolsas = await prisma.bolsa.findMany({
    where: { createdById: session.usuarioId },
    orderBy: { createdDate: "desc" },
  });

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <TopNav titulo="Nuestra Bolsa · Administrador" links={[{ href: "/crear", label: "Crear bolsa" }]} />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Mis bolsas</h1>
          <Link href="/crear" className={buttonVariants()}>
            Crear bolsa
          </Link>
        </div>
        {bolsas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no creaste ninguna bolsa.</p>
        ) : (
          bolsas.map((b) => (
            <Card key={b.id}>
              <CardHeader>
                <CardTitle>{b.nombre}</CardTitle>
                <CardDescription>
                  {b.colegio} · creada el {formatFechaLima(b.createdDate)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between rounded-lg border p-3">
                  <span>Código de invitación para familias</span>
                  <span className="font-mono font-semibold">{b.codigoInvitacion}</span>
                </div>
                <div className="flex justify-between rounded-lg border p-3">
                  <span>Enlace público</span>
                  <Link href={`/b/${b.codigoPublico}`} className="font-mono underline underline-offset-4">
                    /b/{b.codigoPublico}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
