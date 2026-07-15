import { getDb } from "../../../db";
import { jobs } from "../../../db/schema";
import {
  audit,
  createId,
  getSessionContext,
  listJobs,
  nowIso,
  readPayload,
  required,
  stringValue,
  toErrorResponse,
} from "../../../lib/backend";

function payTypeFromPay(pay: string) {
  const lower = pay.toLowerCase();
  if (lower.includes("robux")) return "robux";
  if (pay.includes("%")) return "percent";
  if (lower.includes("contract")) return "contract";
  return "usd";
}

export async function GET() {
  try {
    return Response.json({ ok: true, jobs: await listJobs() });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getSessionContext(request);
    const payload = await readPayload<{
      title?: string;
      category?: string;
      pay?: string;
      contact?: string;
      imageUrl?: string;
      timeline?: string;
      level?: string;
      description?: string;
    }>(request);
    const title = required(stringValue(payload.title, 120), "Job title");
    const pay = required(stringValue(payload.pay, 80), "Pay");
    const now = nowIso();
    const db = getDb();
    const [job] = await db
      .insert(jobs)
      .values({
        id: createId("job"),
        title,
        category: required(stringValue(payload.category, 80), "Service type"),
        pay,
        payType: payTypeFromPay(pay),
        contact: required(stringValue(payload.contact, 160), "Contact"),
        imageUrl: stringValue(payload.imageUrl, 500) || "/sf-studios-logo.png",
        timeline: stringValue(payload.timeline, 80) || "Flexible",
        level: stringValue(payload.level, 80) || "Any level",
        description: required(stringValue(payload.description, 1000), "Description"),
        postedByUserId: context?.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await audit(
      request,
      {
        category: "job",
        action: `Posted job: ${title}`,
        targetType: "job",
        targetId: job.id,
        metadata: { title: job.title, category: job.category },
      },
      context,
    );
    return Response.json({ ok: true, job }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
