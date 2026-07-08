import { Elysia, t } from "elysia";
import { db } from "@course-platform/db";
import { users } from "@course-platform/db/src/schema";
import { eq } from "drizzle-orm";
import { PostService } from "../services/post.service";

export const postController = new Elysia({ prefix: "/api" })
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
  .get("/users", async () => {
    return await db.select().from(users);
  })
  .onBeforeHandle(({ user }) => {
    if (!user) return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  })
  .get("/me", ({ user }) => {
    return user;
  })
  .get("/posts", async ({ user, query }) => {
    // We assert user is non-null because authMiddleware ensures it via onBeforeHandle.
    const page = query.page ? parseInt(query.page) : 1;
    const pageSize = query.pageSize ? parseInt(query.pageSize) : 10;
    return await PostService.getPostsForUser(user!, page, pageSize);
  },
  {
    query: t.Object({
      page: t.Optional(t.String()),
      pageSize: t.Optional(t.String()),
    }),
  })
  .get(
    "/posts/:id",
    async ({ user, params: { id } }) => {
      const post = await PostService.getPostById(user!, id);
      if (!post) {
        return new Response(JSON.stringify({ message: "Post not found" }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      return post;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .delete(
    "/posts/:id",
    async ({ user, params: { id } }) => {
      try {
        return await PostService.deletePost(user!, id);
      } catch (err: any) {
        if (err.message.includes("Forbidden")) {
          return new Response(JSON.stringify({ message: err.message }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ message: "Internal server error" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .get(
    "/posts/:id/save-history",
    async ({ user, params: { id } }) => {
      return await PostService.getPostSaveHistory(user!.id, id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .post(
    "/posts/:id/save",
    async ({ user, params: { id } }) => {
      try {
        const result = await PostService.savePost(user!, id);
        return new Response(JSON.stringify({ success: true }), { status: result.status, headers: { 'Content-Type': 'application/json' } });
      } catch (err: any) {
        if (err.message.includes("Forbidden")) {
          return new Response(JSON.stringify({ message: err.message }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        if (err.message.includes("not found")) {
          return new Response(JSON.stringify({ message: err.message }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ message: "Internal server error" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .delete(
    "/posts/:id/save",
    async ({ user, params: { id } }) => {
      const result = await PostService.unsavePost(user!, id);
      if (result.status === 204) return new Response(null, { status: 204 });
      return new Response(JSON.stringify({ success: true }), { status: result.status, headers: { 'Content-Type': 'application/json' } });
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .get(
    "/saved-posts",
    async ({ user, query }) => {
      const page = query.page ? parseInt(query.page) : 1;
      const pageSize = query.pageSize ? parseInt(query.pageSize) : 10;
      return await PostService.getSavedPosts(user!.id, page, pageSize);
    },
    {
      query: t.Object({
        page: t.Optional(t.String()),
        pageSize: t.Optional(t.String()),
      }),
    }
  )
  .get("/courses/enrolled", async ({ user }) => {
    return await PostService.getEnrolledCourses(user!.id);
  })
  .post(
    "/posts",
    async ({ user, body }) => {
      try {
        return await PostService.createPost(user!.id, body.courseId, body.title, body.content);
      } catch (err: any) {
        if (err.message.includes("Forbidden")) {
          return new Response(JSON.stringify({ message: err.message }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ message: "Internal server error" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    },
    {
      body: t.Object({
        courseId: t.String(),
        title: t.String(),
        content: t.String(),
      }),
    }
  )
  .post(
    "/posts/:id/like",
    async ({ user, params: { id } }) => {
      return await PostService.likePost(user!.id, id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .delete(
    "/posts/:id/like",
    async ({ user, params: { id } }) => {
      return await PostService.unlikePost(user!.id, id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .get(
    "/posts/:id/comments",
    async ({ params: { id } }) => {
      return await PostService.getComments(id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .post(
    "/posts/:id/comments",
    async ({ user, params: { id }, body }) => {
      try {
        return await PostService.addComment(user!.id, id, body.content);
      } catch (err: any) {
        if (err.message.includes("Forbidden")) {
          return new Response(JSON.stringify({ message: err.message }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }
        if (err.message.includes("not found")) {
          return new Response(JSON.stringify({ message: err.message }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ message: "Internal server error" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        content: t.String(),
      }),
    }
  );
