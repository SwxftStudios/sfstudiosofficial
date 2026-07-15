import { getDb } from "../../../../db";
import { staffDepartments } from "../../../../db/schema";
import {
  audit,
  createId,
  ensureStaffDefaults,
  listStaff,
  nowIso,
  readPayload,
  requirePermission,
  stringValue,
  toErrorResponse,
} from "../../../../lib/backend";

export async function GET(request: Request) {
  try {
    await ensureStaffDefaults();
    await requirePermission(request, "manage_departments");
    return Response.json({ ok: true, departments: await listStaff() });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await ensureStaffDefaults();
    const context = await requirePermission(request, "manage_departments");
    const payload = await readPayload<{ name?: string }>(request);
    const name = stringValue(payload.name, 120);
    if (!name) return Response.json({ error: "Department name is required." }, { status: 400 });

    const db = getDb();
    const [department] = await db
      .insert(staffDepartments)
      .values({
        id: createId("department"),
        name,
        createdByUserId: context.user.id,
        createdAt: nowIso(),
      })
      .returning();

    await audit(
      request,
      {
        category: "staff",
        action: `Created department: ${name}`,
        targetType: "department",
        targetId: department.id,
      },
      context,
    );
    return Response.json({ ok: true, department, departments: await listStaff() }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
