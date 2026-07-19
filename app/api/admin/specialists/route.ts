import { DomainError } from "@/lib/server/errors";
import { handleApiError, jsonSuccess, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import {
  createInitials,
  createSlug,
  specialistInclude,
  toSpecialistDto,
} from "@/lib/server/catalog";
import { prisma } from "@/lib/server/prisma";
import { specialistSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const specialists = await prisma.specialist.findMany({
      include: specialistInclude,
      orderBy: { name: "asc" },
    });
    return jsonSuccess(specialists.map(toSpecialistDto));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = specialistSchema.parse(await readJson(request));
    const uniqueServiceIds = [...new Set(input.serviceIds)];
    const serviceCount = await prisma.service.count({
      where: { id: { in: uniqueServiceIds } },
    });
    if (serviceCount !== uniqueServiceIds.length) {
      throw new DomainError("Одна или несколько услуг не найдены", 422);
    }
    const specialist = await prisma.specialist.create({
      data: {
        name: input.name,
        slug: input.slug ?? createSlug(input.name, "specialist"),
        title: input.title,
        bio: input.bio,
        experience: input.experience,
        rating: input.rating ?? 5,
        color: input.color ?? "#6D5CE7",
        initials: input.initials ?? createInitials(input.name),
        active: input.active ?? true,
        services: {
          create: uniqueServiceIds.map((serviceId) => ({ serviceId })),
        },
      },
      include: specialistInclude,
    });
    return jsonSuccess(toSpecialistDto(specialist), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
