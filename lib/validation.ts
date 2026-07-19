import { z } from "zod";

export const appointmentStatusSchema = z.enum([
  "NEW",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
]);

const idSchema = z.string().trim().min(1, "Обязательное поле").max(100);
const phoneSchema = z
  .string()
  .trim()
  .min(7, "Введите корректный телефон")
  .max(30, "Введите корректный телефон")
  .regex(/^[+\d\s()\-]+$/, "Введите корректный телефон");

const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Дата должна быть в формате ГГГГ-ММ-ДД")
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Указана несуществующая дата");

const localTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Время должно быть в формате ЧЧ:ММ");

export const clientDetailsSchema = z.object({
  name: z.string().trim().min(2, "Введите имя").max(100),
  phone: phoneSchema,
  email: z.string().trim().email("Введите корректный email").max(254),
});

export const createAppointmentSchema = z.object({
  serviceId: idSchema,
  specialistId: idSchema,
  startsAt: z.string().datetime({ offset: true }),
  client: clientDetailsSchema,
  notes: z.string().trim().max(500).optional().nullable(),
  status: appointmentStatusSchema.optional(),
});

export const publicCreateAppointmentSchema = createAppointmentSchema.omit({ status: true });

export const availabilityQuerySchema = z.object({
  serviceId: idSchema,
  specialistId: idSchema,
  date: localDateSchema,
});

export const mineQuerySchema = z.object({
  phone: phoneSchema,
  email: z.string().trim().email("Введите корректный email").max(254),
});

export const cancelAppointmentSchema = mineQuerySchema;

export const loginSchema = z.object({
  email: z.string().trim().email("Введите корректный email").max(254),
  password: z.string().min(8, "Минимум 8 символов").max(128),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100).optional(),
  description: z.string().trim().min(10).max(1000),
  duration: z.number().int().min(15).max(480).multipleOf(15),
  price: z.number().int().min(0).max(10_000_000),
  category: z.string().trim().min(2).max(80),
  icon: z.string().trim().min(1).max(50).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const updateServiceSchema = serviceSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Передайте хотя бы одно поле",
);

export const specialistSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100).optional(),
  title: z.string().trim().min(2).max(120),
  bio: z.string().trim().min(10).max(1500),
  experience: z.number().int().min(0).max(70),
  rating: z.number().min(0).max(5).optional(),
  color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  initials: z.string().trim().min(1).max(4).optional(),
  active: z.boolean().optional(),
  serviceIds: z.array(idSchema).min(1, "Выберите хотя бы одну услугу"),
});

export const updateSpecialistSchema = specialistSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Передайте хотя бы одно поле",
);

export const scheduleItemSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: localTimeSchema,
    endTime: localTimeSchema,
    isWorking: z.boolean(),
  })
  .refine((value) => !value.isWorking || value.startTime < value.endTime, {
    message: "Время окончания должно быть позже времени начала",
    path: ["endTime"],
  });

export const updateSchedulesSchema = z
  .object({
    specialistId: idSchema,
    schedules: z.array(scheduleItemSchema).max(7),
  })
  .superRefine((value, context) => {
    const days = new Set<number>();
    value.schedules.forEach((schedule, index) => {
      if (days.has(schedule.dayOfWeek)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "День недели указан дважды",
          path: ["schedules", index, "dayOfWeek"],
        });
      }
      days.add(schedule.dayOfWeek);
    });
  });

export const adminAppointmentFiltersSchema = z.object({
  date: localDateSchema.optional(),
  specialistId: idSchema.optional(),
  serviceId: idSchema.optional(),
  status: appointmentStatusSchema.optional(),
  search: z.string().trim().max(100).optional(),
});

export const updateAppointmentSchema = z
  .object({
    serviceId: idSchema.optional(),
    specialistId: idSchema.optional(),
    startsAt: z.string().datetime({ offset: true }).optional(),
    status: appointmentStatusSchema.optional(),
    notes: z.string().trim().max(500).nullable().optional(),
    client: clientDetailsSchema.partial().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Передайте хотя бы одно поле");

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type SpecialistInput = z.infer<typeof specialistSchema>;
