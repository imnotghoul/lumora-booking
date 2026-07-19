import type { ApiResponse } from "@/lib/types";

export class ApiClientError extends Error {
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiClientError";
    this.fieldErrors = fieldErrors;
  }
}

export async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  let payload: ApiResponse<T>;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError("Сервер вернул неверный ответ. Попробуйте ещё раз.");
  }
  if (!response.ok || !payload.success) {
    const failure = payload.success ? null : payload;
    throw new ApiClientError(failure?.error ?? "Не удалось выполнить запрос.", failure?.fieldErrors);
  }
  return payload.data;
}
