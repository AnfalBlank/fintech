import { NextResponse, type NextRequest } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { getSessionFromRequest, type Session } from "./auth";

export type ApiHandler = (
  req: NextRequest,
  ctx: { params?: Record<string, string>; session: Session }
) => Promise<Response> | Response;

export type Role = Session["role"];

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, extra?: unknown) {
  return NextResponse.json({ ok: false, error: message, extra }, { status });
}

export async function parseJson<T>(req: NextRequest, schema: ZodSchema<T>) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    raw = {};
  }
  try {
    return { ok: true as const, data: schema.parse(raw) };
  } catch (e) {
    if (e instanceof ZodError) {
      return {
        ok: false as const,
        error: "Invalid input",
        details: e.flatten(),
      };
    }
    throw e;
  }
}

export function requireAuth(roles?: ReadonlyArray<Role>) {
  return async (
    handler: ApiHandler
  ): Promise<
    (req: NextRequest, ctx: { params?: Record<string, string> }) => Promise<Response>
  > => {
    return async (req, ctx) => {
      const session = await getSessionFromRequest(req);
      if (!session) return fail("Unauthorized", 401);
      if (roles && roles.length && !roles.includes(session.role)) {
        return fail("Forbidden", 403);
      }
      try {
        return await handler(req, { ...ctx, session });
      } catch (err) {
        console.error("[api] handler error", err);
        return fail("Internal error", 500);
      }
    };
  };
}

export const ADMIN_ROLES_LIST = [
  "super_admin",
  "finance_admin",
  "collection_team",
  "delivery_team",
  "surveyor",
] as const satisfies ReadonlyArray<Role>;

export const APPROVAL_ROLES = [
  "super_admin",
  "finance_admin",
] as const satisfies ReadonlyArray<Role>;

export const COLLECTION_ROLES = [
  "super_admin",
  "collection_team",
] as const satisfies ReadonlyArray<Role>;

export const DELIVERY_ROLES = [
  "super_admin",
  "delivery_team",
] as const satisfies ReadonlyArray<Role>;
