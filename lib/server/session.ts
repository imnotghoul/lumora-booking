import { jwtVerify, SignJWT } from "jose";

import { UnauthorizedError } from "@/lib/server/errors";

export const AUTH_COOKIE_NAME = "lumora_admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type AdminSession = {
  adminId: string;
  email: string;
  role: "ADMIN";
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET должен содержать не менее 32 символов");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: AdminSession) {
  return new SignJWT({ email: session.email, role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.adminId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<AdminSession> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    if (!payload.sub || payload.role !== "ADMIN" || typeof payload.email !== "string") {
      throw new UnauthorizedError();
    }
    return { adminId: payload.sub, email: payload.email, role: "ADMIN" };
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError("Сессия недействительна или истекла");
  }
}
