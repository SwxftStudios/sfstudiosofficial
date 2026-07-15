import { env } from "cloudflare:workers";
import { and, desc, eq, gt, like, or } from "drizzle-orm";
import { getDb } from "../db";
import {
  auditLogs,
  contentBlocks,
  jobs,
  portfolioItems,
  serviceRequests,
  sessions,
  staffDepartments,
  staffRoles,
  users,
} from "../db/schema";

const textEncoder = new TextEncoder();
const sessionCookieName = "sf_session";
const googleStateCookieName = "sf_google_state";
const sessionDays = 30;

export const allPermissions = [
  "manage_departments",
  "manage_roles",
  "manage_showcase",
  "manage_services",
  "manage_jobs",
  "review_applications",
  "manage_announcements",
  "manage_socials",
  "view_logs",
  "security",
] as const;

export type Permission = (typeof allPermissions)[number];

type DbUser = typeof users.$inferSelect;
type DbRole = typeof staffRoles.$inferSelect;
type DbDepartment = typeof staffDepartments.$inferSelect;

export type SessionContext = {
  user: DbUser;
  role: DbRole | null;
  department: DbDepartment | null;
  permissions: Permission[];
};

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, init);
}

export function toErrorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  const friendly = routeErrorMessage(message);
  return json({ error: friendly }, { status: 500 });
}

export async function readPayload<T extends Record<string, unknown>>(
  request: Request,
): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.");
  }
}

export function stringValue(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

export function emailValue(value: unknown) {
  return stringValue(value, 320).toLowerCase();
}

export function required(value: string, label: string) {
  if (!value) throw new HttpError(400, `${label} is required.`);
  return value;
}

export function publicUser(user: DbUser) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    country: user.country,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    provider: user.provider,
    roleId: user.roleId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function publicSession(context: SessionContext | null) {
  if (!context) return { user: null, role: null, department: null, permissions: [] };

  return {
    user: publicUser(context.user),
    role: context.role
      ? {
          id: context.role.id,
          name: context.role.name,
          permissions: parsePermissions(context.role.permissions),
        }
      : null,
    department: context.department
      ? { id: context.department.id, name: context.department.name }
      : null,
    permissions: context.permissions,
  };
}

export async function ensureStaffDefaults() {
  const db = getDb();
  const now = nowIso();
  const founderEmail = (env.FOUNDER_EMAIL || "za01302025@gmail.com").toLowerCase();
  const founderPassword = env.FOUNDER_PASSWORD || "password";

  const [department] = await db
    .select()
    .from(staffDepartments)
    .where(eq(staffDepartments.id, "executives"))
    .limit(1);

  if (!department) {
    await db.insert(staffDepartments).values({
      id: "executives",
      name: "Executives",
      createdAt: now,
    });
  }

  const [role] = await db
    .select()
    .from(staffRoles)
    .where(eq(staffRoles.id, "founder"))
    .limit(1);

  if (!role) {
    await db.insert(staffRoles).values({
      id: "founder",
      departmentId: "executives",
      name: "Founder",
      permissions: JSON.stringify(allPermissions),
      createdAt: now,
    });
  }

  const [founder] = await db
    .select()
    .from(users)
    .where(eq(users.email, founderEmail))
    .limit(1);

  if (!founder) {
    const password = await hashPassword(founderPassword);
    await db.insert(users).values({
      id: createId("user"),
      email: founderEmail,
      firstName: "Founder",
      lastName: "",
      passwordHash: password.hash,
      passwordSalt: password.salt,
      provider: "password",
      roleId: "founder",
      createdAt: now,
      updatedAt: now,
    });
    return;
  }

  if (founder.roleId !== "founder") {
    await db.update(users).set({ roleId: "founder", updatedAt: now }).where(eq(users.id, founder.id));
  }
}

export async function findUserByEmail(email: string) {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

export async function createPasswordUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
}) {
  const db = getDb();
  const existing = await findUserByEmail(input.email);
  if (existing) throw new HttpError(409, "An account with this email already exists.");

  const now = nowIso();
  const password = await hashPassword(input.password);
  const [user] = await db
    .insert(users)
    .values({
      id: createId("user"),
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? "",
      country: input.country ?? "",
      passwordHash: password.hash,
      passwordSalt: password.salt,
      provider: "password",
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return user;
}

export async function verifyPassword(user: DbUser, password: string) {
  if (!user.passwordHash || !user.passwordSalt) return false;
  const next = await hashPassword(password, user.passwordSalt);
  return timingSafeEqual(next.hash, user.passwordHash);
}

export async function createSessionResponse(
  request: Request,
  user: DbUser,
  body: Record<string, unknown>,
  init?: ResponseInit,
) {
  const token = randomHex(32);
  const tokenHash = await sessionHash(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + sessionDays * 24 * 60 * 60 * 1000);
  const db = getDb();

  await db.insert(sessions).values({
    tokenHash,
    userId: user.id,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    userAgent: request.headers.get("user-agent") || "",
  });

  const response = json(body, init);
  response.headers.append(
    "Set-Cookie",
    serializeCookie(sessionCookieName, token, {
      maxAge: sessionDays * 24 * 60 * 60,
      secure: new URL(request.url).protocol === "https:",
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
    }),
  );
  return response;
}

export async function getSessionContext(request: Request): Promise<SessionContext | null> {
  const token = parseCookies(request.headers.get("cookie"))[sessionCookieName];
  if (!token) return null;

  const tokenHash = await sessionHash(token);
  const db = getDb();
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, nowIso())))
    .limit(1);

  if (!session) return null;

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return null;

  let role: DbRole | null = null;
  let department: DbDepartment | null = null;
  if (user.roleId) {
    const [roleRow] = await db.select().from(staffRoles).where(eq(staffRoles.id, user.roleId)).limit(1);
    role = roleRow ?? null;
    if (role) {
      const [departmentRow] = await db
        .select()
        .from(staffDepartments)
        .where(eq(staffDepartments.id, role.departmentId))
        .limit(1);
      department = departmentRow ?? null;
    }
  }

  return {
    user,
    role,
    department,
    permissions: role ? parsePermissions(role.permissions) : [],
  };
}

