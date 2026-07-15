import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { users } from "../../../db/schema";
import {
  audit,
  listPortfolio,
  publicUser,
  readPayload,
  replacePortfolio,
  requireSession,
  stringValue,
  toErrorResponse,
} from "../../../lib/backend";

export async function GET(request: Request) {
  try {
    const context = await requireSession(request);
    return Response.json({
      ok: true,
      user: publicUser(context.user),
      portfolio: await listPortfolio(context.user.id),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const context = await requireSession(request);
    const payload = await readPayload<{
      firstName?: string;
      lastName?: string;
      icon?: string;
      bio?: string;
      portfolio?: string[];
    }>(request);
    const db = getDb();
    const [user] = await db
      .update(users)
      .set({
        firstName: stringValue(payload.firstName, 80),
        lastName: stringValue(payload.lastName, 80),
        avatarUrl: stringValue(payload.icon, 500) || "/sf-studios-logo.png",
        bio: stringValue(payload.bio, 1200),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, context.user.id))
      .returning();

    const portfolio = Array.isArray(payload.portfolio)
      ? payload.portfolio.map((item) => stringValue(item, 500)).filter(Boolean)
      : [];
    await replacePortfolio(context.user.id, portfolio);
    await audit(request, { category: "profile", action: "Updated profile" }, context);

    return Response.json({
      ok: true,
      user: publicUser(user),
      portfolio: await listPortfolio(context.user.id),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
