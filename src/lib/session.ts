import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "nb_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-change-in-production-please-use-a-long-random-string-32chars"
);

/**
 * Toda sesión pertenece a un Usuario (identidad única por DNI).
 * - "pendiente": inició sesión pero aún no eligió con qué bolsa/membresía entrar (/elegir).
 * - "usuario": panel global de superadmin o admin.
 * - "familia" / "responsable": membresía activa en una bolsa.
 */
export type SessionPayload =
  | { tipo: "pendiente"; usuarioId: string }
  | { tipo: "usuario"; usuarioId: string; rol: "superadmin" | "admin" }
  | { tipo: "familia"; usuarioId: string; familiaId: string; bolsaId: string }
  | { tipo: "responsable"; usuarioId: string; responsableId: string; bolsaId: string; cargo: string };

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
