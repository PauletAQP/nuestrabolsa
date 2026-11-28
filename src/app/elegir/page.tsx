import { redirect } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { getOpcionesIngreso, type OpcionIngreso } from "@/lib/ingreso";
import { elegirIngresoAction, logoutAction } from "@/lib/actions/auth";
import { prisma } from "@/lib/prisma";
import { LogOut } from "lucide-react";

const CARGO_LABEL: Record<string, string> = {
  presidente: "Presidente",
  tesorero: "Tesorero",
  secretario: "Secretario",
};

function describir(o: OpcionIngreso): { titulo: string; detalle: string; id: string } {
  switch (o.tipo) {
    case "usuario":
      return {
        titulo: o.rol === "superadmin" ? "Panel de superadmin" : "Panel de administrador",
        detalle: o.rol === "superadmin" ? "Gestionar administradores" : "Crear y ver tus bolsas",
        id: o.rol,
      };
    case "responsable":
      return {
        titulo: o.bolsaNombre,
        detalle: `${o.colegio} · Comité (${CARGO_LABEL[o.rol] ?? o.rol})`,
        id: o.responsableId,
      };
    case "familia":
      return { titulo: o.bolsaNombre, detalle: `${o.colegio} · Padre de familia`, id: o.familiaId };
  }
}

export default async function ElegirPage() {
  const session = await getSession();
  if (!session?.usuarioId) redirect("/");

  const [usuario, opciones] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: session.usuarioId }, select: { nombre: true } }),
    getOpcionesIngreso(session.usuarioId),
  ]);
  if (!usuario) redirect("/");

  return (
    <main className="mx-auto w-full max-w-md flex-1 space-y-6 px-4 py-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Hola, {usuario.nombre}</h1>
        <p className="text-muted-foreground">¿A dónde quieres entrar?</p>
      </div>

      {opciones.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tu cuenta no pertenece a ninguna bolsa activa.</p>
      ) : (
        <div className="space-y-3">
          {opciones.map((o) => {
            const { titulo, detalle, id } = describir(o);
            return (
              <form key={`${o.tipo}-${id}`} action={elegirIngresoAction}>
                <input type="hidden" name="tipo" value={o.tipo} />
                <input type="hidden" name="id" value={id} />
                <button type="submit" className="group w-full text-left">
                  <Card className="transition-colors group-hover:border-primary">
                    <CardHeader>
                      <CardTitle className="text-base">{titulo}</CardTitle>
                      <CardDescription>{detalle}</CardDescription>
                    </CardHeader>
                  </Card>
                </button>
              </form>
            );
          })}
        </div>
      )}

      <form action={logoutAction}>
        <Button variant="ghost" size="sm" type="submit">
          <LogOut className="size-4" /> Salir
        </Button>
      </form>
    </main>
  );
}
