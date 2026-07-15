import {
  audit,
  ensureStaffDefaults,
  getSessionContext,
  listPortfolio,
  publicSession,
  toErrorResponse,
} from "../../../../lib/backend";

export async function GET(request: Request) {
  try {
    await ensureStaffDefaults();
    const context = await getSessionContext(request);
    await audit(request, { category: "visit", action: "Loaded session state" }, context);
    const portfolio = context ? await listPortfolio(context.user.id) : [];
    return Response.json({ ok: true, session: publicSession(context), portfolio });
  } catch (error) {
    return toErrorResponse(error);
  }
}
