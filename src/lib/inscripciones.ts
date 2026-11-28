import type { Prisma } from "@prisma/client";

const normalizar = (nombre: string) => nombre.trim().toLocaleLowerCase("es");

/**
 * Inscribe en una bolsa a los hijos de un apoderado. Si el apoderado ya registró
 * un estudiante con el mismo nombre (por ejemplo en otra bolsa), se reutiliza.
 */
export async function inscribirEstudiantes(
  tx: Prisma.TransactionClient,
  input: { bolsaId: string; familiaId: string; apoderadoId: string; nombres: string[] }
) {
  const existentes = await tx.estudiante.findMany({
    where: { apoderadoId: input.apoderadoId },
    select: { id: true, nombre: true, inscripciones: { where: { bolsaId: input.bolsaId }, select: { id: true } } },
  });

  const inscritos = [];
  for (const nombre of input.nombres) {
    const previo = existentes.find((e) => normalizar(e.nombre) === normalizar(nombre));
    if (previo && previo.inscripciones.length > 0) continue; // ya está en esta bolsa

    const estudiante =
      previo ??
      (await tx.estudiante.create({
        // TODO(refactor/usuario-unico): bolsaId y familiaId se eliminan de Estudiante;
        // la relación con la bolsa vive en Inscripcion.
        data: { bolsaId: input.bolsaId, familiaId: input.familiaId, apoderadoId: input.apoderadoId, nombre: nombre.trim() },
      }));
    await tx.inscripcion.create({
      data: { bolsaId: input.bolsaId, familiaId: input.familiaId, estudianteId: estudiante.id },
    });
    inscritos.push({ id: estudiante.id, nombre: estudiante.nombre });
  }
  return inscritos;
}
