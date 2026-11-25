import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProponerPagoForm } from "@/components/nb/proponer-pago-form";

export default function ProponerPagoPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Proponer un pago</CardTitle>
          <CardDescription>Quedarás como la primera de las 3 aprobaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <ProponerPagoForm />
        </CardContent>
      </Card>
    </main>
  );
}
