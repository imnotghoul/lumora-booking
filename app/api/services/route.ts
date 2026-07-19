import { handleApiError, jsonSuccess } from "@/lib/server/api";
import { toServiceDto } from "@/lib/server/catalog";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
    });
    return jsonSuccess(services.map(toServiceDto));
  } catch (error) {
    return handleApiError(error);
  }
}
