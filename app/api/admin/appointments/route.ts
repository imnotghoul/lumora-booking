import {
  createAppointment,
  listAdminAppointments,
} from "@/lib/server/appointments";
import { handleApiError, jsonSuccess, readJson } from "@/lib/server/api";
import { requireAdmin } from "@/lib/server/auth";
import {
  adminAppointmentFiltersSchema,
  createAppointmentSchema,
} from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const searchParams = new URL(request.url).searchParams;
    const filters = adminAppointmentFiltersSchema.parse({
      date: searchParams.get("date") || undefined,
      specialistId: searchParams.get("specialistId") || undefined,
      serviceId: searchParams.get("serviceId") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    });
    return jsonSuccess(await listAdminAppointments(filters));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const input = createAppointmentSchema.parse(await readJson(request));
    return jsonSuccess(await createAppointment(input, { allowStatus: true }), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
