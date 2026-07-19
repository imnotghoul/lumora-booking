import { clearAdminSession } from "@/lib/server/auth";
import { handleApiError, jsonSuccess } from "@/lib/server/api";
import { assertSameOrigin } from "@/lib/server/request-security";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await clearAdminSession();
    return jsonSuccess({ loggedOut: true });
  } catch (error) {
    return handleApiError(error);
  }
}
