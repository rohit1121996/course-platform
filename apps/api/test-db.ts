import { db } from "@course-platform/db";
import { users } from "@course-platform/db/src/schema";
import { eq } from "drizzle-orm";

async function run() {
  const [user] = await db.select().from(users).where(eq(users.id, "6878bc42-10d2-4636-8957-2852b60a348e"));
  console.log("Found user:", user);
}
run();
