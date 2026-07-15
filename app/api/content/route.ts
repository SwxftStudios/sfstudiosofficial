import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { contentBlocks } from "../../../db/schema";
import {
  audit,
  createId,
  listContent,
  nowIso,
  readPayload,
  requirePermission,
  stringValue,
  toErrorResponse,
} from "../../../lib/backend";

const sectionPermissions: Record<string, Parameters<typeof requirePermission>[1]> = {
  showcase: "manage_showcase",
  services: "manage_services",
  announcements: "manage_announcements",
  socials: "manage_socials",
};

export async function GET(request: Request) {
  try {
    const section = stringValue(new URL(request.url).searchParams.get("section") || "", 80);
    return Response.json({ ok: true, content: await listContent(section || undefined) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readPayload<{
      section?: string;
      title?: string;
      body?: string;
      imageUrl?: string;
      linkUrl?: string;
      sortOrder?: number;
      status?: string;
    }>(request);
    const section = stringValue(payload.section, 80);
    const permission = sectionPermissions[section];
    if (!permission) return Response.json({ error: "Unsupported content section." }, { status: 400 });

    const context = await requirePermission(request, permission);
    const now = nowIso();
    const db = getDb();
    const [block] = await db
      .insert(contentBlocks)
      .values({
        id: createId("content"),
        section,
        title: stringValue(payload.title, 160),
        body: stringValue(payload.body, 2000),
        imageUrl: stringValue(payload.imageUrl, 500),
        linkUrl: stringValue(payload.linkUrl, 500),
        sortOrder: Number.isFinite(payload.sortOrder) ? Number(payload.sortOrder) : 0,
        status: stringValue(payload.status, 40) || "published",
        createdByUserId: context.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await audit(
      request,
      {
        category: "staff",
        action: `Created ${section} content`,
        targetType: "content",
        targetId: block.id,
      },
      context,
    );
    return Response.json({ ok: true, content: block }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = stringValue(url.searchParams.get("id") || "", 120);
    const section = stringValue(url.searchParams.get("section") || "", 80);
    const permission = sectionPermissions[section];
    if (!id || !permission) return Response.json({ error: "Content id and section are required." }, { status: 400 });

    const context = await requirePermission(request, permission);
    await getDb().delete(contentBlocks).where(eq(contentBlocks.id, id));
    await audit(
      request,
      { category: "staff", action: `Deleted ${section} content`, targetType: "content", targetId: id },
      context,
    );
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
