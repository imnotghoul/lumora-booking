import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import { UnauthorizedError } from "@/lib/server/errors";
import { prisma } from "@/lib/server/prisma";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from "@/lib/server/session";

export async function authenticateAdmin(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
  const passwordMatches = admin
    ? await bcrypt.compare(password, admin.passwordHash)
    : (await bcrypt.hash(password, 12)) === "never";

  if (!admin || !admin.active || !passwordMatches) {
    throw new UnauthorizedError("Неверный email или пароль");
  }
  return admin;
}

export async function setAdminSession(admin: { id: string; email: string }) {
  const token = await createSessionToken({
    adminId: admin.id,
    email: admin.email,
    role: "ADMIN",
  });
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) throw new UnauthorizedError();

  const session = await verifySessionToken(token);
  const admin = await prisma.adminUser.findUnique({ where: { id: session.adminId } });
  if (!admin?.active) throw new UnauthorizedError();
  return admin;
}
