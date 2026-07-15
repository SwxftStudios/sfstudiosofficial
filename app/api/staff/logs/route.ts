import { getDb } from "../../../../db";
import { auditLogs } from "../../../../db/schema";
import {
  audit,
  listAuditLogs,
  requirePermission,
  stringValue,
  toErrorResponse,
} from "../../../../lib/backend";

export async function GET(request: Request) {
  try {
    await requirePermission(request, "view_logs");
    const url = new URL(request.url);
    const category = stringValue(url.searchParams.get("category") || "", 80);
    const actor = stringValue(url.searchParams.get("actor") || "", 160);
    return Response.json({ ok: true, logs: await listAuditLogs({ category, actor }) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await requirePermission(request, "view_logs");
    await getDb().delete(auditLogs);
    await audit(request, { category: "staff", action: "Cleared activity logs" }, context);
    return Response.json({ ok: true, logs: await listAuditLogs({}) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
