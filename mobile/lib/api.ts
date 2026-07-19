import Constants from "expo-constants";

import type { ApiResponse } from "@/lib/types";

function withoutTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function getDevelopmentHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split(":")[0];
  return host || null;
}

export function getApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return withoutTrailingSlash(configured);

  const developmentHost = getDevelopmentHost();
  if (developmentHost) return `http://${developmentHost}:3000`;

  return "http://localhost:3000";
}

export class ApiClientError extends Error {
  status?: number;
  fieldErrors?: Record<string, string[]>;

  constructor(
    message: string,
    options: { status?: number; fieldErrors?: Record<string, string[]> } = {},
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.fieldErrors = options.fieldErrors;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init?.headers,
      },
      signal: controller.signal,
    });

    let payload: ApiResponse<T>;
    try {
      payload = (await response.json()) as ApiResponse<T>;
    } catch {
      throw new ApiClientError("Сервер вернул некорректный ответ", {
        status: response.status,
      });
    }

    if (!response.ok || !payload.success) {
      const failure = payload.success ? null : payload;
      throw new ApiClientError(failure?.error ?? "Не удалось выполнить запрос", {
        status: response.status,
        fieldErrors: failure?.fieldErrors,
      });
    }

    return payload.data;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiClientError("Сервер не ответил вовремя. Проверьте подключение к сети");
    }
    throw new ApiClientError(
      `Не удалось подключиться к серверу ${getApiBaseUrl()}. Убедитесь, что API запущен и телефон находится в той же Wi-Fi сети`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function toQuery(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}
