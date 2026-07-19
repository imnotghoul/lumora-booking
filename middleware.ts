import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/server/session";
import { assertSameOrigin } from "@/lib/server/request-security";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  try {
    if (pathname.startsWith("/api/admin/")) assertSameOrigin(request);
  } catch {
    return NextResponse.json(
      { success: false, error: "Запрос отклонён" },
      { status: 403 },
    );
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  try {
    if (!token) throw new Error("missing session");
    await verifySessionToken(token);
    return NextResponse.next();
  } catch {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Требуется авторизация" },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
