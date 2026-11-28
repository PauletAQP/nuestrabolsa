# Pendientes a futuro

Problemas conocidos y mejoras que se dejaron para más adelante. Cada punto indica por qué pasa y qué se propone.

## Nombres desactualizados en las listas de aportes

**Qué pasa:** si el comité corrige el nombre de un estudiante o de un padre desde el CRM, las listas de aportes siguen mostrando el nombre anterior. Ejemplo: se cambió "Ana Quispe" a "Lucia Quispe" y en "Tus últimos aportes" sigue apareciendo "Ana Quispe".

**Por qué:** cada `Aporte` guarda una copia del nombre al momento de registrarse (`estudianteNombre`, `familiaNombre`), y las listas muestran esa copia.

**Propuesta:**
- Las vistas de trabajo (últimos aportes del padre, CRM, aportes del comité, efectivo por confirmar) muestran el nombre actual, leído desde `Estudiante` y `Usuario`.
- El recibo, el comprobante y la cadena de registros conservan la copia histórica. El texto del registro entra en el hash de la cadena y no debe cambiar.

## Crear una bolsa con un responsable que ya tiene cuenta

**Qué pasa:** si en el formulario de creación de bolsa se ingresa un DNI que ya existe, se reutiliza la cuenta y se ignoran en silencio el nombre y la contraseña escritos en el formulario.

**Propuesta:** se resuelve con la búsqueda por DNI del formulario (autocompletar los datos y no pedir contraseña cuando la cuenta ya existe).

## Estudiantes con el mismo nombre

**Qué pasa:** al inscribir hijos, si el apoderado ya tiene un estudiante con el mismo nombre se reutiliza (`src/lib/inscripciones.ts`). Dos hijos con nombre idéntico, o un hijo renombrado en una bolsa, pueden terminar mal asociados.

**Propuesta:** al unirse a una bolsa nueva, mostrar los hijos ya registrados para que el padre los marque, en lugar de emparejar por nombre.

## Código de recuperación de contraseña

**Qué pasa:** solo los padres creados por el seed tienen código de recuperación. Los padres que se unen por invitación, los responsables y los administradores no tienen ninguno, así que no pueden recuperar su contraseña.

**Propuesta:** generar el código al crear cualquier `Usuario` y mostrarlo una vez, o reemplazar el mecanismo (por ejemplo, restablecimiento por el comité o por SMS).

## Lint heredado del CRM

- `src/components/nb/crm-dashboard.tsx`: un `any` explícito (error de lint) y los imports sin usar `Users`, `FileSpreadsheet` y `ExternalLink`.

## Configuración de Prisma

`package.json#prisma` está deprecado y se eliminará en Prisma 7. Migrar a un archivo `prisma.config.ts`.
