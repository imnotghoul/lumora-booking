import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError, type ZodIssue } from "zod";

import { DomainError } from "@/lib/server/errors";

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true as const, data }, { status });
}

export function jsonError(
  error: string,
  status = 400,
  fieldErrors?: Record<string, string[]>,
) {
  return NextResponse.json(
    { success: false as const, error, ...(fieldErrors ? { fieldErrors } : {}) },
    { status },
  );
}

function issuesToFieldErrors(issues: ZodIssue[]) {
  return issues.reduce<Record<string, string[]>>((result, issue) => {
    const key = issue.path.length > 0 ? issue.path.join(".") : "form";
    result[key] = [...(result[key] ?? []), issue.message];
    return result;
  }, {});
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new DomainError("Некорректный JSON", 400, "INVALID_JSON");
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("Проверьте заполнение полей", 422, issuesToFieldErrors(error.issues));
  }

  if (error instanceof DomainError) {
    return jsonError(error.message, error.status);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return jsonError("Объект с такими уникальными данными уже существует", 409);
    }
    if (error.code === "P2025") {
      return jsonError("Данные не найдены", 404);
    }
  }

  console.error("Unhandled API error", error);
  return jsonError("Не удалось выполнить запрос. Попробуйте ещё раз", 500);
}
