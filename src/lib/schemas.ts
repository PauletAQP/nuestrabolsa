import { z } from "zod";

const dni = z.string().regex(/^\d{8}$/, "El DNI debe tener 8 dígitos");
const celular = z.string().regex(/^\d{9}$/, "El celular debe tener 9 dígitos");
const monto = z.coerce.number().min(1, "El monto mínimo es S/ 1");

export const loginSchema = z.object({
  dni,
  contrasena: z.string().min(1, "Ingresa tu contraseña"),
});

export const recuperarSchema = z.object({
  dni,
  codigoRecuperacion: z.string().min(4, "Código inválido"),
  nuevaContrasena: z.string().min(6, "Mínimo 6 caracteres"),
});

export const responsableSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  apellidos: z.string().min(2, "Apellidos requeridos"),
  dni,
  celular,
  cargo: z.enum(["tesorero", "presidente", "secretario"]),
  dniFotoUri: z.string().optional(),
  contrasena: z.string().min(6, "Mínimo 6 caracteres"),
});

export const crearAdminSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  apellidos: z.string().min(2, "Apellidos requeridos"),
  dni,
  celular,
  contrasena: z.string().min(6, "Mínimo 6 caracteres"),
});

export const crearBolsaSchema = z.object({
  nombre: z.string().min(3, "Nombre de la bolsa requerido"),
  colegio: z.string().min(2, "Nombre del colegio requerido"),
  cuota: monto,
  estudiantesEsperados: z.coerce.number().int().min(1, "Debe haber al menos 1 estudiante"),
  actaUri: z.string().optional(),
  responsables: z.array(responsableSchema).length(3, "Se requieren exactamente 3 responsables"),
});

export const unirseSchema = z.object({
  codigoInvitacion: z.string().min(4),
  nombre: z.string().min(2, "Nombre requerido"),
  apellidos: z.string().min(2, "Apellidos requeridos"),
  dni,
  celular,
  contrasena: z.string().min(6, "Mínimo 6 caracteres"),
  estudiantes: z
    .array(z.object({ nombre: z.string().min(2, "Nombre del estudiante requerido") }))
    .min(1, "Agrega al menos un estudiante"),
});

export const aportarSchema = z.object({
  estudianteId: z.string().min(1, "Selecciona un estudiante"),
  monto,
  medio: z.enum(["yape", "plin", "tarjeta", "efectivo"]),
});

export const proponerPagoSchema = z.object({
  proveedor: z.string().min(2, "Proveedor requerido"),
  cuentaProveedor: z.string().optional(),
  monto,
  motivo: z.string().min(3, "Motivo requerido"),
  comprobanteUri: z.string().optional(),
});

export const decidirPagoSchema = z.object({
  pagoId: z.string().min(1),
  decision: z.enum(["aprobo", "rechazo"]),
  motivoRechazo: z.string().optional(),
});

export const editarFamiliaSchema = z.object({
  familiaId: z.string().min(1),
  nombre: z.string().min(2, "Los nombres del padre o madre son requeridos"),
  apellidos: z.string().min(2, "Los apellidos del padre o madre son requeridos"),
  dni,
  celular,
  estudiantes: z
    .array(
      z.object({
        id: z.string().optional(),
        nombre: z.string().min(2, "El nombre del estudiante es requerido"),
      })
    )
    .min(1, "Debe registrar al menos un estudiante"),
});

export type CrearBolsaInput = z.infer<typeof crearBolsaSchema>;
export type UnirseInput = z.infer<typeof unirseSchema>;
export type AportarInput = z.infer<typeof aportarSchema>;
export type ProponerPagoInput = z.infer<typeof proponerPagoSchema>;
export type EditarFamiliaInput = z.infer<typeof editarFamiliaSchema>;
