# Nuestra Bolsa

Plataforma web para que los padres de familia de un colegio reúnan, administren y rindan cuentas de un fondo común (la «bolsa») de forma **transparente**: cada aporte y cada gasto queda registrado en una cadena verificable que cualquiera puede auditar.

> Documento de requisitos de producto (PRD) + guía de arranque.

---

## 1. Resumen

| | |
| --- | --- |
| **Problema** | Las colectas de padres (paseos, útiles, mejoras del aula) se manejan en efectivo y chats de WhatsApp: no hay trazabilidad, hay desconfianza y los responsables cargan solos con la rendición de cuentas. |
| **Solución** | Una bolsa digital por salón/colegio donde los padres aportan (Yape, Plin, tarjeta o efectivo), un comité de 3 responsables debe aprobar por unanimidad cada gasto, y todo movimiento se registra en un libro encadenado por hashes y de consulta pública. |
| **Idioma / mercado** | Español, Perú (montos en soles `S/`, medios de pago Yape/Plin, identificación por DNI). |

## 2. Objetivos

1. **Transparencia**: todo ingreso y egreso es visible y verificable por cualquier padre.
2. **Control compartido**: ningún gasto sale sin la aprobación de los 3 responsables.
3. **Simplicidad**: un padre se une con un código/enlace y aporta en pocos pasos, desde el celular.
4. **Rendición de cuentas**: comprobantes (recibos) y reportes de gastos descargables en PDF.

**Fuera de alcance (por ahora):** pasarela de pagos real, notificaciones push/SMS, app móvil nativa, multi-moneda. El anclaje en Stellar está modelado (`FuenteRegistro.stellar`) pero hoy todos los registros son de tipo `demostracion`.

## 3. Roles y permisos

| Rol | Qué puede hacer | Rutas |
| --- | --- | --- |
| `superadmin` | Crear usuarios con rol administrador | `/superadmin` |
| `admin` | Único que puede crear bolsas y sus 3 responsables | `/admin`, `/crear` |
| Padre / familia | Unirse a una bolsa, registrar aportes, descargar recibos, ver pagos | `/inicio` |
| Comité (responsables: presidente, tesorero, secretario) | Proponer y aprobar/rechazar pagos, confirmar efectivo, ver aportes y familias | `/comite` |
| Público (sin sesión) | Ver la bolsa, su saldo y el registro verificable mediante su código público | `/b/[codigo]` |

## 4. Funcionalidades

### 4.1 Administración
- **Superadmin**: alta de administradores (`crear-admin-form`).
- **Admin**: asistente para crear una bolsa (`crear-bolsa-wizard`) con nombre, colegio, cuota, estudiantes esperados, meta, acta (archivo) y los 3 responsables con DNI, foto del DNI y celular.
- Cada bolsa genera un **código público** (consulta) y un **código de invitación** (unirse).

### 4.2 Familias (padres)
- Registro y unión a una bolsa mediante enlace/código de invitación (`/unirse/[codigo]`), con uno o varios estudiantes por familia.
- Inicio de sesión con DNI y contraseña; **recuperación de contraseña** (`/recuperar`) con código de recuperación; página de seguridad (`/seguridad`).
- **Aportes**: Yape, Plin o tarjeta (confirmados al instante) y efectivo (queda `por_confirmar` hasta que el comité lo confirme).
- Historial de aportes y **recibo en PDF** con código de comprobante único (`/inicio/recibo/[id]`, `/comprobante`).
- Vista de los pagos de la bolsa (`/inicio/pagos`).

### 4.3 Comité
- **Proponer pagos** a proveedores (monto, motivo, cuenta del proveedor).
- **Aprobación unánime 3 de 3**: el proponente cuenta como primer voto; el pago pasa a `pagado` solo cuando los 3 responsables aprueban. Un rechazo cierra el pago con su motivo.
- **Vencimiento automático** a los 7 días si no se completan las aprobaciones.
- Adjuntar comprobante del pago pagado.
- **Efectivo**: registrar aportes en efectivo y confirmar los reportados por familias.
- Paneles de aportes, familias y CRM (`/comite/aportes`, `/comite/familias`, `/comite/crm`).
- **Reporte de gastos en PDF**.

### 4.4 Transparencia pública
- Página pública de la bolsa (`/b/[codigo]`): progreso hacia la meta, aportes y pagos.
- **Registro verificable** (`/b/[codigo]/registro`, `/ver`): libro de movimientos encadenado por hashes (`aporte`, `pago_propuesto`, `pago_aprobado`, `pago_pagado`, `pago_rechazado`, `pago_vencido`). Cada eslabón incluye el código del anterior; la verificación recalcula la cadena completa y detecta cualquier alteración.

