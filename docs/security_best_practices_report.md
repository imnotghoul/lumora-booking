# Security best-practices review

## Executive summary

No committed production secrets, critical findings, or high-severity findings were detected before the repository was made public. Local environment files, SQLite databases, dependency folders, caches, and build artifacts are excluded by `.gitignore`. Both npm dependency trees report zero known vulnerabilities at the time of review.

The remaining findings are production-hardening tasks. The local portfolio demo remains functional, but the items below should be completed before serving real customer data.

## Critical findings

None found.

## High findings

None found.

## Medium findings

### SEC-001 — Contact pair is not proof of ownership

- **Rule ID:** application identity / authorization boundary
- **Severity:** Medium
- **Location:** `README.md:145`, `SECURITY.md:14`
- **Evidence:** The demo uses the phone + email pair to retrieve and cancel client appointments and explicitly documents OTP/magic-link as a production requirement.
- **Impact:** Anyone who knows both contact values could view appointment metadata or cancel a visit.
- **Fix:** Verify contact ownership with a short-lived OTP or signed magic link and authorize each read/cancel operation with that verified session.
- **Mitigation:** Do not deploy the demo contact lookup against real customer data until verification is added.
- **False-positive notes:** Acceptable for seeded local demonstration data only.

### SEC-002 — Infrastructure rate limiting is not visible in the repository

- **Rule ID:** NEXT-DOS-001
- **Severity:** Medium
- **Location:** `SECURITY.md:13`
- **Evidence:** Login and public booking endpoints validate input, but no shared production rate limiter is configured in application code or visible infrastructure.
- **Impact:** Automated password guessing, availability scraping, and booking spam could consume resources or create unwanted appointments.
- **Fix:** Configure per-IP and per-account limits at the deployment edge, with stricter limits for `/api/auth/login` and appointment creation.
- **Mitigation:** Use a managed platform/WAF rate limiter and monitoring before public deployment.
- **False-positive notes:** A hosting provider may supply this control; verify it in runtime configuration.

## Low findings

### SEC-003 — CSP is a baseline policy, not a strict script policy

- **Rule ID:** NEXT-CSP-001
- **Severity:** Low
- **Location:** `next.config.ts:18`
- **Evidence:** CSP restricts frames, forms, base URLs, and objects, but does not yet enforce nonce/hash-based `script-src`.
- **Impact:** CSP provides less defense-in-depth if an XSS bug is introduced later.
- **Fix:** Add a nonce-based strict script policy following the deployment platform's Next.js configuration.
- **Mitigation:** React escaping is used throughout; the audit found no raw HTML or direct DOM injection sinks.
- **False-positive notes:** An edge/CDN may add a stricter CSP; verify response headers after deployment.

## Controls verified

- Secret and local-data exclusions: `.gitignore:2-22`.
- Admin session cookie uses `HttpOnly`, production-only `Secure`, and `SameSite=Lax`: `lib/server/auth.ts:33-46`.
- Cookie-authenticated admin mutations and auth routes enforce same-origin browser requests: `lib/server/request-security.ts:9`, `middleware.ts:11`.
- Runtime request validation uses Zod at API boundaries.
- Prisma query APIs are used instead of concatenated SQL.
- No `dangerouslySetInnerHTML`, direct DOM HTML sinks, dynamic code execution, or client-side auth-token storage was found.
- GitHub Actions uses lockfile-based `npm ci`; Dependabot covers the root app, mobile app, and Actions.
