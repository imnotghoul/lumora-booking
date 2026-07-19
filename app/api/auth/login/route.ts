import { authenticateAdmin, setAdminSession } from "@/lib/server/auth";
import { handleApiError, jsonSuccess, readJson } from "@/lib/server/api";
import { loginSchema } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/server/request-security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { email, password } = loginSchema.parse(await readJson(request));
    const admin = await authenticateAdmin(email, password);
    await setAdminSession(admin);
    return jsonSuccess({ id: admin.id, name: admin.name, email: admin.email });
  } catch (error) {
    return handleApiError(error);
  }
}