## 5. Reglas de negocio clave

- Una bolsa tiene exactamente **3 responsables**; todos deben aprobar para liberar un pago.
- Un responsable no puede votar dos veces el mismo pago (`@@unique([pagoId, responsableId])`).
- DNI único por bolsa para familias y responsables; DNI único global para usuarios.
- Cada movimiento se agrega en una **transacción** que lee el último eslabón y encadena el nuevo (`appendRegistro`).
- Estados: bolsa `activa|cerrada`; aporte `confirmado|por_confirmar`; pago `pendiente|pagado|rechazado|vencido`.

## 6. Requisitos no funcionales

- **Seguridad**: contraseñas con PBKDF2-SHA256 (150 000 iteraciones, salt por usuario) y comparación en tiempo constante; sesión en cookie `httpOnly`, `sameSite=lax`, `secure` en producción, JWT firmado (30 días); archivos en almacenamiento privado, solo PNG/JPG/WebP/PDF de hasta 8 MB y servidos mediante `/api/files/[id]`; validación de entradas con Zod.
- **Integridad**: libro de movimientos con hashes encadenados; montos con `Decimal(10,2)`.
- **Usabilidad**: diseño responsive (mobile first), modo claro/oscuro, notificaciones con toasts.
- **Auditabilidad**: todas las tablas con `created_by`, `created_date`, `updated_date`.

## 7. Stack tecnológico

| Capa | Tecnología |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) 16 (App Router, Server Actions) |
| UI | React 19, TypeScript 5 |
| Estilos | Tailwind CSS 4, `tw-animate-css`, `class-variance-authority` |
| Componentes | shadcn/ui sobre [Base UI](https://base-ui.com) (`@base-ui/react`), `lucide-react`, `sonner`, `next-themes` |
| Base de datos | PostgreSQL + [Prisma](https://www.prisma.io) 6 (migraciones y seed) |
| Autenticación | `jose` (JWT en cookie), PBKDF2 con `crypto` de Node |
| Validación | Zod 4 |
| PDF | `jspdf` (recibos y reporte de gastos) |
| Utilidades | `date-fns`, `nanoid` |
| Tooling | pnpm, ESLint 9, `tsx` |

## 8. Modelo de datos

`Usuario` (superadmin/admin) · `Bolsa` · `Responsable` · `Familia` · `Estudiante` · `Aporte` · `Pago` · `Aprobacion` · `Registro` (cadena de hashes). Definición completa en [prisma/schema.prisma](prisma/schema.prisma).

## 9. Estructura del proyecto

```
src/
  app/          Rutas (App Router): admin, superadmin, crear, unirse, inicio,
                comite, b/[codigo], ver, comprobante, recuperar, seguridad, api/
  components/
    nb/         Componentes del dominio (formularios, wizard, listas, PDFs)
    ui/         Componentes base (shadcn/ui)
  lib/
    actions/    Server Actions: auth, bolsa, aportes, pagos, usuarios
    crypto.ts   Hashing, códigos y cadena de hashes
    registro.ts Libro encadenado y verificación
    session.ts  Sesión JWT en cookie
    files.ts    Almacenamiento privado de archivos
    schemas.ts  Esquemas Zod
prisma/         schema, migraciones y seed
```

## 10. Puesta en marcha

Requisitos: Node.js 20+, pnpm y una base PostgreSQL.

```bash
pnpm install
cp .env.example .env        # o crea .env con las variables de abajo
pnpm prisma migrate deploy  # aplica las migraciones
pnpm db:seed                # crea el superadmin (y datos demo)
pnpm dev                    # http://localhost:3000
```

Variables de entorno:

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `SESSION_SECRET` | Secreto largo y aleatorio para firmar sesiones y enlaces de archivos (obligatorio en producción) |
| `SUPERADMIN_DNI` / `SUPERADMIN_PASSWORD` | Credenciales del superadmin del seed (por defecto `10000001` / `superadmin2026`) |

Scripts: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm db:seed`.

## 11. Hoja de ruta

- Anclar el registro verificable en Stellar (`FuenteRegistro.stellar`).
- Integración real con pasarelas de pago (Yape/Plin/tarjeta).
- Notificaciones (WhatsApp/SMS/correo) de aportes y aprobaciones pendientes.
- Cierre de bolsa con informe final y exportación contable.
