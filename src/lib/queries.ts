import "server-only";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function requireFamilia() {
  const session = await getSession();
  if (!session || session.tipo !== "familia") redirect("/");
  return session;
}

export async function requireResponsable() {
  const session = await getSession();
  if (!session || session.tipo !== "responsable") redirect("/");
  return session;
}

export async function requireUsuario(roles?: ("superadmin" | "admin")[]) {
  const session = await getSession();
  if (!session || session.tipo !== "usuario") redirect("/");
  if (roles && !roles.includes(session.rol)) redirect("/");
  return session;
}

export async function getAportesBolsa(bolsaId: string) {
  return prisma.aporte.findMany({ where: { bolsaId }, orderBy: { fecha: "desc" } });
}

export async function getSaldoBolsa(bolsaId: string) {
  const [aportes, pagos] = await Promise.all([
    prisma.aporte.aggregate({
      where: { bolsaId, estado: "confirmado" },
      _sum: { monto: true },
    }),
    prisma.pago.aggregate({
      where: { bolsaId, estado: "pagado" },
      _sum: { monto: true },
    }),
  ]);
  const totalAportado = Number(aportes._sum.monto ?? 0);
  const totalPagado = Number(pagos._sum.monto ?? 0);
  return { totalAportado, totalPagado, saldo: totalAportado - totalPagado };
}

export async function getBolsa(bolsaId: string) {
  return prisma.bolsa.findUniqueOrThrow({ where: { id: bolsaId } });
}

export async function getBolsaPublica(codigoPublico: string) {
  const bolsa = await prisma.bolsa.findUnique({ where: { codigoPublico } });
  if (!bolsa) return null;
  const saldo = await getSaldoBolsa(bolsa.id);
  const familias = await prisma.familia.count({ where: { bolsaId: bolsa.id } });
  const pagos = await prisma.pago.findMany({
    where: { bolsaId: bolsa.id },
    orderBy: { createdDate: "desc" },
    select: { id: true, proveedor: true, monto: true, motivo: true, estado: true, pagadoEn: true, createdDate: true },
  });
  return { bolsa, saldo, familiasRegistradas: familias, pagos };
}

export async function getFamiliaConEstudiantes(familiaId: string) {
  return prisma.familia.findUniqueOrThrow({
    where: { id: familiaId },
    include: { estudiantes: true },
  });
}

export async function getAvanceFamilia(bolsaId: string, familiaId: string) {
  const bolsa = await getBolsa(bolsaId);
  const estudiantes = await prisma.estudiante.count({ where: { familiaId } });
  const cuotaEsperada = Number(bolsa.cuota) * Math.max(estudiantes, 1);
  const aportado = await prisma.aporte.aggregate({
    where: { bolsaId, familiaId, estado: "confirmado" },
    _sum: { monto: true },
  });
  const totalAportado = Number(aportado._sum.monto ?? 0);
  return {
    cuotaEsperada,
    totalAportado,
    porcentaje: cuotaEsperada > 0 ? Math.min(100, Math.round((totalAportado / cuotaEsperada) * 100)) : 0,
    alDia: totalAportado >= cuotaEsperada,
  };
}

export async function getAportesFamilia(familiaId: string) {
  return prisma.aporte.findMany({ where: { familiaId }, orderBy: { fecha: "desc" } });
}

export async function getPagosBolsa(bolsaId: string) {
  return prisma.pago.findMany({
    where: { bolsaId },
    orderBy: { createdDate: "desc" },
    include: { aprobaciones: true },
  });
}

export async function getPagoDetalle(bolsaId: string, pagoId: string) {
  return prisma.pago.findFirst({
    where: { id: pagoId, bolsaId },
    include: { aprobaciones: true },
  });
}

export async function getEfectivoPorConfirmar(bolsaId: string) {
  return prisma.aporte.findMany({
    where: { bolsaId, medio: "efectivo", estado: "por_confirmar" },
    orderBy: { fecha: "asc" },
  });
}

export async function getFamiliasConAvance(bolsaId: string) {
  const familias = await prisma.familia.findMany({
    where: { bolsaId },
    include: {
      estudiantes: {
        select: { id: true, nombre: true },
      },
      aportes: {
        where: { estado: "confirmado" },
        orderBy: { fecha: "desc" },
      },
    },
    orderBy: { nombre: "asc" },
  });
  const bolsa = await getBolsa(bolsaId);
  const results = familias.map((f) => {
    const cuotaEsperada = Number(bolsa.cuota) * Math.max(f.estudiantes.length, 1);
    const totalAportado = f.aportes.reduce((acc, a) => acc + Number(a.monto), 0);
    const saldoPendiente = Math.max(0, cuotaEsperada - totalAportado);
    return {
      familia: {
        id: f.id,
        nombre: f.nombre,
        dni: f.dni,
        celular: f.celular,
        estudiantes: f.estudiantes.map((e) => ({ id: e.id, nombre: e.nombre })),
      },
      cuotaEsperada,
      totalAportado,
      saldoPendiente,
      porcentaje: cuotaEsperada > 0 ? Math.min(100, Math.round((totalAportado / cuotaEsperada) * 100)) : 0,
      aportes: f.aportes.map((a) => ({
        id: a.id,
        monto: Number(a.monto),
        medio: a.medio,
        estado: a.estado,
        fecha: a.fecha,
        estudianteNombre: a.estudianteNombre,
        codigoComprobante: a.codigoComprobante,
      })),
    };
  });
  return results;
}

export async function getRegistroBolsa(bolsaId: string) {
  return prisma.registro.findMany({ where: { bolsaId }, orderBy: { secuencia: "asc" } });
}

export async function getComprobantePorCodigo(codigo: string) {
  return prisma.aporte.findUnique({ where: { codigoComprobante: codigo } });
}

export async function getResponsables(bolsaId: string) {
  return prisma.responsable.findMany({ where: { bolsaId }, orderBy: { rol: "asc" } });
}
