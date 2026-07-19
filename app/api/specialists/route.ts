import { z } from "zod";

import { handleApiError, jsonSuccess } from "@/lib/server/api";
import { specialistInclude, toSpecialistDto } from "@/lib/server/catalog";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const serviceId = z.string().trim().min(1).max(100).optional().parse(
      new URL(request.url).searchParams.get("serviceId") || undefined,
    );
    const specialists = await prisma.specialist.findMany({
      where: {
        active: true,
        ...(serviceId ? { services: { some: { serviceId } } } : {}),
      },
      include: specialistInclude,
      orderBy: [{ rating: "desc" }, { name: "asc" }],
    });
    return jsonSuccess(specialists.map(toSpecialistDto));
  } catch (error) {
    return handleApiError(error);
  }
}
