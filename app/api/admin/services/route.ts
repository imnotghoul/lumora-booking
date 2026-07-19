import { handleApiError, jsonSuccess, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { createSlug, toServiceDto } from "@/lib/server/catalog";
import { prisma } from "@/lib/server/prisma";
import { serviceSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();
    const services = await prisma.service.findMany({ orderBy: { name: "asc" } });
    return jsonSuccess(services.map(toServiceDto));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = serviceSchema.parse(await readJson(request));
    const service = await prisma.service.create({
      data: {
        name: input.name,
        slug: input.slug ?? createSlug(input.name, "service"),
        description: input.description,
        duration: input.duration,
        price: input.price,
        category: input.category,
        icon: input.icon ?? "Sparkles",
        featured: input.featured ?? false,
        active: input.active ?? true,
      },
    });
    return jsonSuccess(toServiceDto(service), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
