import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { applications, jobs } from "../../../db/schema";
import {
  audit,
  createId,
  getSessionContext,
  nowIso,
  readPayload,
  required,
  stringValue,
  toErrorResponse,
} from "../../../lib/backend";

export async function POST(request: Request) {
  try {
    const context = await getSessionContext(request);
    const payload = await readPayload<{
      jobId?: string;
      applicantName?: string;
      contact?: string;
      bio?: string;
      portfolio?: string[];
    }>(request);
    const jobId = required(stringValue(payload.jobId, 120), "Job");
    const db = getDb();
    const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
    if (!job) return Response.json({ error: "Job not found." }, { status: 404 });

    const portfolio = Array.isArray(payload.portfolio)
      ? payload.portfolio.map((item) => stringValue(item, 500)).filter(Boolean)
      : [];
    const applicantName =
      stringValue(payload.applicantName, 160) ||
      (context
        ? [context.user.firstName, context.user.lastName].filter(Boolean).join(" ") || context.user.email
        : "Studio Member");
    const [application] = await db
      .insert(applications)
      .values({
        id: createId("application"),
        jobId,
        applicantUserId: context?.user.id,
        applicantName,
        contact: stringValue(payload.contact, 160) || context?.user.email || "",
        bioSnapshot: stringValue(payload.bio, 1200) || context?.user.bio || "",
        portfolioJson: JSON.stringify(portfolio),
        createdAt: nowIso(),
      })
      .returning();

    await audit(
      request,
      {
        category: "application",
        action: `Applied to ${job.title}`,
        targetType: "job",
        targetId: job.id,
        metadata: { applicationId: application.id, jobTitle: job.title },
      },
      context,
    );
    return Response.json({ ok: true, application }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
