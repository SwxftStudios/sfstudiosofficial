import {
  audit,
  createSessionResponse,
  emailValue,
  ensureStaffDefaults,
  findUserByEmail,
  publicSession,
  readPayload,
  required,
  stringValue,
  toErrorResponse,
  verifyPassword,
} from "../../../../lib/backend";

export async function POST(request: Request) {
  try {
    await ensureStaffDefaults();
    const payload = await readPayload<{ email?: string; password?: string }>(request);
    const email = required(emailValue(payload.email), "Email");
    const password = required(stringValue(payload.password, 200), "Password");
    const user = await findUserByEmail(email);

    if (!user || !(await verifyPassword(user, password))) {
      await audit(request, {
        category: "auth",
        action: "Failed login",
        metadata: { email },
      });
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const response = await createSessionResponse(request, user, {
      ok: true,
      session: publicSession(null),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
      },
    });
    await audit(request, { category: "auth", action: "Logged in" });
    return response;
  } catch (error) {
    return toErrorResponse(error);
  }
}
