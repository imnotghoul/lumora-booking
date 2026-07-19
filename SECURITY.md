# Security Policy

## Reporting a vulnerability

Please do not disclose suspected vulnerabilities in a public issue. Use GitHub's private vulnerability reporting / Security Advisory flow for this repository.

Do not include real client data, passwords, tokens, cookies, database dumps, or other secrets in a report. Provide the affected route or component, reproduction steps with synthetic data, and the expected impact.

## Production notes

- Replace every value from `.env.example` with deployment-specific secrets.
- Use HTTPS for the public API and mobile `EXPO_PUBLIC_API_URL`.
- Add infrastructure-level rate limiting for login and public booking endpoints.
- Add OTP or magic-link contact verification before exposing client appointments publicly.
