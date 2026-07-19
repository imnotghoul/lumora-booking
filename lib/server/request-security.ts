import { DomainError } from "@/lib/server/errors";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Cookie-authenticated mutations must originate from this application.
 * Requests without Origin remain available to trusted non-browser clients.
 */
export function assertSameOrigin(request: Request) {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;

  const origin = request.headers.get("origin");
  if (!origin) return;

  const expectedOrigin = new URL(request.url).origin;
  if (origin !== expectedOrigin) {
    throw new DomainError("Запрос отклонён", 403, "INVALID_ORIGIN");
  }
}
