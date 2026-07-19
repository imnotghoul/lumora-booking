import { DomainError, NotFoundError } from "@/lib/server/errors";
import { handleApiError, jsonSuccess, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { specialistInclude, toSpecialistDto } from "@/lib/server/catalog";
import { prisma } from "@/lib/server/prisma";
import { updateSpecialistSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const input = updateSpecialistSchema.parse(await readJson(request));
    const serviceIds = input.serviceIds ? [...new Set(input.serviceIds)] : undefined;
    if (serviceIds) {
      const serviceCount = await prisma.service.count({ where: { id: { in: serviceIds } } });
      if (serviceCount !== serviceIds.length) {
        throw new DomainError("Одна или несколько услуг не найдены", 422);
      }
    }

    const specialist = await prisma.$transaction(async (tx) => {
      const existing = await tx.specialist.findUnique({ where: { id }, select: { id: true } });
      if (!existing) throw new NotFoundError("Специалист не найден");
      if (serviceIds) {
        await tx.specialistService.deleteMany({ where: { specialistId: id } });
      }
      return tx.specialist.update({
        where: { id },
        data: {
          name: input.name,
          slug: input.slug,
          title: input.title,
          bio: input.bio,
          experience: input.experience,
          rating: input.rating,
          color: input.color,
          initials: input.initials,
          active: input.active,
          ...(serviceIds
            ? { services: { create: serviceIds.map((serviceId) => ({ serviceId })) } }
            : {}),
        },
        include: specialistInclude,
      });
    });
    return jsonSuccess(toSpecialistDto(specialist));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const specialist = await prisma.specialist.update({
      where: { id },
      data: { active: false },
      include: specialistInclude,
    });
    return jsonSuccess(toSpecialistDto(specialist));
  } catch (error) {
    return handleApiError(error);
  }
}
