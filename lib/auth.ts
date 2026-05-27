import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-rotate-in-prod"
);

export const SESSION_COOKIE = "manggala_session";
const ALG = "HS256";
const EXP = "7d";

export type Session = {
  userId: string;
  role:
    | "customer"
    | "courier"
    | "super_admin"
    | "finance_admin"
    | "collection_team"
    | "delivery_team"
    | "surveyor";
  name: string;
  trustLevel?: number;
};

export async function createSession(payload: Session) {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(EXP)
    .sign(SECRET);
}

export async function readSession(token?: string): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: [ALG] });
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<Session | null> {
  const c = cookies();
  return readSession(c.get(SESSION_COOKIE)?.value);
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<Session | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return readSession(token);
}

export const ADMIN_ROLES = [
  "super_admin",
  "finance_admin",
  "collection_team",
  "delivery_team",
  "surveyor",
] as const;

export function isAdmin(role: Session["role"] | undefined): boolean {
  if (!role) return false;
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export function canAccess(
  role: Session["role"] | undefined,
  allowed: ReadonlyArray<Session["role"]>
): boolean {
  return !!role && allowed.includes(role);
}
