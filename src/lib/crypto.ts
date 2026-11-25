import { randomBytes, pbkdf2Sync, timingSafeEqual, createHash } from "crypto";

const ITERATIONS = 150_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export function hashSecret(secret: string): { hash: string; salt: string } {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return { hash, salt };
}

export function verifySecret(secret: string, hash: string, salt: string): boolean {
  const candidate = pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  const stored = Buffer.from(hash, "hex");
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0,O,1,I para evitar confusiones

export function generateCode(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

export function generateComprobanteCode(): string {
  return generateCode(10);
}

export function generatePublicCode(): string {
  return generateCode(8);
}

export function generateInviteCode(): string {
  return generateCode(8);
}

export function generateRecoveryCode(): string {
  const raw = generateCode(8);
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/** Código del registro encadenado: hash verificable de este movimiento + el anterior. */
export function computeChainCode(input: {
  bolsaId: string;
  secuencia: number;
  tipo: string;
  detalle: string;
  anterior: string | null;
}): string {
  const payload = [
    input.bolsaId,
    input.secuencia,
    input.tipo,
    input.detalle,
    input.anterior ?? "GENESIS",
  ].join("|");
  return createHash("sha256").update(payload).digest("hex");
}
