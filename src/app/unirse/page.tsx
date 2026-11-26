import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

async function irAUnirse(formData: FormData) {
  "use server";
  const codigo = String(formData.get("codigo") ?? "").trim().toUpperCase();
  if (codigo) redirect(`/unirse/${codigo}`);
}

export default function UnirsePage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Unirme a una bolsa</CardTitle>
          <CardDescription>Ingresa el código de invitación que te compartió el comité</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={irAUnirse} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código de invitación</Label>
              <Input id="codigo" name="codigo" placeholder="Ej.: KM4R8T2P" required />
            </div>
            <Button type="submit" className="w-full">
              Continuar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
