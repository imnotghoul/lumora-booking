import { getAvailability } from "@/lib/server/appointments";
import { handleApiError, jsonSuccess } from "@/lib/server/api";
import { availabilityQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const query = availabilityQuerySchema.parse({
      serviceId: searchParams.get("serviceId") || undefined,
      specialistId: searchParams.get("specialistId") || undefined,
      date: searchParams.get("date") || undefined,
    });
    return jsonSuccess(await getAvailability(query));
  } catch (error) {
    return handleApiError(error);
  }
}
