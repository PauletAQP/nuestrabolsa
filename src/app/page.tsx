import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/nb/login-form";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();
  if (session?.tipo === "familia") redirect("/inicio");
  if (session?.tipo === "responsable") redirect("/comite");
  if (session?.tipo === "usuario") redirect(session.rol === "superadmin" ? "/superadmin" : "/admin");

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-10">
      <div className="text-center space-y-2 max-w-md">
        <h1 className="text-3xl font-bold tracking-tight">Nuestra Bolsa</h1>
        <p className="text-muted-foreground">
          La bolsa común de tu salón, con transparencia total. Aporta la cuota de tu hijo o hija y
          mira en qué se gastó cada sol.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Ingresa a tu bolsa</CardTitle>
          <CardDescription>Usa tu DNI y tu contraseña</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-center text-sm">
            <Link href="/recuperar" className="underline underline-offset-4">
              Olvidé mi contraseña
            </Link>
          </p>
        </CardContent>
      </Card>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/unirse" className="group">
          <Card className="h-full transition-colors group-hover:border-primary">
            <CardHeader>
              <CardTitle className="text-base">Unirme por invitación</CardTitle>
              <CardDescription>Si un responsable te compartió un código</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/ver" className="group">
          <Card className="h-full transition-colors group-hover:border-primary">
            <CardHeader>
              <CardTitle className="text-base">Ver una bolsa pública</CardTitle>
              <CardDescription>Transparencia sin necesidad de cuenta</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <Link href="/seguridad" className="text-sm text-muted-foreground underline underline-offset-4">
        Cómo se protege tu información
      </Link>
    </main>
  );
}
