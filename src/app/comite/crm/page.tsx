import { requireResponsable, getBolsa, getSaldoBolsa, getFamiliasConAvance, getPagosBolsa } from "@/lib/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatSoles } from "@/lib/format";
import { DescargarReporteGastos } from "@/components/nb/descargar-reporte-gastos";

export default async function CrmPage() {
  const session = await requireResponsable();
  const [bolsa, saldo, familias, pagos] = await Promise.all([
    getBolsa(session.bolsaId),
    getSaldoBolsa(session.bolsaId),
    getFamiliasConAvance(session.bolsaId),
    getPagosBolsa(session.bolsaId),
  ]);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">CRM de la bolsa</h1>
        <DescargarReporteGastos
          bolsaNombre={bolsa.nombre}
          colegio={bolsa.colegio}
          saldo={saldo.saldo}
          totalAportado={saldo.totalAportado}
          totalPagado={saldo.totalPagado}
          pagos={pagos.map((p) => ({
            proveedor: p.proveedor,
            motivo: p.motivo,
            monto: Number(p.monto),
            estado: p.estado,
            createdDate: p.createdDate,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Meta</CardDescription>
            <CardTitle className="text-xl">{formatSoles(Number(bolsa.meta ?? 0))}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aportado</CardDescription>
            <CardTitle className="text-xl">{formatSoles(saldo.totalAportado)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Saldo</CardDescription>
            <CardTitle className="text-xl">{formatSoles(saldo.saldo)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dinero por padre</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Familia</TableHead>
                <TableHead>Esperado</TableHead>
                <TableHead>Aportado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {familias.map(({ familia, cuotaEsperada, totalAportado }) => (
                <TableRow key={familia.id}>
                  <TableCell>{familia.nombre}</TableCell>
                  <TableCell>{formatSoles(cuotaEsperada)}</TableCell>
                  <TableCell>{formatSoles(totalAportado)}</TableCell>
                  <TableCell>
                    <Badge variant={totalAportado >= cuotaEsperada ? "default" : "secondary"}>
                      {totalAportado >= cuotaEsperada ? "Al día" : "Pendiente"}
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
