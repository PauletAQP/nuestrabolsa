-- RenameEnum: el cargo del responsable conserva sus valores (tesorero, presidente, secretario)
ALTER TYPE "RolResponsable" RENAME TO "CargoResponsable";

-- RenameColumn: responsables.rol pasa a responsables.cargo sin perder datos
ALTER TABLE "responsables" RENAME COLUMN "rol" TO "cargo";
ALTER TABLE "responsables" ALTER COLUMN "cargo" DROP DEFAULT;

-- DropForeignKey
ALTER TABLE "estudiantes" DROP CONSTRAINT "estudiantes_bolsa_id_fkey";

-- DropForeignKey
ALTER TABLE "estudiantes" DROP CONSTRAINT "estudiantes_familia_id_fkey";

-- DropIndex
DROP INDEX "responsables_bolsa_id_dni_key";

-- DropIndex
DROP INDEX "familias_bolsa_id_dni_key";

-- AlterTable
ALTER TABLE "bolsas" ALTER COLUMN "admin_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "responsables" DROP COLUMN "apellidos",
DROP COLUMN "celular",
DROP COLUMN "contrasena_hash",
DROP COLUMN "contrasena_salt",
DROP COLUMN "dni",
DROP COLUMN "dni_foto_uri",
DROP COLUMN "es_tesorero",
DROP COLUMN "nombre",
ALTER COLUMN "usuario_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "familias" DROP COLUMN "celular",
DROP COLUMN "contrasena_hash",
DROP COLUMN "contrasena_salt",
DROP COLUMN "dni",
DROP COLUMN "nombre",
DROP COLUMN "recuperacion_hash",
DROP COLUMN "recuperacion_salt",
ALTER COLUMN "usuario_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "estudiantes" DROP COLUMN "bolsa_id",
DROP COLUMN "familia_id",
ALTER COLUMN "apoderado_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "aportes" DROP COLUMN "confirmado_por",
DROP COLUMN "registrado_por";

-- CreateIndex
CREATE UNIQUE INDEX "responsables_bolsa_id_cargo_key" ON "responsables"("bolsa_id", "cargo");

