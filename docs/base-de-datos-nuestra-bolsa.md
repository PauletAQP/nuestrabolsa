# Nuestra Bolsa — Base de datos

Versión 1.0 · 24 de noviembre de 2026

8 tablas. Cada tabla es una entidad de la plataforma: un registro JSON por fila.

## Relaciones

- Bolsa 1 → N Responsable, Familia, Estudiante, Aporte, Pago, Registro
- Familia 1 → N Estudiante (los hijos que pagan esa familia)
- Familia 1 → N Aporte
- Pago 1 → N Aprobacion (3 responsables como máximo)
- Aporte y Pago apuntan a un Registro (el movimiento de la cadena)

## Bolsa

La bolsa común de un salón. Cada bolsa tiene un enlace de invitación y un enlace público de transparencia.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| nombre | texto | sí | Ej.: Bolsa 5.º A · Promoción 2026 |
| colegio | texto | sí | Nombre del colegio |
| cuota | número | sí | Cuota por estudiante, en soles |
| estudiantes_esperados | número | no | Cuántos estudiantes hay en el salón |
| meta | número | no | Cuota × estudiantes (se calcula al crear la bolsa) |
| acta_uri | texto | sí | Foto del acta firmada por los 3 responsables (archivo privado) |
| codigo_publico | texto | sí | Código del enlace público de transparencia |
| codigo_invitacion | texto | sí | Código del enlace para que se unan las familias |
| estado | enum: activa, cerrada | no | Por defecto: activa |

## Responsable

Los 3 integrantes del comité: tesorero, presidente y secretario. Son quienes aprueban los pagos.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| bolsa_id | texto | sí | Bolsa a la que pertenece |
| nombre | texto | sí | Nombres y apellidos juntos |
| apellidos | texto | sí | Apellidos |
| dni | texto (8 dígitos) | sí | Documento de identidad |
| dni_foto_uri | texto | sí | Foto del DNI (archivo privado) |
| celular | texto (9 dígitos) | sí | Solo dígitos |
| rol | enum: tesorero, presidente, secretario | no | Por defecto: secretario |
| es_tesorero | booleano | no | Marca rápida del tesorero de la bolsa |

## Familia

El padre o madre que aporta. Su DNI es el usuario con el que entra a la plataforma.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| bolsa_id | texto | sí | Bolsa a la que pertenece |
| nombre | texto | sí | Nombre del padre o madre |
| dni | texto (8 dígitos) | sí | Usuario de acceso |
| celular | texto (9 dígitos) | sí | Solo dígitos; nunca se muestra en la vista pública |
| contrasena_hash | texto | no | Huella PBKDF2-SHA256 de la contraseña (la contraseña no se guarda) |
| contrasena_salt | texto | no | Sal aleatoria de la contraseña |
| recuperacion_hash | texto | no | Huella del código de recuperación |
| recuperacion_salt | texto | no | Sal aleatoria del código de recuperación |

## Estudiante

Los hijos e hijas de cada familia. Cada aporte se anota a nombre de un estudiante.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| bolsa_id | texto | sí | Bolsa a la que pertenece |
| familia_id | texto | sí | Familia que paga |
| nombre | texto | sí | Nombre del estudiante |

## Aporte

Cada cuota pagada por una familia, por Yape, Plin, tarjeta o efectivo.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| bolsa_id | texto | sí | Bolsa del aporte |
| familia_id | texto | sí | Familia que aporta |
| familia_nombre | texto | no | Copia del nombre para listados y documentos |
| estudiante_id | texto | no | Estudiante al que corresponde la cuota |
| estudiante_nombre | texto | no | Copia del nombre del estudiante |
| monto | número | sí | En soles, mínimo S/ 1 |
| medio | enum: yape, plin, tarjeta, efectivo | sí | Cómo se pagó |
| estado | enum: confirmado, por_confirmar | no | El efectivo nace por_confirmar |
| registrado_por | texto | no | familia o id del responsable que lo registró |
| confirmado_por | texto | no | Responsable que confirmó el efectivo |
| fecha | fecha y hora | no | Momento del aporte |
| codigo_comprobante | texto | no | Código de 10 caracteres para consultar el comprobante |
| registro_id | texto | no | Movimiento del registro encadenado |

## Pago

Una propuesta de gasto de la bolsa. Solo se paga con las 3 aprobaciones del comité.

| Campo | Tipo | Obligatorio | Detalle |
| --- | --- | --- | --- |
| bolsa_id | texto | sí | Bolsa del pago |
| proveedor | texto | sí | A quién se le paga |
| cuenta_proveedor | texto | no | Cuenta o número de Yape/Plin del proveedor |
| monto | número | sí | En soles, mínimo S/ 1 |
| motivo | texto | sí | Para qué es el gasto |
| proponente_id | texto | sí | Responsable que propone (queda como primera aprobación) |
| proponente_nombre | texto | no | Copia del nombre del proponente |
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
| responsable_nombre | texto | no | Copia del nombre del responsable |
| decision | enum: aprobo, rechazo | sí | Decisión tomada |
| fecha | fecha y hora | no | Momento de la decisión |

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
- Los archivos (DNI, acta, comprobantes) se guardan en almacenamiento privado como file_uri y se abren con enlaces firmados temporales.
- Ninguna tabla es pública: la lectura y escritura ocurren solo en las funciones del servidor, con validación previa de quién es el responsable.
- La vista pública de la bolsa se arma desde esas funciones y no expone celulares, DNIs ni datos personales.
