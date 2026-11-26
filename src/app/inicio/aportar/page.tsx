import { requireFamilia, getFamiliaConEstudiantes } from "@/lib/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AportarForm } from "@/components/nb/aportar-form";

export default async function AportarPage() {
  const session = await requireFamilia();
  const familia = await getFamiliaConEstudiantes(session.familiaId);

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Aportar la cuota</CardTitle>
          <CardDescription>Elige a qué estudiante corresponde el aporte</CardDescription>
        </CardHeader>
        <CardContent>
          <AportarForm estudiantes={familia.estudiantes} />
        </CardContent>
      </Card>
    </main>
  );
}
