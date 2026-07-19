import { handleApiError, jsonSuccess, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { toServiceDto } from "@/lib/server/catalog";
import { prisma } from "@/lib/server/prisma";
import { updateServiceSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const input = updateServiceSchema.parse(await readJson(request));
    const service = await prisma.service.update({ where: { id }, data: input });
    return jsonSuccess(toServiceDto(service));
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
    const service = await prisma.service.update({
      where: { id },
      data: { active: false, featured: false },
    });
    return jsonSuccess(toServiceDto(service));
  } catch (error) {
    return handleApiError(error);
  }
}
