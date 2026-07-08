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

INSERT OR IGNORE INTO \`courses\` (\`id\`, \`title\`) VALUES 
('course-1', 'Advanced Next.js Architecture'),
('course-2', 'PostgreSQL Database Design');

INSERT OR IGNORE INTO \`users\` (\`id\`, \`name\`, \`role\`) VALUES 
('user-1', 'Alice Student', 'STUDENT'),
('user-2', 'Bob Learner', 'STUDENT'),
('user-3', 'Charlie Scholar', 'STUDENT'),
('user-4', 'Diana Freshman', 'STUDENT'),
('user-5', 'Eve Instructor', 'MODERATOR'),
('user-6', 'Moderator Mike', 'MODERATOR');

INSERT OR IGNORE INTO \`enrollments\` (\`id\`, \`user_id\`, \`course_id\`) VALUES 
('enr-1', 'user-1', 'course-1'),
('enr-2', 'user-2', 'course-1'),
('enr-3', 'user-3', 'course-2'),
('enr-4', 'user-4', 'course-2'),
('enr-5', 'user-1', 'course-2');

INSERT OR IGNORE INTO \`posts\` (\`id\`, \`course_id\`, \`author_id\`, \`title\`, \`content\`) VALUES 
('post-1', 'course-1', 'user-5', 'Next.js Topic 1', 'This is the content for Next.js topic 1.'),
('post-2', 'course-1', 'user-5', 'Next.js Topic 2', 'This is the content for Next.js topic 2.'),
('post-3', 'course-2', 'user-5', 'PostgreSQL Topic 1', 'This is the content for PostgreSQL topic 1.');

INSERT OR IGNORE INTO \`comments\` (\`id\`, \`post_id\`, \`author_id\`, \`content\`) VALUES 
('comment-1', 'post-1', 'user-1', 'Great post! Thanks for sharing.'),
('comment-2', 'post-1', 'user-2', 'I have a question about this.'),
('comment-3', 'post-2', 'user-3', 'Very insightful.');

INSERT OR IGNORE INTO \`likes\` (\`id\`, \`user_id\`, \`post_id\`) VALUES 
('like-1', 'user-1', 'post-1'),
('like-2', 'user-2', 'post-1'),
('like-3', 'user-3', 'post-2');

INSERT OR IGNORE INTO \`saved_posts\` (\`id\`, \`user_id\`, \`post_id\`) VALUES 
('saved-1', 'user-1', 'post-1'),
('saved-2', 'user-1', 'post-2'),
('saved-3', 'user-2', 'post-1');
`;
  client.executeMultiple(schemaSql).catch(console.error);
}

export const db = drizzle(client, { schema });
