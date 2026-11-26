import { PrismaClient } from "@prisma/client";
import { hashSecret, generatePublicCode, generateInviteCode, generateComprobanteCode } from "../src/lib/crypto";
import { appendRegistro } from "../src/lib/registro";

const prisma = new PrismaClient();

const NOMBRE_BOLSA = "Bolsa 5B · Promoción 2027";
const PASSWORD_PADRES = "demo2026";
const CODIGO_RECUPERACION = "DEMO-2026";
const PASSWORD_COMITE = "comite2026";

const FAMILIAS = [
  { dni: "40123456", nombre: "Rosa Elena Quispe Mamani", estudiantes: ["Ana Quispe", "Luis Quispe"] },
  { dni: "41234567", nombre: "Julio César Ramos Torres", estudiantes: ["Diego Ramos"] },
  { dni: "42345678", nombre: "María Fernanda Flores Ríos", estudiantes: ["Camila Flores"] },
  { dni: "43456789", nombre: "Carlos Alberto Mendoza Vega", estudiantes: ["Sofía Mendoza", "Mateo Mendoza"] },
  { dni: "44567890", nombre: "Ana Lucía Paredes Ccahuana", estudiantes: ["Valeria Paredes"] },
  { dni: "45678901", nombre: "Jorge Luis Huamán Quispe", estudiantes: ["Sebastián Huamán"] },
];

const RESPONSABLES = [
  { dni: "50111222", nombre: "Patricia", apellidos: "Salazar Rojas", celular: "911222333", rol: "tesorero" as const },
  { dni: "50222333", nombre: "Fernando", apellidos: "Cárdenas Luna", celular: "922333444", rol: "presidente" as const },
  { dni: "50333444", nombre: "Gabriela", apellidos: "Torres Medina", celular: "933444555", rol: "secretario" as const },
];

const SUPERADMIN_DNI = process.env.SUPERADMIN_DNI ?? "10000001";
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD ?? "superadmin2026";
const ADMIN_DNI = "10000002";
const ADMIN_PASSWORD = "admin2026";

