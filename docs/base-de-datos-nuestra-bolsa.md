# Nuestra Bolsa — Base de datos

Versión 2.0 · 28 de noviembre de 2026

11 tablas. La identidad de cada persona vive en una sola cuenta (`Usuario`), y su participación en cada bolsa se guarda como membresía (`Familia` o `Responsable`). Así una misma persona, y sus hijos, pueden estar en varias bolsas: la promoción, el viaje de promoción, la fiesta, etc.

El diagrama entidad-relación está en [nuevo-schema-nuestra-bolsa.md](nuevo-schema-nuestra-bolsa.md).

## Relaciones

- Usuario 1 → N Bolsa (el admin que la creó)
- Usuario 1 → N Familia y Responsable (sus membresías, una por bolsa como máximo de cada tipo)
- Usuario 1 → N Estudiante (sus hijos)
- Bolsa 1 → N Familia, Responsable, Inscripcion, Aporte, Pago, Registro, Recordatorio
- Inscripcion une a un Estudiante con una Bolsa a través de la Familia
- Familia 1 → N Aporte, Recordatorio
- Responsable 1 → N Pago (propuestos), Aprobacion, Recordatorio (enviados) y Aporte (registrados o confirmados en efectivo)
- Pago 1 → N Aprobacion (3 responsables como máximo)
- Aporte y Pago apuntan a un Registro (el movimiento de la cadena)

## Usuario

La cuenta única de cada persona. Su DNI es el usuario con el que entra a la plataforma.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| nombre | texto | sí | Nombres |
| apellidos | texto | sí | Apellidos |
| dni | texto (8 dígitos) | sí | Usuario de acceso; único en toda la plataforma |
| dni_foto_uri | texto | no | Foto del DNI (archivo privado) |
| celular | texto (9 dígitos) | sí | Solo dígitos; nunca se muestra en la vista pública |
| rol | enum: superadmin, admin, usuario | sí | Rol global. El cargo en el comité y el ser padre dependen de cada bolsa |
| contrasena_hash | texto | sí | Huella PBKDF2-SHA256 de la contraseña (la contraseña no se guarda) |
| contrasena_salt | texto | sí | Sal aleatoria de la contraseña |
| debe_cambiar_contrasena | booleano | no | Obliga a cambiarla en el siguiente ingreso. Por defecto: no |
| recuperacion_hash | texto | no | Huella del código de recuperación |
| recuperacion_salt | texto | no | Sal aleatoria del código de recuperación |

## Bolsa

La bolsa común de un salón para un fin concreto. Cada bolsa tiene un enlace de invitación y un enlace público de transparencia.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| nombre | texto | sí | Ej.: Bolsa 5.º A · Promoción 2026 |
| colegio | texto | sí | Nombre del colegio |
| cuota | número | sí | Cuota por estudiante, en soles |
| estudiantes_esperados | número | no | Cuántos estudiantes hay en el salón |
| meta | número | no | Cuota × estudiantes (se calcula al crear la bolsa) |
| acta_uri | texto | no | Foto del acta firmada por los 3 responsables (archivo privado) |
| codigo_publico | texto | sí | Código del enlace público de transparencia |
| codigo_invitacion | texto | sí | Código del enlace para que se unan las familias |
| estado | enum: activa, cerrada | no | Por defecto: activa |
| admin_id | texto | sí | Usuario administrador que creó la bolsa |

## Responsable

La membresía de un usuario en el comité de una bolsa. Los 3 integrantes son quienes aprueban los pagos.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| bolsa_id | texto | sí | Bolsa a la que pertenece |
| usuario_id | texto | sí | Persona que ocupa el cargo |
| cargo | enum: tesorero, presidente, secretario | sí | Cargo en el comité |

Restricciones: una persona ocupa un solo cargo por bolsa (`bolsa_id`, `usuario_id`) y cada cargo lo ocupa una sola persona (`bolsa_id`, `cargo`).

## Familia

La membresía de un padre o madre en una bolsa. Sus datos personales están en su `Usuario`.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| bolsa_id | texto | sí | Bolsa a la que pertenece |
| usuario_id | texto | sí | Padre o madre |
| estado | enum: activa, retirada | no | Por defecto: activa. Una familia retirada no entra a la bolsa ni aparece en el CRM |
| retirada_en | fecha y hora | no | Cuándo se retiró del colegio |

Restricción: un usuario se une una sola vez a cada bolsa (`bolsa_id`, `usuario_id`).

## Estudiante

Los hijos e hijas de un apoderado. Un mismo estudiante puede participar en varias bolsas.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| apoderado_id | texto | sí | Usuario apoderado (un solo apoderado por estudiante) |
| nombre | texto | sí | Nombre del estudiante |
| apellidos | texto | no | Apellidos del estudiante |

## Inscripcion

La participación de un estudiante en una bolsa, a través de la familia. La cuota esperada de una familia es la cuota de la bolsa × sus inscripciones.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| bolsa_id | texto | sí | Bolsa |
| familia_id | texto | sí | Familia que lo inscribe |
| estudiante_id | texto | sí | Estudiante inscrito |

