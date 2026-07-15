import {
  audit,
  createPasswordUser,
  createSessionResponse,
  emailValue,
  publicUser,
  readPayload,
  required,
  stringValue,
  toErrorResponse,
} from "../../../../lib/backend";

export async function POST(request: Request) {
  try {
    const payload = await readPayload<{
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      phone?: string;
      country?: string;
    }>(request);
    const firstName = required(stringValue(payload.firstName, 80), "First name");
    const email = required(emailValue(payload.email), "Email");
    const password = required(stringValue(payload.password, 200), "Password");

    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const user = await createPasswordUser({
      firstName,
      lastName: stringValue(payload.lastName, 80),
      email,
      password,
      phone: stringValue(payload.phone, 40),
      country: stringValue(payload.country, 80),
    });
    await audit(request, { category: "auth", action: "Signed up" }, {
      user,
      role: null,
      department: null,
      permissions: [],
    });
    return createSessionResponse(
      request,
      user,
      { ok: true, user: publicUser(user) },
      { status: 201 },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
