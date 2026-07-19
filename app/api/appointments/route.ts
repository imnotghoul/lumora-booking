import { createAppointment } from "@/lib/server/appointments";
import { handleApiError, jsonSuccess, readJson } from "@/lib/server/api";
import { publicCreateAppointmentSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = publicCreateAppointmentSchema.parse(await readJson(request));
    return jsonSuccess(await createAppointment(input), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