export async function requireSession(request: Request) {
  const context = await getSessionContext(request);
  if (!context) throw new HttpError(401, "Login required.");
  return context;
}

export async function requirePermission(request: Request, permission: Permission) {
  const context = await requireSession(request);
  if (!context.permissions.includes(permission)) {
    throw new HttpError(403, "You do not have permission for this action.");
  }
  return context;
}

export async function clearSession(request: Request) {
  const token = parseCookies(request.headers.get("cookie"))[sessionCookieName];
  if (token) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.tokenHash, await sessionHash(token)));
  }

  const response = json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    serializeCookie(sessionCookieName, "", {
      maxAge: 0,
      secure: new URL(request.url).protocol === "https:",
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
    }),
  );
  return response;
}

export async function audit(
  request: Request,
  input: {
    category: string;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
  },
  context?: SessionContext | null,
) {
  try {
    const db = getDb();
    await db.insert(auditLogs).values({
      id: createId("log"),
      category: input.category,
      action: input.action,
      actorUserId: context?.user.id,
      actorName: context
        ? [context.user.firstName, context.user.lastName].filter(Boolean).join(" ") || context.user.email
        : "Visitor",
      roleName: context?.role?.name || "Public",
      departmentName: context?.department?.name || "Public",
      targetType: input.targetType || "",
      targetId: input.targetId || "",
      metadata: JSON.stringify(input.metadata || {}),
      userAgent: request.headers.get("user-agent") || "",
      createdAt: nowIso(),
    });
  } catch {
    // Logging should never take down a user-facing action.
  }
}

export async function listAuditLogs(filters: { category?: string; actor?: string }) {
  const db = getDb();
  const conditions = [];
  if (filters.category) conditions.push(eq(auditLogs.category, filters.category));
  if (filters.actor) {
    const term = `%${filters.actor}%`;
    conditions.push(
      or(
        like(auditLogs.actorName, term),
        like(auditLogs.roleName, term),
        like(auditLogs.departmentName, term),
      ),
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;
  return db
    .select()
    .from(auditLogs)
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);
}

export async function listStaff() {
  const db = getDb();
  const [departments, roles] = await Promise.all([
    db.select().from(staffDepartments).orderBy(staffDepartments.name),
    db.select().from(staffRoles).orderBy(staffRoles.name),
  ]);

  return departments.map((department) => ({
    ...department,
    roles: roles
      .filter((role) => role.departmentId === department.id)
      .map((role) => ({ ...role, permissions: parsePermissions(role.permissions) })),
  }));
}

export async function listJobs() {
  const db = getDb();
  return db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "open"))
    .orderBy(desc(jobs.createdAt))
    .limit(100);
}

export async function listPortfolio(userId: string) {
  const db = getDb();
  return db.select().from(portfolioItems).where(eq(portfolioItems.userId, userId)).orderBy(desc(portfolioItems.createdAt));
}

export async function replacePortfolio(userId: string, urls: string[]) {
  const db = getDb();
  await db.delete(portfolioItems).where(eq(portfolioItems.userId, userId));
  if (!urls.length) return;

  await db.insert(portfolioItems).values(
    urls.map((url, index) => ({
      id: createId("portfolio"),
      userId,
      title: `Portfolio ${index + 1}`,
      url,
      createdAt: nowIso(),
    })),
  );
}

export async function createServiceRequest(input: {
  name: string;
  serviceType: string;
  message: string;
  contactEmail?: string;
}) {
  const db = getDb();
  const [request] = await db
    .insert(serviceRequests)
    .values({
      id: createId("service"),
      name: input.name,
      serviceType: input.serviceType,
      message: input.message,
      contactEmail: input.contactEmail || "",
      createdAt: nowIso(),
    })
    .returning();
  return request;
}

