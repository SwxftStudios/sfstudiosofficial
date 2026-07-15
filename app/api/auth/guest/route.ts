import { audit, json, toErrorResponse } from "../../../../lib/backend";

export async function POST(request: Request) {
  try {
    await audit(request, { category: "auth", action: "Continued as guest" });
    return json({ ok: true, mode: "guest" });
  } catch (error) {
    return toErrorResponse(error);
  }
}
