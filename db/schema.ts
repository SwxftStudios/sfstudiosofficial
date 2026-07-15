import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    firstName: text("first_name").notNull().default(""),
    lastName: text("last_name").notNull().default(""),
    phone: text("phone").notNull().default(""),
    country: text("country").notNull().default(""),
    avatarUrl: text("avatar_url").notNull().default("/sf-studios-logo.png"),
    bio: text("bio").notNull().default(""),
    passwordHash: text("password_hash"),
    passwordSalt: text("password_salt"),
    provider: text("provider").notNull().default("password"),
    googleSub: text("google_sub").unique(),
    roleId: text("role_id"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
    googleSubIdx: index("users_google_sub_idx").on(table.googleSub),
  }),
);

export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
    expiresAt: text("expires_at").notNull(),
    userAgent: text("user_agent").notNull().default(""),
  },
  (table) => ({
    userIdx: index("sessions_user_idx").on(table.userId),
    expiresIdx: index("sessions_expires_idx").on(table.expiresAt),
  }),
);

export const staffDepartments = sqliteTable("staff_departments", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdByUserId: text("created_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at").notNull(),
});

export const staffRoles = sqliteTable(
  "staff_roles",
  {
    id: text("id").primaryKey(),
    departmentId: text("department_id")
      .notNull()
      .references(() => staffDepartments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    permissions: text("permissions").notNull().default("[]"),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    departmentIdx: index("staff_roles_department_idx").on(table.departmentId),
  }),
);

export const jobs = sqliteTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    category: text("category").notNull(),
    pay: text("pay").notNull(),
    payType: text("pay_type").notNull(),
    contact: text("contact").notNull(),
    imageUrl: text("image_url").notNull().default("/sf-studios-logo.png"),
    timeline: text("timeline").notNull().default("Flexible"),
    level: text("level").notNull().default("Any level"),
    description: text("description").notNull(),
    status: text("status").notNull().default("open"),
    postedByUserId: text("posted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    statusIdx: index("jobs_status_idx").on(table.status),
    categoryIdx: index("jobs_category_idx").on(table.category),
  }),
);

export const applications = sqliteTable(
  "applications",
  {
    id: text("id").primaryKey(),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    applicantUserId: text("applicant_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    applicantName: text("applicant_name").notNull(),
    contact: text("contact").notNull().default(""),
    bioSnapshot: text("bio_snapshot").notNull().default(""),
    portfolioJson: text("portfolio_json").notNull().default("[]"),
    status: text("status").notNull().default("new"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    jobIdx: index("applications_job_idx").on(table.jobId),
    applicantIdx: index("applications_applicant_idx").on(table.applicantUserId),
  }),
);

export const portfolioItems = sqliteTable(
  "portfolio_items",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    url: text("url").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    userIdx: index("portfolio_items_user_idx").on(table.userId),
  }),
);

export const contentBlocks = sqliteTable(
  "content_blocks",
  {
    id: text("id").primaryKey(),
    section: text("section").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    imageUrl: text("image_url").notNull().default(""),
    linkUrl: text("link_url").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status").notNull().default("published"),
    createdByUserId: text("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    sectionIdx: index("content_blocks_section_idx").on(table.section),
  }),
);

export const serviceRequests = sqliteTable("service_requests", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  serviceType: text("service_type").notNull(),
  message: text("message").notNull(),
  contactEmail: text("contact_email").notNull().default(""),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at").notNull(),
});

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    category: text("category").notNull(),
    action: text("action").notNull(),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorName: text("actor_name").notNull().default("Visitor"),
    roleName: text("role_name").notNull().default("Public"),
    departmentName: text("department_name").notNull().default("Public"),
    targetType: text("target_type").notNull().default(""),
    targetId: text("target_id").notNull().default(""),
    metadata: text("metadata").notNull().default("{}"),
    userAgent: text("user_agent").notNull().default(""),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    categoryIdx: index("audit_logs_category_idx").on(table.category),
    actorIdx: index("audit_logs_actor_idx").on(table.actorUserId),
    createdIdx: index("audit_logs_created_idx").on(table.createdAt),
  }),
);
