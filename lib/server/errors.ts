export class DomainError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly code = "BAD_REQUEST",
  ) {
    super(message);
    this.name = "DomainError";
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Данные не найдены") {
    super(message, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = "Требуется авторизация") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class BookingConflictError extends DomainError {
  constructor(message = "Это время уже занято. Выберите другой интервал") {
    super(message, 409, "BOOKING_CONFLICT");
    this.name = "BookingConflictError";
  }
}
