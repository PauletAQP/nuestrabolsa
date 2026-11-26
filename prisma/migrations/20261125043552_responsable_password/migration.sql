-- AlterTable
ALTER TABLE "responsables" ADD COLUMN     "contrasena_hash" TEXT,
ADD COLUMN     "contrasena_salt" TEXT;
