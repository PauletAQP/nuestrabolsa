import { requireResponsable, getBolsa, getSaldoBolsa, getFamiliasConAvance, getPagosBolsa } from "@/lib/queries";
import { CrmDashboard } from "@/components/nb/crm-dashboard";

export default async function CrmPage() {
  const session = await requireResponsable();
  const [bolsa, saldo, familias, pagos] = await Promise.all([
    getBolsa(session.bolsaId),
    getSaldoBolsa(session.bolsaId),
    getFamiliasConAvance(session.bolsaId),
    getPagosBolsa(session.bolsaId),
  ]);

  return (
    <CrmDashboard
      bolsa={{
        id: bolsa.id,
        nombre: bolsa.nombre,
        colegio: bolsa.colegio,
        cuota: Number(bolsa.cuota),
        estudiantesEsperados: bolsa.estudiantesEsperados,
        meta: Number(bolsa.meta ?? 0),
        codigoInvitacion: bolsa.codigoInvitacion,
        codigoPublico: bolsa.codigoPublico,
      }}
      saldo={saldo}
      familias={familias}
      pagos={pagos.map((p) => ({
        proveedor: p.proveedor,
        motivo: p.motivo,
        monto: Number(p.monto),
        estado: p.estado,
        createdDate: p.createdDate,
      }))}
    />
  );
}
