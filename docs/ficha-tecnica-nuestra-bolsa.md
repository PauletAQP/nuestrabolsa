# Nuestra Bolsa — Ficha técnica del proyecto

Versión 1.0 · 24 de noviembre de 2026

## 1. Resumen

- Nuestra Bolsa es una plataforma web (escritorio y celular) para administrar la bolsa común de un salón escolar con transparencia total.
- Cada padre entra con su DNI y su contraseña, aporta la cuota a nombre de su hijo o hija, y ve en qué se gastó cada sol.
- Ningún gasto sale sin la aprobación de los 3 responsables del comité: tesorero, presidente y secretario.

## 2. Arquitectura y tecnología

- Interfaz: React 19 con TanStack Start (rutas por archivo, render en servidor), Tailwind CSS y componentes shadcn/ui.
- Backend: plataforma Base44 (entidades de datos, autenticación, almacenamiento privado de archivos, hosting en Cloudflare Workers) y server functions de TanStack Start para toda la lógica sensible.
- Documentos: jsPDF genera el PDF de gastos de la bolsa y esta ficha técnica.
- Validación de datos con Zod en cada server function; montos, DNI y códigos se validan en el servidor, no solo en pantalla.

## 3. Modelo de datos (8 entidades)

- Bolsa: nombre, colegio, cuota por estudiante, estudiantes del salón, meta, códigos público y de invitación, acta del comité (archivo privado) y estado.
- Responsable: nombres, apellidos, DNI, celular, foto del DNI (archivo privado) y rol (tesorero, presidente o secretario).
- Familia: nombre del padre o madre, DNI (su usuario), celular, huella y sal de la contraseña, huella y sal del código de recuperación.
- Estudiante: nombre, familia a la que pertenece y bolsa.
- Aporte: monto, medio de pago (Yape, Plin, tarjeta o efectivo), estado, estudiante al que corresponde, quién lo registró y comprobante.
- Pago: proveedor, cuenta, monto, motivo, quién lo propone, estado, vencimiento y comprobante de la cotización.
- Aprobacion: pago, responsable, decisión (aprobó o rechazó) y fecha.
- Registro: tipo de movimiento, detalle, número de secuencia, código y código anterior (cadena verificable).

## 4. Reglas de negocio

- La meta de la bolsa es obligatoria y se calcula sola: cuota por estudiante × número de estudiantes del salón.
- Un pago necesita 3 de 3 aprobaciones. Quien propone el pago queda como primera aprobación; faltan los otros dos responsables.
- Si un responsable rechaza, el pago se anula y queda anotado con el motivo.
- El efectivo lo registra el tesorero y lo confirma otro responsable; mientras no se confirme, no cuenta en el saldo.
- Cada aporte se anota a nombre de un estudiante de la familia, para saber a quién corresponde la cuota.
- Todos los montos de cuotas y pagos deben ser de al menos S/ 1.
- Los pagos propuestos vencen a los 7 días y se marcan como vencidos automáticamente.
- Cada movimiento se encadena al anterior en el registro de la bolsa, y cualquier persona puede verificar la cadena desde el enlace público.

## 5. Seguridad y privacidad

- Las contraseñas nunca se guardan: se guarda solo una huella PBKDF2-SHA256 con 150.000 iteraciones y una sal distinta por familia.
- La recuperación de contraseña usa un código único por familia, también guardado como huella, y se regenera cada vez que se usa.
- Las fotos de DNI, el acta y los comprobantes se guardan en almacenamiento privado y solo se abren con enlaces firmados temporales.
- Todas las entidades tienen reglas de acceso cerradas: la lectura y escritura ocurren únicamente en el servidor, con validación previa de quién es el responsable.
- La vista pública de la bolsa no muestra celulares, DNIs ni datos personales de las familias.

## 6. Pantallas

- Públicas: entrada con DNI y contraseña, recuperar contraseña, crear una bolsa (4 pasos: salón, cuota, comité con DNI y acta, compartir), unirse por invitación, vista pública de la bolsa, registro encadenado, comprobante por código y cómo se protege la información.
- Del padre o madre: inicio con el saldo y su avance, aportar la cuota, pagos de la bolsa y registro de movimientos, recibo del aporte.
- Del comité: panel del comité, detalle de un pago con sus aprobaciones, proponer un pago, familias y avance de aportes, efectivo por confirmar y CRM con el dinero por bolsa y por padre.

## 7. Datos de prueba

- Bolsa de prueba: Bolsa 5B · Promoción 2027 (cuota S/ 50, 32 estudiantes, meta S/ 1,000).
- Contraseña para todos los padres de prueba: demo2026. Código de recuperación: DEMO-2026.
- 40123456 · Rosa Elena Quispe Mamani · Ana Quispe y Luis Quispe
- 41234567 · Julio César Ramos Torres · Diego Ramos
- 42345678 · María Fernanda Flores Ríos · Camila Flores
- 43456789 · Carlos Alberto Mendoza Vega · Sofía Mendoza y Mateo Mendoza
- 44567890 · Ana Lucía Paredes Ccahuana · Valeria Paredes
- 45678901 · Jorge Luis Huamán Quispe · Sebastián Huamán
- El panel del comité se abre con la sesión del tesorero que creó la bolsa, no con las cuentas de padres de prueba.
