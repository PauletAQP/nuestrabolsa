import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

async function irABolsa(formData: FormData) {
  "use server";
  const codigo = String(formData.get("codigo") ?? "").trim().toUpperCase();
  if (codigo) redirect(`/b/${codigo}`);
}

export default function VerPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Ver una bolsa pública</CardTitle>
          <CardDescription>Ingresa el código público que te compartió el comité</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={irABolsa} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código público</Label>
              <Input id="codigo" name="codigo" placeholder="Ej.: AB3DE7FG" required />
            </div>
            <Button type="submit" className="w-full">
              Ver bolsa
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
