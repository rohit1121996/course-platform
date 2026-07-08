import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { postController } from "./controllers/post.controller";

export const app = new Elysia()
  .use(cors())
  .use(swagger())
  .use(postController);

if (process.env.NODE_ENV !== "production") {
  app.listen(3001);
  console.log(
    `🦊 Elysia API is running at ${app.server?.hostname}:${app.server?.port}`
  );
}
