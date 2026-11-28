import "server-only";
import type { Prisma } from "@prisma/client";
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

/** Datos personales (desde Usuario) y estudiantes inscritos en la bolsa de una familia. */
const familiaInclude = {
  usuario: { select: { nombre: true, apellidos: true, dni: true, celular: true } },
  inscripciones: {
    select: { estudiante: { select: { id: true, nombre: true } } },
    orderBy: { createdDate: "asc" },
  },
} satisfies Prisma.FamiliaInclude;

type FamiliaConUsuario = Prisma.FamiliaGetPayload<{ include: typeof familiaInclude }>;

function datosFamilia(f: FamiliaConUsuario) {
  if (!f.usuario) throw new Error(`La familia ${f.id} no tiene un usuario asociado`);
  return {
    id: f.id,
    bolsaId: f.bolsaId,
    /** Nombre completo, para mostrar. */
    nombre: `${f.usuario.nombre} ${f.usuario.apellidos}`,
    nombres: f.usuario.nombre,
    apellidos: f.usuario.apellidos,
    dni: f.usuario.dni,
    celular: f.usuario.celular,
    estudiantes: f.inscripciones.map((i) => i.estudiante),
  };
}

/** Familias activas de una bolsa, ordenadas por nombre. */
export async function getFamiliasBolsa(bolsaId: string) {
  const familias = await prisma.familia.findMany({
    where: { bolsaId, estado: "activa" },
    include: familiaInclude,
    orderBy: [{ usuario: { nombre: "asc" } }, { usuario: { apellidos: "asc" } }],
  });
  return familias.map(datosFamilia);
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
  const familias = await prisma.familia.count({ where: { bolsaId: bolsa.id, estado: "activa" } });
  const pagos = await prisma.pago.findMany({
    where: { bolsaId: bolsa.id },
    orderBy: { createdDate: "desc" },
    select: { id: true, proveedor: true, monto: true, motivo: true, estado: true, pagadoEn: true, createdDate: true },
  });
  return { bolsa, saldo, familiasRegistradas: familias, pagos };
}

export async function getFamiliaConEstudiantes(familiaId: string) {
  const familia = await prisma.familia.findUniqueOrThrow({ where: { id: familiaId }, include: familiaInclude });
  return datosFamilia(familia);
}

export async function getAvanceFamilia(bolsaId: string, familiaId: string) {
  const bolsa = await getBolsa(bolsaId);
  const estudiantes = await prisma.inscripcion.count({ where: { bolsaId, familiaId } });
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
  const [familias, aportes, bolsa] = await Promise.all([
    getFamiliasBolsa(bolsaId),
    prisma.aporte.findMany({ where: { bolsaId, estado: "confirmado" }, orderBy: { fecha: "desc" } }),
    getBolsa(bolsaId),
  ]);
  return familias.map((familia) => {
    const aportesFamilia = aportes.filter((a) => a.familiaId === familia.id);
    const cuotaEsperada = Number(bolsa.cuota) * Math.max(familia.estudiantes.length, 1);
    const totalAportado = aportesFamilia.reduce((acc, a) => acc + Number(a.monto), 0);
    const saldoPendiente = Math.max(0, cuotaEsperada - totalAportado);
    return {
      familia,
      cuotaEsperada,
      totalAportado,
      saldoPendiente,
      porcentaje: cuotaEsperada > 0 ? Math.min(100, Math.round((totalAportado / cuotaEsperada) * 100)) : 0,
      aportes: aportesFamilia.map((a) => ({
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
}

export async function getRegistroBolsa(bolsaId: string) {
  return prisma.registro.findMany({ where: { bolsaId }, orderBy: { secuencia: "asc" } });
}

export async function getComprobantePorCodigo(codigo: string) {
  return prisma.aporte.findUnique({ where: { codigoComprobante: codigo } });
}

export async function getResponsables(bolsaId: string) {
  const responsables = await prisma.responsable.findMany({
    where: { bolsaId },
    include: { usuario: { select: { nombre: true, apellidos: true, dni: true, celular: true } } },
    orderBy: { rol: "asc" },
  });
  return responsables.map((r) => {
    if (!r.usuario) throw new Error(`El responsable ${r.id} no tiene un usuario asociado`);
    return { id: r.id, rol: r.rol, ...r.usuario };
  });
}

/** Nombre completo del responsable (desde su Usuario), para registrar quién hizo cada acción. */
export async function getNombreResponsable(responsableId: string) {
  const r = await prisma.responsable.findUniqueOrThrow({
    where: { id: responsableId },
    select: { usuario: { select: { nombre: true, apellidos: true } } },
  });
  if (!r.usuario) throw new Error(`El responsable ${responsableId} no tiene un usuario asociado`);
  return `${r.usuario.nombre} ${r.usuario.apellidos}`;
}