export async function listContent(section?: string) {
  const db = getDb();
  const query = db
    .select()
    .from(contentBlocks)
    .where(section ? eq(contentBlocks.section, section) : undefined)
    .orderBy(contentBlocks.sortOrder, desc(contentBlocks.createdAt))
    .limit(100);
  return query;
}

export async function createGoogleStartResponse(request: Request) {
  const clientId = env.GOOGLE_CLIENT_ID;
  const state = randomHex(24);
  const redirectUri = googleRedirectUri(request);

  if (!clientId) {
    return Response.redirect(new URL("/login.html?auth=google-missing-env", request.url).toString(), 302);
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  const response = Response.redirect(authUrl.toString(), 302);
  response.headers.append(
    "Set-Cookie",
    serializeCookie(googleStateCookieName, state, {
      maxAge: 10 * 60,
      secure: new URL(request.url).protocol === "https:",
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
    }),
  );
  return response;
}

export async function handleGoogleCallback(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const state = url.searchParams.get("state") || "";
  const cookies = parseCookies(request.headers.get("cookie"));
  const expectedState = cookies[googleStateCookieName];

  if (!code || !state || state !== expectedState) {
    return Response.redirect(new URL("/login.html?auth=google-state", request.url).toString(), 302);
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return Response.redirect(new URL("/login.html?auth=google-missing-env", request.url).toString(), 302);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: googleRedirectUri(request),
    }),
  });

  if (!tokenResponse.ok) {
    return Response.redirect(new URL("/login.html?auth=google-token", request.url).toString(), 302);
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    return Response.redirect(new URL("/login.html?auth=google-token", request.url).toString(), 302);
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!profileResponse.ok) {
    return Response.redirect(new URL("/login.html?auth=google-profile", request.url).toString(), 302);
  }

  const profile = (await profileResponse.json()) as {
    sub: string;
    email: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  };

  const user = await upsertGoogleUser(profile);
  await audit(request, { category: "auth", action: "Logged in with Google" }, {
    user,
    role: null,
    department: null,
    permissions: [],
  });

  const response = await createSessionResponse(
    request,
    user,
    { ok: true },
    { status: 302, headers: { Location: "/studio.html" } },
  );
  response.headers.append(
    "Set-Cookie",
    serializeCookie(googleStateCookieName, "", {
      maxAge: 0,
      secure: new URL(request.url).protocol === "https:",
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
    }),
  );
  return response;
}

async function upsertGoogleUser(profile: {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}) {
  const db = getDb();
  const email = profile.email.toLowerCase();
  const now = nowIso();
  const [existing] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, email), eq(users.googleSub, profile.sub)))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        googleSub: profile.sub,
        provider: existing.provider === "password" ? "password+google" : "google",
        avatarUrl: profile.picture || existing.avatarUrl,
        updatedAt: now,
      })
      .where(eq(users.id, existing.id))
      .returning();
    return updated;
  }

  const [user] = await db
    .insert(users)
    .values({
      id: createId("user"),
      email,
      firstName: profile.given_name || "",
      lastName: profile.family_name || "",
      avatarUrl: profile.picture || "/sf-studios-logo.png",
      provider: "google",
      googleSub: profile.sub,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return user;
}

function googleRedirectUri(request: Request) {
  return env.GOOGLE_REDIRECT_URI || new URL("/api/auth/google/callback", request.url).toString();
}

function parsePermissions(value: string): Permission[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((permission): permission is Permission =>
      allPermissions.includes(permission as Permission),
    );
  } catch {
    return [];
  }
}

async function hashPassword(password: string, salt = randomHex(16)) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: textEncoder.encode(salt),
      iterations: 120_000,
      hash: "SHA-256",
    },
    key,
    256,
  );
  return { salt, hash: bufferToHex(bits) };
}

async function sessionHash(token: string) {
  const secret = env.APP_SESSION_SECRET || "local-dev-session-secret-change-me";
  return sha256Hex(`${token}.${secret}`);
}

async function sha256Hex(value: string) {
  return bufferToHex(await crypto.subtle.digest("SHA-256", textEncoder.encode(value)));
}

function randomHex(bytes: number) {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array, (item) => item.toString(16).padStart(2, "0")).join("");
}

function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (item) => item.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

function parseCookies(header: string | null) {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  header.split(";").forEach((part) => {
    const [name, ...rest] = part.trim().split("=");
    if (!name) return;
    cookies[name] = decodeURIComponent(rest.join("="));
  });
  return cookies;
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    maxAge: number;
    secure: boolean;
    httpOnly: boolean;
    sameSite: "Lax" | "Strict" | "None";
    path: string;
  },
) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Max-Age=${options.maxAge}`,
    `Path=${options.path}`,
    `SameSite=${options.sameSite}`,
  ];
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  return parts.join("; ");
}

export function createId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${randomHex(6)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

function routeErrorMessage(message: string) {
  if (message.includes("no such table")) {
    return "The database tables are not ready yet. Generate/apply the Drizzle migration and deploy with the D1 binding named DB.";
  }
  if (message.includes("Cloudflare D1 binding")) return message;
  return message;
}
