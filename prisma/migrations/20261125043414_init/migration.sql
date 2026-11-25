-- CreateEnum
CREATE TYPE "EstadoBolsa" AS ENUM ('activa', 'cerrada');

-- CreateEnum
CREATE TYPE "RolResponsable" AS ENUM ('tesorero', 'presidente', 'secretario');

-- CreateEnum
CREATE TYPE "MedioAporte" AS ENUM ('yape', 'plin', 'tarjeta', 'efectivo');

-- CreateEnum
CREATE TYPE "EstadoAporte" AS ENUM ('confirmado', 'por_confirmar');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('pendiente', 'pagado', 'rechazado', 'vencido');

-- CreateEnum
CREATE TYPE "DecisionAprobacion" AS ENUM ('aprobo', 'rechazo');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('aporte', 'pago_propuesto', 'pago_aprobado', 'pago_pagado', 'pago_rechazado', 'pago_vencido');

-- CreateEnum
CREATE TYPE "FuenteRegistro" AS ENUM ('demostracion', 'stellar');

-- CreateTable
CREATE TABLE "bolsas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "colegio" TEXT NOT NULL,
    "cuota" DECIMAL(10,2) NOT NULL,
    "estudiantes_esperados" INTEGER,
    "meta" DECIMAL(10,2),
    "acta_uri" TEXT,
    "codigo_publico" TEXT NOT NULL,
    "codigo_invitacion" TEXT NOT NULL,
    "estado" "EstadoBolsa" NOT NULL DEFAULT 'activa',
    "created_by_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bolsas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsables" (
    "id" TEXT NOT NULL,
    "bolsa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "dni_foto_uri" TEXT,
    "celular" TEXT NOT NULL,
    "rol" "RolResponsable" NOT NULL DEFAULT 'secretario',
    "es_tesorero" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responsables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "familias" (
    "id" TEXT NOT NULL,
    "bolsa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "contrasena_hash" TEXT,
    "contrasena_salt" TEXT,
    "recuperacion_hash" TEXT,
    "recuperacion_salt" TEXT,
    "created_by_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "familias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estudiantes" (
    "id" TEXT NOT NULL,
    "bolsa_id" TEXT NOT NULL,
    "familia_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "created_by_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estudiantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aportes" (
    "id" TEXT NOT NULL,
    "bolsa_id" TEXT NOT NULL,
    "familia_id" TEXT NOT NULL,
    "familia_nombre" TEXT,
    "estudiante_id" TEXT,
    "estudiante_nombre" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "medio" "MedioAporte" NOT NULL,
    "estado" "EstadoAporte" NOT NULL DEFAULT 'confirmado',
    "registrado_por" TEXT,
    "confirmado_por" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "codigo_comprobante" TEXT NOT NULL,
    "registro_id" TEXT,
    "created_by_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aportes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "bolsa_id" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL,
    "cuenta_proveedor" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "motivo" TEXT NOT NULL,
    "proponente_id" TEXT NOT NULL,
    "proponente_nombre" TEXT,
    "estado" "EstadoPago" NOT NULL DEFAULT 'pendiente',
    "vence_en" TIMESTAMP(3),
    "pagado_en" TIMESTAMP(3),
    "motivo_rechazo" TEXT,
    "comprobante_uri" TEXT,
    "registro_id" TEXT,
    "created_by_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aprobaciones" (
    "id" TEXT NOT NULL,
    "bolsa_id" TEXT,
    "pago_id" TEXT NOT NULL,
    "responsable_id" TEXT NOT NULL,
    "responsable_nombre" TEXT,
    "decision" "DecisionAprobacion" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aprobaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros" (
    "id" TEXT NOT NULL,
    "bolsa_id" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "detalle" TEXT NOT NULL,
    "secuencia" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "anterior" TEXT,
    "enlace_verificable" TEXT,
    "fuente" "FuenteRegistro" NOT NULL DEFAULT 'demostracion',
    "created_by_id" TEXT,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bolsas_codigo_publico_key" ON "bolsas"("codigo_publico");

-- CreateIndex
CREATE UNIQUE INDEX "bolsas_codigo_invitacion_key" ON "bolsas"("codigo_invitacion");

-- CreateIndex
CREATE UNIQUE INDEX "responsables_bolsa_id_dni_key" ON "responsables"("bolsa_id", "dni");

-- CreateIndex
CREATE UNIQUE INDEX "familias_bolsa_id_dni_key" ON "familias"("bolsa_id", "dni");

-- CreateIndex
CREATE UNIQUE INDEX "aportes_codigo_comprobante_key" ON "aportes"("codigo_comprobante");

-- CreateIndex
CREATE UNIQUE INDEX "aportes_registro_id_key" ON "aportes"("registro_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_registro_id_key" ON "pagos"("registro_id");

-- CreateIndex
CREATE UNIQUE INDEX "aprobaciones_pago_id_responsable_id_key" ON "aprobaciones"("pago_id", "responsable_id");

-- CreateIndex
CREATE UNIQUE INDEX "registros_codigo_key" ON "registros"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "registros_bolsa_id_secuencia_key" ON "registros"("bolsa_id", "secuencia");

-- AddForeignKey
ALTER TABLE "responsables" ADD CONSTRAINT "responsables_bolsa_id_fkey" FOREIGN KEY ("bolsa_id") REFERENCES "bolsas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "familias" ADD CONSTRAINT "familias_bolsa_id_fkey" FOREIGN KEY ("bolsa_id") REFERENCES "bolsas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_bolsa_id_fkey" FOREIGN KEY ("bolsa_id") REFERENCES "bolsas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estudiantes" ADD CONSTRAINT "estudiantes_familia_id_fkey" FOREIGN KEY ("familia_id") REFERENCES "familias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aportes" ADD CONSTRAINT "aportes_bolsa_id_fkey" FOREIGN KEY ("bolsa_id") REFERENCES "bolsas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aportes" ADD CONSTRAINT "aportes_familia_id_fkey" FOREIGN KEY ("familia_id") REFERENCES "familias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aportes" ADD CONSTRAINT "aportes_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "estudiantes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aportes" ADD CONSTRAINT "aportes_registro_id_fkey" FOREIGN KEY ("registro_id") REFERENCES "registros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_bolsa_id_fkey" FOREIGN KEY ("bolsa_id") REFERENCES "bolsas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_proponente_id_fkey" FOREIGN KEY ("proponente_id") REFERENCES "responsables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_registro_id_fkey" FOREIGN KEY ("registro_id") REFERENCES "registros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprobaciones" ADD CONSTRAINT "aprobaciones_pago_id_fkey" FOREIGN KEY ("pago_id") REFERENCES "pagos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprobaciones" ADD CONSTRAINT "aprobaciones_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "responsables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros" ADD CONSTRAINT "registros_bolsa_id_fkey" FOREIGN KEY ("bolsa_id") REFERENCES "bolsas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
