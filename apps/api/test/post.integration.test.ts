import { describe, it, expect, beforeAll } from 'vitest';
import { Elysia } from 'elysia';
import { postController } from '../src/controllers/post.controller';
import { db } from '@course-platform/db';
import { users } from '@course-platform/db/src/schema';

describe('Post API Integration', () => {
  const app = new Elysia().use(postController);
  let testUserId = "";

  beforeAll(async () => {
    // Get the moderator to test bypassing enrollments
    const allUsers = await db.select().from(users);
    const mod = allUsers.find(u => u.role === 'MODERATOR');
    if (mod) testUserId = mod.id;
  });

  it('should return 401 Unauthorized if no bearer token is provided', async () => {
    const response = await app.handle(new Request('http://localhost/api/posts'));
    expect(response.status).toBe(401);
  });

  it('should return posts for a valid user', async () => {
    expect(testUserId).not.toBe("");
    const response = await app.handle(
      new Request('http://localhost/api/posts', {
        headers: {
          Authorization: `Bearer ${testUserId}`,
        },
      })
    );
    
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    if (body.data.length > 0) {
      expect(body.data[0]).toHaveProperty('id');
      expect(body.data[0]).toHaveProperty('title');
      expect(body.data[0]).toHaveProperty('content');
    }
  });
});