async function main() {
  const sa = hashSecret(SUPERADMIN_PASSWORD);
  const superadmin = await prisma.usuario.upsert({
    where: { dni: SUPERADMIN_DNI },
    update: {},
    create: { nombre: "Super", apellidos: "Admin", dni: SUPERADMIN_DNI, celular: "900000001", rol: "superadmin", contrasenaHash: sa.hash, contrasenaSalt: sa.salt },
  });
  const ad = hashSecret(ADMIN_PASSWORD);
  const admin = await prisma.usuario.upsert({
    where: { dni: ADMIN_DNI },
    update: {},
    create: { nombre: "Admin", apellidos: "Demo", dni: ADMIN_DNI, celular: "900000002", rol: "admin", contrasenaHash: ad.hash, contrasenaSalt: ad.salt, createdById: superadmin.id },
  });

  const existente = await prisma.bolsa.findFirst({ where: { nombre: NOMBRE_BOLSA } });
  if (existente) {
    console.log("Borrando bolsa de prueba existente para recrearla...");
    // aprobaciones y pagos referencian a responsables con RESTRICT: se borran antes que la bolsa.
    await prisma.$transaction([
      prisma.aprobacion.deleteMany({ where: { pago: { bolsaId: existente.id } } }),
      prisma.pago.deleteMany({ where: { bolsaId: existente.id } }),
      prisma.bolsa.delete({ where: { id: existente.id } }),
    ]);
  }

  const cuota = 50;
  const estudiantesEsperados = 32;
  const meta = cuota * estudiantesEsperados;

  const bolsa = await prisma.bolsa.create({
    data: {
      nombre: NOMBRE_BOLSA,
      colegio: "I.E. Nuestra Señora de la Esperanza",
      cuota,
      estudiantesEsperados,
      meta,
      codigoPublico: generatePublicCode(),
      codigoInvitacion: generateInviteCode(),
      estado: "activa",
      createdById: admin.id,
    },
  });

  for (const r of RESPONSABLES) {
    const { hash, salt } = hashSecret(PASSWORD_COMITE);
    await prisma.responsable.create({
      data: {
        bolsaId: bolsa.id,
        nombre: r.nombre,
        apellidos: r.apellidos,
        dni: r.dni,
        celular: r.celular,
        rol: r.rol,
        esTesorero: r.rol === "tesorero",
        contrasenaHash: hash,
        contrasenaSalt: salt,
      },
    });
  }

  const idsEstudiantesPorFamilia: { familiaId: string; estudianteId: string; nombre: string; familiaNombre: string }[] = [];

  for (const f of FAMILIAS) {
    const { hash, salt } = hashSecret(PASSWORD_PADRES);
    const { hash: recHash, salt: recSalt } = hashSecret(CODIGO_RECUPERACION);
    const familia = await prisma.familia.create({
      data: {
        bolsaId: bolsa.id,
        nombre: f.nombre,
        dni: f.dni,
        celular: "9" + f.dni.slice(0, 8),
        contrasenaHash: hash,
        contrasenaSalt: salt,
        recuperacionHash: recHash,
        recuperacionSalt: recSalt,
      },
    });

    for (const nombreEstudiante of f.estudiantes) {
      const estudiante = await prisma.estudiante.create({
        data: { bolsaId: bolsa.id, familiaId: familia.id, nombre: nombreEstudiante },
      });
      idsEstudiantesPorFamilia.push({
        familiaId: familia.id,
        estudianteId: estudiante.id,
        nombre: nombreEstudiante,
        familiaNombre: familia.nombre,
      });
    }
  }

  // Algunos aportes de ejemplo ya confirmados, encadenados en el registro.
  const aportesEjemplo = idsEstudiantesPorFamilia.slice(0, 5);
  for (const e of aportesEjemplo) {
    await prisma.$transaction(async (tx) => {
      const registro = await appendRegistro(tx, {
        bolsaId: bolsa.id,
        tipo: "aporte",
        detalle: `Aporte de S/ ${cuota.toFixed(2)} de ${e.familiaNombre} para ${e.nombre} (yape)`,
      });
      await tx.aporte.create({
        data: {
          bolsaId: bolsa.id,
          familiaId: e.familiaId,
          familiaNombre: e.familiaNombre,
          estudianteId: e.estudianteId,
          estudianteNombre: e.nombre,
          monto: cuota,
          medio: "yape",
          estado: "confirmado",
          registradoPor: e.familiaId,
          codigoComprobante: generateComprobanteCode(),
          registroId: registro.id,
        },
      });
    });
  }

  // Un pago ya propuesto por el tesorero, esperando aprobaciones.
  const tesorero = await prisma.responsable.findFirstOrThrow({ where: { bolsaId: bolsa.id, rol: "tesorero" } });
  await prisma.$transaction(async (tx) => {
    const registro = await appendRegistro(tx, {
      bolsaId: bolsa.id,
      tipo: "pago_propuesto",
      detalle: `${tesorero.nombre} propone pagar S/ 120.00 a Imprenta El Salón: polos de promoción`,
    });
    const pago = await tx.pago.create({
      data: {
        bolsaId: bolsa.id,
        proveedor: "Imprenta El Salón",
        monto: 120,
        motivo: "Polos de promoción 2027",
        proponenteId: tesorero.id,
        proponenteNombre: tesorero.nombre,
        estado: "pendiente",
        venceEn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        registroId: registro.id,
      },
    });
    await tx.aprobacion.create({
      data: {
        bolsaId: bolsa.id,
        pagoId: pago.id,
        responsableId: tesorero.id,
        responsableNombre: tesorero.nombre,
        decision: "aprobo",
      },
    });
  });

  console.log("\nBolsa de prueba creada:", bolsa.nombre);
  console.log("Código público (vista de transparencia):", bolsa.codigoPublico);
  console.log("Código de invitación (unirse):", bolsa.codigoInvitacion);
  console.log("Contraseña de los padres de prueba:", PASSWORD_PADRES);
  console.log("Código de recuperación de los padres de prueba:", CODIGO_RECUPERACION);
  console.log("Contraseña del comité de prueba:", PASSWORD_COMITE);
  console.log("DNIs de padres:", FAMILIAS.map((f) => f.dni).join(", "));
  console.log(`Superadmin: DNI ${SUPERADMIN_DNI} / contraseña ${SUPERADMIN_PASSWORD}`);
  console.log(`Admin: DNI ${ADMIN_DNI} / contraseña ${ADMIN_PASSWORD}`);
  console.log("DNI del tesorero (panel del comité):", tesorero.dni);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
