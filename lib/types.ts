export const APPOINTMENT_STATUSES = ["NEW", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type ServiceDto = {
  id: string;
  name: string;
  slug: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  icon: string;
  featured: boolean;
  active: boolean;
};

export type SpecialistDto = {
  id: string;
  name: string;
  slug: string;
  title: string;
  bio: string;
  experience: number;
  rating: number;
  color: string;
  initials: string;
  active: boolean;
  serviceIds: string[];
};

export type AppointmentDto = {
  id: string;
  bookingNumber: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  notes: string | null;
  client: {
    id: string;
    name: string;
    phone: string;
    email: string;
  };
  service: Pick<ServiceDto, "id" | "name" | "duration" | "price">;
  specialist: Pick<SpecialistDto, "id" | "name" | "title" | "color" | "initials">;
};

export type ScheduleDto = {
  id: string;
  specialistId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
};

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: string; fieldErrors?: Record<string, string[]> };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  NEW: "Новая",
  CONFIRMED: "Подтверждена",
  COMPLETED: "Завершена",
  CANCELLED: "Отменена",
};
