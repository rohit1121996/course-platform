import { describe, expect, test, beforeAll } from "bun:test";
import { app } from "../index";
import { db } from "@course-platform/db";
import { users, posts, courses, enrollments } from "@course-platform/db/src/schema";
import { eq } from "drizzle-orm";

describe("Post Endpoints", () => {
  let studentId: string;
  let modId: string;
  let courseId: string;
  let testPostId: string;

  beforeAll(async () => {
    // We assume the DB is seeded. We'll just grab the first student and moderator.
    const student = await db.query.users.findFirst({
      where: eq(users.role, "STUDENT")
    });
    const mod = await db.query.users.findFirst({
      where: eq(users.role, "MODERATOR")
    });
    const course = await db.query.courses.findFirst();

    if (!student || !mod || !course) {
      throw new Error("Database must be seeded before running tests");
    }

    studentId = student.id;
    modId = mod.id;
    courseId = course.id;

    // Enroll the student in the course
    await db.insert(enrollments).values({
      userId: studentId,
      courseId: courseId,
    }).onConflictDoNothing();
  });

  test("GET /api/posts - Should return 401 without auth", async () => {
    const req = new Request("http://localhost/api/posts");
    const res = await app.handle(req);
    expect(res.status).toBe(401);
  });

  test("GET /api/posts - Should work with valid auth", async () => {
    const req = new Request("http://localhost/api/posts", {
      headers: { Authorization: `Bearer ${studentId}` },
    });
    const res = await app.handle(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("POST /api/posts - Create a post", async () => {
    const req = new Request("http://localhost/api/posts", {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${studentId}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        courseId,
        title: "Test Post from Bun",
        content: "This is a test post content",
      }),
    });
    const res = await app.handle(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe("Test Post from Bun");
    testPostId = body.id;
  });

  test("POST /api/posts/:id/save - Save a post", async () => {
    const req = new Request(`http://localhost/api/posts/${testPostId}/save`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentId}` },
    });
    const res = await app.handle(req);
    // 201 Created or 200 OK (if already saved)
    expect([200, 201]).toContain(res.status);
  });

  test("DELETE /api/posts/:id/save - Unsave a post", async () => {
    const req = new Request(`http://localhost/api/posts/${testPostId}/save`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${studentId}` },
    });
    const res = await app.handle(req);
    // 200 OK or 204 No Content
    expect([200, 204]).toContain(res.status);
  });
});
