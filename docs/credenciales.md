# Credenciales de Acceso — Nuestra Bolsa

Este documento reúne las credenciales de acceso para pruebas y administración de la plataforma **Nuestra Bolsa**, configuradas en el seeder inicial (`prisma/seed.ts`).

---

## 🔐 Resumen de Accesos Rápidos

| Rol / Tipo de Usuario | DNI / Usuario | Contraseña | Redirección / Panel |
| :--- | :--- | :--- | :--- |
| **Superadministrador** | `10000001` | `superadmin2026` | `/superadmin` |
| **Administrador** | `10000002` | `admin2026` | `/admin` |
| **Tesorero (Comité)** | `50111222` | `comite2026` | `/comite` |
| **Presidente (Comité)** | `50222333` | `comite2026` | `/comite` |
| **Secretario (Comité)** | `50333444` | `comite2026` | `/comite` |
| **Padres / Familias (Demo)** | Ver tabla abajo | `demo2026` | `/inicio` |

> Todos los usuarios ingresan desde la página principal `/` con su **DNI** y su respectiva **Contraseña**.

---

## 1. Administradores de la Plataforma

| Rol | DNI | Contraseña | Nombre | Teléfono | Panel |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Superadmin** | `10000001` | `superadmin2026` | Super Admin | 900000001 | `/superadmin` |
| **Admin** | `10000002` | `admin2026` | Admin Demo | 900000002 | `/admin` |

---

## 2. Comité de Responsables (Bolsa 5B · Promoción 2027)

> **Contraseña general del comité:** `comite2026`

| Cargo | DNI | Contraseña | Nombre Completo | Celular |
| :--- | :--- | :--- | :--- | :--- |
| **Tesorero** | `50111222` | `comite2026` | Patricia Salazar Rojas | 911222333 |
| **Presidente** | `50222333` | `comite2026` | Fernando Cárdenas Luna | 922333444 |
| **Secretario** | `50333444` | `comite2026` | Gabriela Torres Medina | 933444555 |

---

## 3. Familias / Padres de Familia de Prueba

> **Contraseña para todos los padres de prueba:** `demo2026`  
> **Código de recuperación de contraseña:** `DEMO-2026`

| DNI (Usuario) | Contraseña | Nombre del Padre / Madre | Celular | Estudiante(s) a Cargo |
| :--- | :--- | :--- | :--- | :--- |
| `40123456` | `demo2026` | Rosa Elena Quispe Mamani | 94012345 | Ana Quispe, Luis Quispe |
| `41234567` | `demo2026` | Julio César Ramos Torres | 94123456 | Diego Ramos |
| `42345678` | `demo2026` | María Fernanda Flores Ríos | 94234567 | Camila Flores |
| `43456789` | `demo2026` | Carlos Alberto Mendoza Vega | 94345678 | Sofía Mendoza, Mateo Mendoza |
| `44567890` | `demo2026` | Ana Lucía Paredes Ccahuana | 94456789 | Valeria Paredes |
| `45678901` | `demo2026` | Jorge Luis Huamán Quispe | 94567890 | Sebastián Huamán |

---

## 4. Datos de la Bolsa de Prueba

- **Nombre:** Bolsa 5B · Promoción 2027
- **Colegio:** I.E. Nuestra Señora de la Esperanza
- **Cuota por estudiante:** S/ 50.00
- **Estudiantes esperados:** 32
- **Meta calculada:** S/ 1,000.00
- **Estado:** Activa
