export * from "drizzle-orm";
export * from "./schema";

import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL || (process.env.VERCEL ? "file:/tmp/sqlite.db" : "file:./sqlite.db");

export const client = createClient({
  url: dbUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

if (process.env.VERCEL && !process.env.DATABASE_URL) {
  const schemaSql = `
CREATE TABLE IF NOT EXISTS \`courses\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`title\` text NOT NULL,
	\`created_at\` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	\`updated_at\` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
CREATE TABLE IF NOT EXISTS \`users\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`name\` text NOT NULL,
	\`role\` text DEFAULT 'STUDENT' NOT NULL,
	\`created_at\` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	\`updated_at\` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
CREATE TABLE IF NOT EXISTS \`posts\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`course_id\` text NOT NULL,
	\`author_id\` text NOT NULL,
	\`title\` text NOT NULL,
	\`content\` text NOT NULL,
	\`created_at\` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	\`updated_at\` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS \`comments\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`post_id\` text NOT NULL,
	\`author_id\` text NOT NULL,
	\`content\` text NOT NULL,
	\`created_at\` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	\`updated_at\` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`author_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE IF NOT EXISTS \`enrollments\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`user_id\` text NOT NULL,
	\`course_id\` text NOT NULL,
	\`created_at\` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	\`updated_at\` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`course_id\`) REFERENCES \`courses\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS \`user_id_course_id_idx\` ON \`enrollments\` (\`user_id\`,\`course_id\`);
CREATE TABLE IF NOT EXISTS \`likes\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`user_id\` text NOT NULL,
	\`post_id\` text NOT NULL,
	\`created_at\` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	\`updated_at\` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS \`like_user_id_post_id_idx\` ON \`likes\` (\`user_id\`,\`post_id\`);
CREATE TABLE IF NOT EXISTS \`saved_posts\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`user_id\` text NOT NULL,
	\`post_id\` text NOT NULL,
	\`created_at\` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	\`updated_at\` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	\`deleted_at\` integer,
	FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (\`post_id\`) REFERENCES \`posts\`(\`id\`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS \`user_id_post_id_idx\` ON \`saved_posts\` (\`user_id\`,\`post_id\`);
`;
  client.executeMultiple(schemaSql).catch(console.error);
}

export const db = drizzle(client, { schema });
