import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const cookieName = "trust_session";
const devSessionSecret = "trust-company-development-session-secret";

export async function hashPassword(password: string) {
  return hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

function getSessionSecret() {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("APP_SESSION_SECRET must be set in production.");
  }
  return secret || devSessionSecret;
}

function signSession(userId: string) {
  return createHmac("sha256", getSessionSecret()).update(userId).digest("base64url");
}

function createSessionToken(userId: string) {
  return `${userId}.${signSession(userId)}`;
}

function readSessionToken(token?: string) {
  if (!token) return null;

  const [userId, signature, ...extra] = token.split(".");
  if (!userId || !signature || extra.length > 0) return null;

  const expectedSignature = signSession(userId);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length) return null;
  return timingSafeEqual(signatureBuffer, expectedBuffer) ? userId : null;
}

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8,
    path: "/"
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = readSessionToken(cookieStore.get(cookieName)?.value);
  if (!userId) return null;

  return prisma.user.findFirst({
    where: { id: userId, isActive: true },
    include: { branch: true }
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
