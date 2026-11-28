import { PrismaClient } from "@prisma/client";
import { hashSecret, generatePublicCode, generateInviteCode, generateComprobanteCode } from "../src/lib/crypto";
import { appendRegistro } from "../src/lib/registro";
import { inscribirEstudiantes } from "../src/lib/inscripciones";

const prisma = new PrismaClient();

const NOMBRE_BOLSA = "Bolsa 5B · Promoción 2027";
const PASSWORD_PADRES = "demo2026";
const CODIGO_RECUPERACION = "DEMO-2026";
const PASSWORD_COMITE = "comite2026";

const FAMILIAS = [
  { dni: "40123456", nombre: "Rosa Elena", apellidos: "Quispe Mamani", estudiantes: ["Ana Quispe", "Luis Quispe"] },
  { dni: "41234567", nombre: "Julio César", apellidos: "Ramos Torres", estudiantes: ["Diego Ramos"] },
  { dni: "42345678", nombre: "María Fernanda", apellidos: "Flores Ríos", estudiantes: ["Camila Flores"] },
  { dni: "43456789", nombre: "Carlos Alberto", apellidos: "Mendoza Vega", estudiantes: ["Sofía Mendoza", "Mateo Mendoza"] },
  { dni: "44567890", nombre: "Ana Lucía", apellidos: "Paredes Ccahuana", estudiantes: ["Valeria Paredes"] },
  { dni: "45678901", nombre: "Jorge Luis", apellidos: "Huamán Quispe", estudiantes: ["Sebastián Huamán"] },
];

const RESPONSABLES = [
  { dni: "50111222", nombre: "Patricia", apellidos: "Salazar Rojas", celular: "911222333", rol: "tesorero" as const },
  { dni: "50222333", nombre: "Fernando", apellidos: "Cárdenas Luna", celular: "922333444", rol: "presidente" as const },
  { dni: "50333444", nombre: "Gabriela", apellidos: "Torres Medina", celular: "933444555", rol: "secretario" as const },
];

// Segunda bolsa para probar el ingreso con varias membresías (/elegir):
// - Patricia (tesorera en la bolsa 1) es presidenta aquí.
// - Rosa Elena es madre de familia en ambas bolsas y además secretaria aquí.
const NOMBRE_BOLSA_2 = "Bolsa 5B · Viaje de promoción";
const RESPONSABLES_BOLSA_2 = [
  { dni: "50111222", rol: "presidente" as const },
  { dni: "50222333", rol: "tesorero" as const },
  { dni: "40123456", rol: "secretario" as const },
];
const FAMILIAS_BOLSA_2 = ["40123456", "41234567"];

const SUPERADMIN_DNI = process.env.SUPERADMIN_DNI ?? "10000001";
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD ?? "superadmin2026";
const ADMIN_DNI = "10000002";
const ADMIN_PASSWORD = "admin2026";

type UsuarioSeed = { id: string; nombre: string; apellidos: string; dni: string; celular: string };

async function crearResponsable(bolsaId: string, u: UsuarioSeed, rol: "tesorero" | "presidente" | "secretario") {
  // nombre, dni y celular se duplican desde Usuario hasta eliminar esas columnas de Responsable.
  return prisma.responsable.create({
    data: {
      bolsaId,
      usuarioId: u.id,
      nombre: u.nombre,
      apellidos: u.apellidos,
      dni: u.dni,
      celular: u.celular,
      rol,
    },
  });
}

