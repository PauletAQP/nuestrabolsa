import { TopNav } from "@/components/nb/top-nav";
import { CrearAdminForm } from "@/components/nb/crear-admin-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUsuario } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { formatFechaLima } from "@/lib/format";

export default async function SuperadminPage() {
  await requireUsuario(["superadmin"]);
  const admins = await prisma.usuario.findMany({ where: { rol: "admin" }, orderBy: { createdDate: "desc" } });

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <TopNav titulo="Nuestra Bolsa · Superadmin" links={[]} />
      <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Crear administrador</CardTitle>
            <CardDescription>Los administradores son quienes crean las bolsas.</CardDescription>
          </CardHeader>
          <CardContent>
            <CrearAdminForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Administradores ({admins.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {a.nombre} {a.apellidos}
                    </TableCell>
                    <TableCell>{a.dni}</TableCell>
                    <TableCell>{formatFechaLima(a.createdDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
