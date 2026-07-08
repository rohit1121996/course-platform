import { db } from "./index";
import { users, courses, enrollments, posts, savedPosts, likes, comments } from "./schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Clean existing data (explicitly in reverse dependency order)
  await db.delete(savedPosts);
  await db.delete(likes);
  await db.delete(comments);
  await db.delete(posts);
  await db.delete(enrollments);
  await db.delete(users);
  await db.delete(courses);

  // 1. Create 4 Students
  console.log("Creating students...");
  const createdUsers = await db.insert(users).values([
    { name: "Alice Student", role: "STUDENT" },
    { name: "Bob Learner", role: "STUDENT" },
    { name: "Charlie Scholar", role: "STUDENT" },
    { name: "Diana Freshman", role: "STUDENT" },
    { name: "Eve Instructor", role: "MODERATOR" },
    { name: "Moderator Mike", role: "MODERATOR" },
  ]).returning();

  const students = createdUsers.slice(0, 4);
  const instructor = createdUsers[4];

  // 2. Create 2 Courses
  console.log("Creating courses...");
  const createdCourses = await db.insert(courses).values([
    { title: "Advanced Next.js Architecture" },
    { title: "PostgreSQL Database Design" },
  ]).returning();

  // 3. Create Enrollments
  console.log("Enrolling students...");
  // Alice & Bob in Course 1, Charlie & Diana in Course 2, Alice also in Course 2
  await db.insert(enrollments).values([
    { userId: students[0].id, courseId: createdCourses[0].id },
    { userId: students[1].id, courseId: createdCourses[0].id },
    { userId: students[2].id, courseId: createdCourses[1].id },
    { userId: students[3].id, courseId: createdCourses[1].id },
    { userId: students[0].id, courseId: createdCourses[1].id },
  ]);

  // 4. Create 15 Posts
  console.log("Creating posts...");
  const postValues = [];
  for (let i = 1; i <= 8; i++) {
    postValues.push({
      courseId: createdCourses[0].id,
      authorId: instructor.id,
      title: `Next.js Topic ${i}`,
      content: `This is the content for Next.js topic ${i}. Let's discuss!`,
    });
  }
  for (let i = 1; i <= 7; i++) {
    postValues.push({
      courseId: createdCourses[1].id,
      authorId: instructor.id,
      title: `PostgreSQL Topic ${i}`,
      content: `This is the content for PostgreSQL topic ${i}. Let's discuss!`,
    });
  }
  const createdPosts = await db.insert(posts).values(postValues).returning();

  // 5. Create Saved Posts
  console.log("Saving some posts...");
  // Alice saves first 2 posts in Course 1
  await db.insert(savedPosts).values([
    { userId: students[0].id, postId: createdPosts[0].id },
    { userId: students[0].id, postId: createdPosts[1].id },
    // Alice saved and then unsaved the 3rd post (soft delete example)
    { userId: students[0].id, postId: createdPosts[2].id, deletedAt: new Date() },

    // Bob saves a post
    { userId: students[1].id, postId: createdPosts[0].id },
  ]);

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
