import "server-only";
import { randomUUID } from "crypto";
import { mkdir, writeFile, stat } from "fs/promises";
import path from "path";
import { SignJWT, jwtVerify } from "jose";

const STORAGE_DIR = path.join(process.cwd(), "private-storage");
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-change-in-production-please-use-a-long-random-string-32chars"
);

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export async function saveUploadedFile(file: File): Promise<string> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) throw new Error("Tipo de archivo no permitido");
  if (file.size > 8 * 1024 * 1024) throw new Error("El archivo supera los 8 MB");

  await mkdir(STORAGE_DIR, { recursive: true });
  const fileId = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(STORAGE_DIR, fileId), buffer);
  return fileId;
}

export function filePath(fileId: string): string {
  return path.join(STORAGE_DIR, fileId);
}

export async function fileExists(fileId: string): Promise<boolean> {
  try {
    await stat(filePath(fileId));
    return true;
  } catch {
    return false;
  }
}

export async function signFileToken(fileId: string, ttlSeconds = 300): Promise<string> {
  return new SignJWT({ fileId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(secret);
}

export async function verifyFileToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return (payload.fileId as string) ?? null;
  } catch {
    return null;
  }
}

export async function signedFileUrl(fileId: string | null | undefined): Promise<string | null> {
  if (!fileId) return null;
  const token = await signFileToken(fileId);
  return `/api/files/${fileId}?token=${token}`;
}

const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
};

export function contentTypeFor(fileId: string): string {
  const ext = fileId.split(".").pop() ?? "";
  return CONTENT_TYPES[ext] ?? "application/octet-stream";
}