Restricción: un estudiante se inscribe una sola vez en cada bolsa (`bolsa_id`, `estudiante_id`).

## Aporte

Cada cuota pagada por una familia, por Yape, Plin, tarjeta o efectivo.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| bolsa_id | texto | sí | Bolsa del aporte |
| familia_id | texto | sí | Familia que aporta |
| familia_nombre | texto | no | Copia histórica del nombre para listados y documentos |
| estudiante_id | texto | no | Estudiante al que corresponde la cuota |
| estudiante_nombre | texto | no | Copia histórica del nombre del estudiante |
| monto | número | sí | En soles, mínimo S/ 1 |
| medio | enum: yape, plin, tarjeta, efectivo | sí | Cómo se pagó |
| estado | enum: confirmado, por_confirmar | no | El efectivo nace por_confirmar |
| registrado_por_id | texto | no | Responsable que registró el aporte en nombre del padre. Vacío si lo registró el propio padre |
| registrado_por_nombre | texto | no | Copia histórica del nombre de ese responsable |
| confirmado_por_id | texto | no | Responsable que confirmó el efectivo |
| fecha | fecha y hora | no | Momento del aporte |
| codigo_comprobante | texto | sí | Código de 10 caracteres para consultar el comprobante |
| registro_id | texto | no | Movimiento del registro encadenado |

## Pago

Una salida de dinero de la bolsa: un gasto a un proveedor o la devolución a una familia retirada. Solo se paga con las 3 aprobaciones del comité.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| bolsa_id | texto | sí | Bolsa del pago |
| tipo | enum: gasto, devolucion | no | Por defecto: gasto |
| familia_id | texto | no | Familia que recibe la devolución (solo cuando tipo = devolucion) |
| proveedor | texto | sí | A quién se le paga |
| cuenta_proveedor | texto | no | Cuenta o número de Yape/Plin del proveedor |
| monto | número | sí | En soles, mínimo S/ 1 |
| motivo | texto | sí | Para qué es el gasto |
| proponente_id | texto | sí | Responsable que propone (queda como primera aprobación) |
| proponente_nombre | texto | no | Copia histórica del nombre del proponente |
| estado | enum: pendiente, pagado, rechazado, vencido | no | Por defecto: pendiente |
| vence_en | fecha y hora | no | 7 días desde la propuesta |
| pagado_en | fecha y hora | no | Cuándo se completaron las 3 aprobaciones |
| motivo_rechazo | texto | no | Motivo si algún responsable rechaza |
| comprobante_uri | texto | no | Foto de la cotización (archivo privado) |
| registro_id | texto | no | Movimiento del registro encadenado |

## Aprobacion

La decisión de cada responsable sobre un pago. Hacen falta 3 de 3 para pagar.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| bolsa_id | texto | no | Bolsa del pago |
| pago_id | texto | sí | Pago aprobado o rechazado |
| responsable_id | texto | sí | Quién decide |
| responsable_nombre | texto | no | Copia histórica del nombre del responsable |
| decision | enum: aprobo, rechazo | sí | Decisión tomada |
| fecha | fecha y hora | no | Momento de la decisión |

## Recordatorio

El historial de recordatorios de pago enviados desde el CRM.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| bolsa_id | texto | sí | Bolsa |
| familia_id | texto | sí | Familia a la que se le recordó |
| enviado_por_id | texto | sí | Responsable que lo envió |
| canal | enum: whatsapp | no | Por defecto: whatsapp |
| saldo_pendiente | número | sí | Lo que debía la familia en ese momento |
| fecha | fecha y hora | no | Cuándo se envió |

## Registro

El registro encadenado: cada movimiento apunta al anterior, así cualquiera puede verificar que nada se cambió.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| bolsa_id | texto | sí | Bolsa del movimiento |
| tipo | enum: aporte, pago_propuesto, pago_aprobado, pago_pagado, pago_rechazado, pago_vencido | sí | Qué ocurrió |
| detalle | texto | sí | Texto legible del movimiento |
| secuencia | número | sí | Posición dentro de la cadena de la bolsa |
| codigo | texto | sí | Código que encadena este registro con el anterior |
| anterior | texto | no | Código del registro anterior |
| enlace_verificable | texto | no | Enlace externo de verificación, si se usa un registro público |
| fuente | enum: demostracion, stellar | no | Por defecto: demostracion |

## Notas

- Todas las tablas tienen además los campos automáticos: id, created_date, updated_date y created_by_id.
- Los montos se guardan en soles, con dos decimales.
- Las fechas se guardan en formato ISO 8601 (UTC) y se muestran en hora de Lima.
- Los campos `*_nombre` de Aporte, Pago y Aprobacion son copias históricas: no cambian si la persona edita su nombre, porque el texto del registro encadenado no debe alterarse.
- Los archivos (DNI, acta, comprobantes) se guardan en almacenamiento privado como file_uri y se abren con enlaces firmados temporales.
- Ninguna tabla es pública: la lectura y escritura ocurren solo en las funciones del servidor, con validación previa de quién es el responsable.
- La vista pública de la bolsa se arma desde esas funciones y no expone celulares, DNIs ni datos personales.
