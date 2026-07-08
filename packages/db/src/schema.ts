import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { v4 as uuidv4 } from "uuid";

// We use text for UUIDs in SQLite
const genId = () => text("id").primaryKey().$defaultFn(() => uuidv4());

// Base columns for reusability
const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .default(sql`(strftime('%s', 'now'))`)
    .$onUpdate(() => new Date())
    .notNull(),
};

// Users Table
export const users = sqliteTable("users", {
  id: genId(),
  name: text("name").notNull(),
  role: text("role").default("STUDENT").notNull(), // STUDENT, INSTRUCTOR, ADMIN
  ...timestamps,
});

// Courses Table
export const courses = sqliteTable("courses", {
  id: genId(),
  title: text("title").notNull(),
  ...timestamps,
});

// Enrollments Table
export const enrollments = sqliteTable(
  "enrollments",
  {
    id: genId(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => {
    return {
      userIdCourseIdIdx: uniqueIndex("user_id_course_id_idx").on(
        table.userId,
        table.courseId
      ),
    };
  }
);

// Posts Table
export const posts = sqliteTable("posts", {
  id: genId(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  ...timestamps,
});

// Saved Posts Table
export const savedPosts = sqliteTable(
  "saved_posts",
  {
    id: genId(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(strftime('%s', 'now'))`).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .default(sql`(strftime('%s', 'now'))`)
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp" }),
  },
  (table) => {
    return {
      userIdPostIdIdx: uniqueIndex("user_id_post_id_idx").on(
        table.userId,
        table.postId
      ),
    };
  }
);

// Likes Table
export const likes = sqliteTable(
  "likes",
  {
    id: genId(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => {
    return {
      userIdPostIdIdx: uniqueIndex("like_user_id_post_id_idx").on(
        table.userId,
        table.postId
      ),
    };
  }
);

// Comments Table
export const comments = sqliteTable("comments", {
  id: genId(),
  postId: text("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  ...timestamps,
});