async function crearFamilia(bolsaId: string, u: UsuarioSeed, nombresEstudiantes: string[]) {
  // nombre, dni y celular se duplican desde Usuario hasta eliminar esas columnas de Familia.
  const familia = await prisma.familia.create({
    data: { bolsaId, usuarioId: u.id, nombre: `${u.nombre} ${u.apellidos}`, dni: u.dni, celular: u.celular },
  });
  // Si el padre ya inscribió a sus hijos en otra bolsa, se reutilizan los mismos estudiantes.
  const estudiantes = await inscribirEstudiantes(prisma, {
    bolsaId,
    familiaId: familia.id,
    apoderadoId: u.id,
    nombres: nombresEstudiantes,
  });
  return { familia, estudiantes };
}

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

  for (const nombre of [NOMBRE_BOLSA, NOMBRE_BOLSA_2]) {
    const existente = await prisma.bolsa.findFirst({ where: { nombre } });
    if (!existente) continue;
    console.log(`Borrando "${nombre}" para recrearla...`);
    // aprobaciones y pagos referencian a responsables: se borran antes que la bolsa.
    await prisma.$transaction([
      prisma.aprobacion.deleteMany({ where: { pago: { bolsaId: existente.id } } }),
      prisma.pago.deleteMany({ where: { bolsaId: existente.id } }),
      prisma.bolsa.delete({ where: { id: existente.id } }),
    ]);
  }

  // Cuentas únicas (Usuario) de responsables y padres.
  const usuarioPorDni = new Map<string, UsuarioSeed>();
  for (const r of RESPONSABLES) {
    const { hash, salt } = hashSecret(PASSWORD_COMITE);
    const u = await prisma.usuario.upsert({
      where: { dni: r.dni },
      update: {},
      create: { nombre: r.nombre, apellidos: r.apellidos, dni: r.dni, celular: r.celular, rol: "usuario", contrasenaHash: hash, contrasenaSalt: salt },
    });
    usuarioPorDni.set(r.dni, u);
  }
  for (const f of FAMILIAS) {
    const pass = hashSecret(PASSWORD_PADRES);
    const rec = hashSecret(CODIGO_RECUPERACION);
    const u = await prisma.usuario.upsert({
      where: { dni: f.dni },
      update: {},
      create: {
        nombre: f.nombre,
        apellidos: f.apellidos,
        dni: f.dni,
        celular: "9" + f.dni.slice(0, 8),
        rol: "usuario",
        contrasenaHash: pass.hash,
        contrasenaSalt: pass.salt,
        recuperacionHash: rec.hash,
        recuperacionSalt: rec.salt,
      },
    });
    usuarioPorDni.set(f.dni, u);
  }
  const usuario = (dni: string): UsuarioSeed => {
    const u = usuarioPorDni.get(dni);
    if (!u) throw new Error(`Usuario ${dni} no definido en el seed`);
    return u;
  };

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
      adminId: admin.id,
      createdById: admin.id,
    },
  });

  for (const r of RESPONSABLES) {
    await crearResponsable(bolsa.id, usuario(r.dni), r.rol);
  }

  const idsEstudiantesPorFamilia: { familiaId: string; estudianteId: string; nombre: string; familiaNombre: string }[] = [];

  for (const f of FAMILIAS) {
    const { familia, estudiantes } = await crearFamilia(bolsa.id, usuario(f.dni), f.estudiantes);
    for (const e of estudiantes) {
      idsEstudiantesPorFamilia.push({
        familiaId: familia.id,
        estudianteId: e.id,
        nombre: e.nombre,
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

  const bolsa2 = await prisma.bolsa.create({
    data: {
      nombre: NOMBRE_BOLSA_2,
      colegio: "I.E. Nuestra Señora de la Esperanza",
      cuota: 100,
      estudiantesEsperados: 32,
      meta: 100 * 32,
      codigoPublico: generatePublicCode(),
      codigoInvitacion: generateInviteCode(),
      estado: "activa",
      adminId: admin.id,
      createdById: admin.id,
    },
  });
  for (const r of RESPONSABLES_BOLSA_2) {
    await crearResponsable(bolsa2.id, usuario(r.dni), r.rol);
  }
  for (const dni of FAMILIAS_BOLSA_2) {
    const f = FAMILIAS.find((x) => x.dni === dni)!;
    await crearFamilia(bolsa2.id, usuario(dni), f.estudiantes);
  }

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
  console.log(`\nSegunda bolsa: ${bolsa2.nombre} (código de invitación ${bolsa2.codigoInvitacion})`);
  console.log("Varias membresías (pasan por /elegir): 50111222 (comité en ambas), 40123456 (madre en ambas y secretaria en la 2.ª)");
  console.log("La contraseña es la de su cuenta: comite2026 para 50111222, demo2026 para 40123456.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
