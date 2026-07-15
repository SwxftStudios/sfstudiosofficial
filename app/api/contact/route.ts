import {
  audit,
  createServiceRequest,
  emailValue,
  getSessionContext,
  readPayload,
  required,
  stringValue,
  toErrorResponse,
} from "../../../lib/backend";

export async function POST(request: Request) {
  try {
    const context = await getSessionContext(request);
    const payload = await readPayload<{
      name?: string;
      type?: string;
      message?: string;
      email?: string;
    }>(request);
    const serviceRequest = await createServiceRequest({
      name: required(stringValue(payload.name, 160), "Name"),
      serviceType: required(stringValue(payload.type, 80), "Service"),
      message: required(stringValue(payload.message, 1500), "Message"),
      contactEmail: emailValue(payload.email) || context?.user.email || "",
    });

    await audit(
      request,
      {
        category: "contact",
        action: "Submitted service request",
        targetType: "service_request",
        targetId: serviceRequest.id,
        metadata: { serviceType: serviceRequest.serviceType },
      },
      context,
    );
    return Response.json({ ok: true, serviceRequest }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
