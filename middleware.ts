import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-secret-rotate-in-prod"
);
const SESSION_COOKIE = "manggala_session";

type Role =
  | "customer"
  | "courier"
  | "super_admin"
  | "finance_admin"
  | "collection_team"
  | "delivery_team"
  | "surveyor";

const ADMIN_ROLES: Role[] = [
  "super_admin",
  "finance_admin",
  "collection_team",
  "delivery_team",
  "surveyor",
];

// Route protection map.
const CUSTOMER_PATHS = [
  "/dashboard",
  "/installments",
  "/payments",
  "/profile",
  "/apply",
];
const ADMIN_PATHS = ["/admin"];
const COURIER_PATHS = ["/courier"];

function startsWithAny(path: string, prefixes: string[]) {
  return prefixes.some((p) => path === p || path.startsWith(`${p}/`));
}

function defaultPathForRole(role: Role): string {
  if (role === "courier") return "/courier";
  if (ADMIN_ROLES.includes(role)) return "/admin";
  return "/dashboard";
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  let role: Role | null = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET, {
        algorithms: ["HS256"],
      });
      role = (payload.role as Role) ?? null;
    } catch {
      role = null;
    }
  }

  const isProtected =
    startsWithAny(pathname, CUSTOMER_PATHS) ||
    startsWithAny(pathname, ADMIN_PATHS) ||
    startsWithAny(pathname, COURIER_PATHS);

  // 1. Unauthenticated trying to access protected → /login?next=...
  if (isProtected && !role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 2. Authenticated but wrong area → redirect to their default area.
  if (role) {
    if (startsWithAny(pathname, ADMIN_PATHS) && !ADMIN_ROLES.includes(role)) {
      return NextResponse.redirect(new URL(defaultPathForRole(role), req.url));
    }
    if (startsWithAny(pathname, COURIER_PATHS) && role !== "courier") {
      return NextResponse.redirect(new URL(defaultPathForRole(role), req.url));
    }
    if (
      startsWithAny(pathname, CUSTOMER_PATHS) &&
      role !== "customer"
    ) {
      return NextResponse.redirect(new URL(defaultPathForRole(role), req.url));
    }

    // 3. If on /login or /register but already authed → home.
    if (pathname === "/login" || pathname === "/register") {
      return NextResponse.redirect(new URL(defaultPathForRole(role), req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except static & API.
  matcher: [
    "/((?!_next/static|_next/image|api|favicon.ico|icon.png|apple-icon.png|logofintech.png|og-image.png|manifest.webmanifest).*)",
  ],
};
