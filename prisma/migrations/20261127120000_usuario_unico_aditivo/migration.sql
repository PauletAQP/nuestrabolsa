-- CreateEnum
CREATE TYPE "EstadoFamilia" AS ENUM ('activa', 'retirada');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('gasto', 'devolucion');

-- CreateEnum
CREATE TYPE "CanalRecordatorio" AS ENUM ('whatsapp');

-- AlterEnum
ALTER TYPE "RolUsuario" ADD VALUE 'usuario';

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "debe_cambiar_contrasena" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dni_foto_uri" TEXT,
ADD COLUMN     "recuperacion_hash" TEXT,
ADD COLUMN     "recuperacion_salt" TEXT;

-- AlterTable
ALTER TABLE "bolsas" ADD COLUMN     "admin_id" TEXT;

-- AlterTable
ALTER TABLE "responsables" ADD COLUMN     "usuario_id" TEXT;

-- AlterTable
ALTER TABLE "familias" ADD COLUMN     "estado" "EstadoFamilia" NOT NULL DEFAULT 'activa',
ADD COLUMN     "retirada_en" TIMESTAMP(3),
ADD COLUMN     "usuario_id" TEXT;

-- AlterTable
ALTER TABLE "estudiantes" ADD COLUMN     "apellidos" TEXT,
ADD COLUMN     "apoderado_id" TEXT;

-- AlterTable
ALTER TABLE "aportes" ADD COLUMN     "confirmado_por_id" TEXT,
ADD COLUMN     "registrado_por_id" TEXT,
ADD COLUMN     "registrado_por_nombre" TEXT;

-- AlterTable
ALTER TABLE "pagos" ADD COLUMN     "familia_id" TEXT,
ADD COLUMN     "tipo" "TipoPago" NOT NULL DEFAULT 'gasto';

-- CreateTable
CREATE TABLE "inscripciones" (
    "id" TEXT NOT NULL,
    "bolsa_id" TEXT NOT NULL,
    "familia_id" TEXT NOT NULL,
    "estudiante_id" TEXT NOT NULL,
    "created_by_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscripciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recordatorios" (
    "id" TEXT NOT NULL,
    "bolsa_id" TEXT NOT NULL,
    "familia_id" TEXT NOT NULL,
    "enviado_por_id" TEXT NOT NULL,
    "canal" "CanalRecordatorio" NOT NULL DEFAULT 'whatsapp',
    "saldo_pendiente" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recordatorios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_bolsa_id_estudiante_id_key" ON "inscripciones"("bolsa_id", "estudiante_id");

-- CreateIndex
CREATE INDEX "recordatorios_bolsa_id_familia_id_idx" ON "recordatorios"("bolsa_id", "familia_id");

-- CreateIndex
CREATE UNIQUE INDEX "responsables_bolsa_id_usuario_id_key" ON "responsables"("bolsa_id", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "familias_bolsa_id_usuario_id_key" ON "familias"("bolsa_id", "usuario_id");

-- AddForeignKey
ALTER TABLE "bolsas" ADD CONSTRAINT "bolsas_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responsables" ADD CONSTRAINT "responsables_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "familias" ADD CONSTRAINT "familias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_apoderado_id_fkey" FOREIGN KEY ("apoderado_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_bolsa_id_fkey" FOREIGN KEY ("bolsa_id") REFERENCES "bolsas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_familia_id_fkey" FOREIGN KEY ("familia_id") REFERENCES "familias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripciones" ADD CONSTRAINT "inscripciones_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aportes" ADD CONSTRAINT "aportes_registrado_por_id_fkey" FOREIGN KEY ("registrado_por_id") REFERENCES "responsables"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aportes" ADD CONSTRAINT "aportes_confirmado_por_id_fkey" FOREIGN KEY ("confirmado_por_id") REFERENCES "responsables"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_familia_id_fkey" FOREIGN KEY ("familia_id") REFERENCES "familias"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_bolsa_id_fkey" FOREIGN KEY ("bolsa_id") REFERENCES "bolsas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_familia_id_fkey" FOREIGN KEY ("familia_id") REFERENCES "familias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recordatorios" ADD CONSTRAINT "recordatorios_enviado_por_id_fkey" FOREIGN KEY ("enviado_por_id") REFERENCES "responsables"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

