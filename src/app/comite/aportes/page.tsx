import { requireResponsable, getAportesBolsa } from "@/lib/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatSoles, formatFechaLima } from "@/lib/format";

export default async function AportesPage() {
  const session = await requireResponsable();
  const aportes = await getAportesBolsa(session.bolsaId);

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Pagos de los padres</CardTitle>
          <CardDescription>{aportes.length} aporte(s) registrados en esta bolsa</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Familia</TableHead>
                <TableHead>Estudiante</TableHead>
                <TableHead>Medio</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aportes.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{formatFechaLima(a.fecha)}</TableCell>
                  <TableCell>{a.familiaNombre}</TableCell>
                  <TableCell>{a.estudianteNombre}</TableCell>
                  <TableCell className="capitalize">{a.medio}</TableCell>
                  <TableCell>{formatSoles(a.monto)}</TableCell>
                  <TableCell>
                    <Badge variant={a.estado === "confirmado" ? "default" : "secondary"}>
                      {a.estado === "confirmado" ? "Confirmado" : "Por confirmar"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
