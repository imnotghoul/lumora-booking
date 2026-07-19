import {
  cancelAppointmentByAdmin,
  updateAppointmentByAdmin,
} from "@/lib/server/appointments";
import { handleApiError, jsonSuccess, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import { updateAppointmentSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const input = updateAppointmentSchema.parse(await readJson(request));
    return jsonSuccess(await updateAppointmentByAdmin(id, input));
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
    return jsonSuccess(await cancelAppointmentByAdmin(id));
  } catch (error) {
    return handleApiError(error);
  }
}
