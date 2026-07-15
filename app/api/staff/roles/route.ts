import { eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { staffDepartments, staffRoles } from "../../../../db/schema";
import {
  allPermissions,
  audit,
  createId,
  ensureStaffDefaults,
  listStaff,
  nowIso,
  readPayload,
  requirePermission,
  stringValue,
  toErrorResponse,
  type Permission,
} from "../../../../lib/backend";

export async function POST(request: Request) {
  try {
    await ensureStaffDefaults();
    const context = await requirePermission(request, "manage_roles");
    const payload = await readPayload<{
      departmentId?: string;
      name?: string;
      permissions?: string[];
    }>(request);
    const departmentId = stringValue(payload.departmentId, 120);
    const name = stringValue(payload.name, 120);
    if (!departmentId || !name) {
      return Response.json({ error: "Department and role name are required." }, { status: 400 });
    }

    const db = getDb();
    const [department] = await db
      .select()
      .from(staffDepartments)
      .where(eq(staffDepartments.id, departmentId))
      .limit(1);
    if (!department) return Response.json({ error: "Department not found." }, { status: 404 });

    const permissions = Array.isArray(payload.permissions)
      ? payload.permissions.filter((permission): permission is Permission =>
          allPermissions.includes(permission as Permission),
        )
      : [];
    const [role] = await db
      .insert(staffRoles)
      .values({
        id: createId("role"),
        departmentId,
        name,
        permissions: JSON.stringify(permissions),
        createdByUserId: context.user.id,
        createdAt: nowIso(),
      })
      .returning();

    await audit(
      request,
      {
        category: "staff",
        action: `Created role: ${name}`,
        targetType: "role",
        targetId: role.id,
        metadata: { permissions },
      },
      context,
    );
    return Response.json({ ok: true, role, departments: await listStaff() }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
