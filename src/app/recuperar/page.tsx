import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecuperarForm } from "@/components/nb/recuperar-form";

export default function RecuperarPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Recuperar contraseña</CardTitle>
          <CardDescription>Usa el código de recuperación que guardaste al unirte</CardDescription>
        </CardHeader>
        <CardContent>
          <RecuperarForm />
          <p className="mt-4 text-center text-sm">
            <Link href="/" className="underline underline-offset-4">
              Volver a ingresar
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
