import { cancelClientAppointment } from "@/lib/server/appointments";
import { handleApiError, jsonSuccess, readJson } from "@/lib/server/api";
import { cancelAppointmentSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const contact = cancelAppointmentSchema.parse(await readJson(request));
    return jsonSuccess(await cancelClientAppointment(id, contact));
  } catch (error) {
    return handleApiError(error);
  }
}
