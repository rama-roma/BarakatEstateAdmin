import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { User } from "./types";

const secretKey = process.env.JWT_SECRET || "default_super_secret_key_change_me_in_prod";
const encodedKey = new TextEncoder().encode(secretKey);
export type SessionPayload = { userId: string; role: User["role"] };

export async function signToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, encodedKey);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(user: Pick<User, "id" | "role">) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await signToken({ userId: user.id, role: user.role });
  const cookieStore = await cookies();
  
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

// In-memory rate limiting for login/register
const rateLimitCache = new Map<string, { count: number; expires: number }>();

export function checkRateLimit(ip: string, limit = 5, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitCache.get(ip);
  
  if (!record || record.expires < now) {
    rateLimitCache.set(ip, { count: 1, expires: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count += 1;
  return true;
}
