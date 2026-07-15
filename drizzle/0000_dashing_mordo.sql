CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`applicant_user_id` text,
	`applicant_name` text NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`bio_snapshot` text DEFAULT '' NOT NULL,
	`portfolio_json` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`applicant_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `applications_job_idx` ON `applications` (`job_id`);--> statement-breakpoint
CREATE INDEX `applications_applicant_idx` ON `applications` (`applicant_user_id`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`action` text NOT NULL,
	`actor_user_id` text,
	`actor_name` text DEFAULT 'Visitor' NOT NULL,
	`role_name` text DEFAULT 'Public' NOT NULL,
	`department_name` text DEFAULT 'Public' NOT NULL,
	`target_type` text DEFAULT '' NOT NULL,
	`target_id` text DEFAULT '' NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`user_agent` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_logs_category_idx` ON `audit_logs` (`category`);--> statement-breakpoint
CREATE INDEX `audit_logs_actor_idx` ON `audit_logs` (`actor_user_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_created_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE TABLE `content_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`section` text NOT NULL,
	`title` text NOT NULL,
	`body` text DEFAULT '' NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`link_url` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`created_by_user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `content_blocks_section_idx` ON `content_blocks` (`section`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`pay` text NOT NULL,
	`pay_type` text NOT NULL,
	`contact` text NOT NULL,
	`image_url` text DEFAULT '/sf-studios-logo.png' NOT NULL,
	`timeline` text DEFAULT 'Flexible' NOT NULL,
	`level` text DEFAULT 'Any level' NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`posted_by_user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`posted_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `jobs_status_idx` ON `jobs` (`status`);--> statement-breakpoint
CREATE INDEX `jobs_category_idx` ON `jobs` (`category`);--> statement-breakpoint
CREATE TABLE `portfolio_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `portfolio_items_user_idx` ON `portfolio_items` (`user_id`);--> statement-breakpoint
CREATE TABLE `service_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`service_type` text NOT NULL,
	`message` text NOT NULL,
	`contact_email` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`user_agent` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_idx` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `staff_departments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_by_user_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_departments_name_unique` ON `staff_departments` (`name`);--> statement-breakpoint
CREATE TABLE `staff_roles` (
	`id` text PRIMARY KEY NOT NULL,
	`department_id` text NOT NULL,
	`name` text NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	`created_by_user_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`department_id`) REFERENCES `staff_departments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `staff_roles_department_idx` ON `staff_roles` (`department_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`first_name` text DEFAULT '' NOT NULL,
	`last_name` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`avatar_url` text DEFAULT '/sf-studios-logo.png' NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`password_hash` text,
	`password_salt` text,
	`provider` text DEFAULT 'password' NOT NULL,
	`google_sub` text,
	`role_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_google_sub_unique` ON `users` (`google_sub`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `users_google_sub_idx` ON `users` (`google_sub`);