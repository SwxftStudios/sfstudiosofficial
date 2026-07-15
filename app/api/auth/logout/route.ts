import { audit, clearSession, getSessionContext, toErrorResponse } from "../../../../lib/backend";

export async function POST(request: Request) {
  try {
    const context = await getSessionContext(request);
    await audit(request, { category: "auth", action: "Logged out" }, context);
    return clearSession(request);
  } catch (error) {
    return toErrorResponse(error);
  }
}
