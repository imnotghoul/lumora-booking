import type { ApiResponse } from "@/lib/types";

export class AdminApiError extends Error {
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "AdminApiError";
    this.fieldErrors = fieldErrors;
  }
}

export async function adminRequest<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new AdminApiError(
      response.ok
        ? "Сервер вернул некорректный ответ"
        : "Не удалось выполнить запрос",
    );
  }

  if (
    response.status === 401 &&
    url !== "/api/auth/login" &&
    typeof window !== "undefined"
  ) {
    window.location.assign("/admin/login?expired=1");
  }

  if (!response.ok || !payload.success) {
    const error = payload && !payload.success ? payload : null;
    throw new AdminApiError(
      error?.error || "Не удалось выполнить запрос",
      error?.fieldErrors,
    );
  }

  return payload.data;
}

export function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Произошла непредвиденная ошибка";
}

export function appendQuery(
  base: string,
  values: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
