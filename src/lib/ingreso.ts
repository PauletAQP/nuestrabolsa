import "server-only";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";

/** Una forma de entrar a la app: un panel global o una membresía en una bolsa. */
export type OpcionIngreso =
  | { tipo: "usuario"; rol: "superadmin" | "admin" }
  | { tipo: "familia"; familiaId: string; bolsaId: string; bolsaNombre: string; colegio: string }
  | {
      tipo: "responsable";
      responsableId: string;
      bolsaId: string;
      bolsaNombre: string;
      colegio: string;
      rol: string;
    };

/** Paneles y membresías activas a las que puede entrar un usuario. */
export async function getOpcionesIngreso(usuarioId: string): Promise<OpcionIngreso[]> {
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      rol: true,
      familias: {
        where: { estado: "activa", bolsa: { estado: "activa" } },
        select: { id: true, bolsa: { select: { id: true, nombre: true, colegio: true } } },
        orderBy: { createdDate: "desc" },
      },
      responsables: {
        where: { bolsa: { estado: "activa" } },
        select: { id: true, rol: true, bolsa: { select: { id: true, nombre: true, colegio: true } } },
        orderBy: { createdDate: "desc" },
      },
    },
  });
  if (!usuario) return [];

  const opciones: OpcionIngreso[] = [];
  if (usuario.rol === "superadmin" || usuario.rol === "admin") {
    opciones.push({ tipo: "usuario", rol: usuario.rol });
  }
  for (const r of usuario.responsables) {
    opciones.push({
      tipo: "responsable",
      responsableId: r.id,
      bolsaId: r.bolsa.id,
      bolsaNombre: r.bolsa.nombre,
      colegio: r.bolsa.colegio,
      rol: r.rol,
    });
  }
  for (const f of usuario.familias) {
    opciones.push({
      tipo: "familia",
      familiaId: f.id,
      bolsaId: f.bolsa.id,
      bolsaNombre: f.bolsa.nombre,
      colegio: f.bolsa.colegio,
    });
  }
  return opciones;
}

export function sesionParaOpcion(usuarioId: string, opcion: OpcionIngreso): SessionPayload {
  switch (opcion.tipo) {
    case "usuario":
      return { tipo: "usuario", usuarioId, rol: opcion.rol };
    case "familia":
      return { tipo: "familia", usuarioId, familiaId: opcion.familiaId, bolsaId: opcion.bolsaId };
    case "responsable":
      return {
        tipo: "responsable",
        usuarioId,
        responsableId: opcion.responsableId,
        bolsaId: opcion.bolsaId,
        rol: opcion.rol,
      };
  }
}

export function destinoParaSesion(session: SessionPayload): string {
  switch (session.tipo) {
    case "pendiente":
      return "/elegir";
    case "usuario":
      return session.rol === "superadmin" ? "/superadmin" : "/admin";
    case "familia":
      return "/inicio";
    case "responsable":
      return "/comite";
  }
}
