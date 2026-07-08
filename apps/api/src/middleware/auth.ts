import { Elysia } from "elysia";
import { db } from "@course-platform/db";
import { users } from "@course-platform/db/src/schema";
import { eq } from "drizzle-orm";

export const authMiddleware = new Elysia({ name: 'auth' })
  .derive(async ({ request }) => {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null };
    }
    const userId = authHeader.split(" ")[1];
    if (!userId) {
      return { user: null };
    }
    const [found] = await db.select().from(users).where(eq(users.id, userId));
    return { user: found || null };
  })
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { message: "Unauthorized" };
    }
  });
