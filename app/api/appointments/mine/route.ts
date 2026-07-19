import { findClientAppointments } from "@/lib/server/appointments";
import { handleApiError, jsonSuccess } from "@/lib/server/api";
import { mineQuerySchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const contact = mineQuerySchema.parse({
      phone: searchParams.get("phone") || undefined,
      email: searchParams.get("email") || undefined,
    });
    return jsonSuccess(await findClientAppointments(contact));
  } catch (error) {
    return handleApiError(error);
  }
}
