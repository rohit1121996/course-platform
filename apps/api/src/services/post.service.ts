import { db } from "@course-platform/db";
import { posts, savedPosts, enrollments, likes, comments, courses, users } from "@course-platform/db/src/schema";
import { determineSaveAction, determineUnsaveAction } from "../domain/bookmark";
import { eq, and, sql, isNull, inArray, desc } from "drizzle-orm";

export class PostService {
  /**
   * Fetch all posts from courses the user is enrolled in.
   * Includes hasSaved and savesCount.
   * If user is MODERATOR, show all posts.
   */
  static async getPostsForUser(user: typeof users.$inferSelect, page: number = 1, pageSize: number = 10) {
    const userId = user.id;
    const offset = (page - 1) * pageSize;

    // 1. Get user's enrolled courses
    const userEnrollments = await db
      .select({ courseId: enrollments.courseId })
      .from(enrollments)
      .where(eq(enrollments.userId, userId));

    const courseIds = userEnrollments.map((e) => e.courseId);

    // If student has no enrollments and is not moderator, return empty
    if (courseIds.length === 0 && user.role !== "MODERATOR") return { data: [], pagination: { total: 0, page, pageSize, totalPages: 0 } };

    // 2. Fetch posts, checking if the current user has saved it, and getting total saves
    // We use a subquery to count saves
    // Subqueries for likes and comments
    const savesCountSq = db
      .select({
        postId: savedPosts.postId,
        saves_count: sql<number>`cast(count(${savedPosts.id}) as int)`.as('saves_count')
      })
      .from(savedPosts)
      .where(isNull(savedPosts.deletedAt))
      .groupBy(savedPosts.postId)
      .as("saves_sq");

    const likesCountSq = db
      .select({
        postId: likes.postId,
        likes_count: sql<number>`cast(count(${likes.id}) as int)`.as('likes_count')
      })
      .from(likes)
      .groupBy(likes.postId)
      .as("likes_sq");

    const commentsCountSq = db
      .select({
        postId: comments.postId,
        comments_count: sql<number>`cast(count(${comments.id}) as int)`.as('comments_count')
      })
      .from(comments)
      .groupBy(comments.postId)
      .as("comments_sq");

    const results = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        courseId: posts.courseId,
        authorId: posts.authorId,
        createdAt: posts.createdAt,
        savesCount: sql<number>`coalesce(${savesCountSq.saves_count}, 0)`,
        likesCount: sql<number>`coalesce(${likesCountSq.likes_count}, 0)`,
        commentsCount: sql<number>`coalesce(${commentsCountSq.comments_count}, 0)`,
        hasSaved: sql<boolean>`EXISTS (
          SELECT 1 FROM saved_posts sp 
          WHERE sp.post_id = ${posts.id} 
          AND sp.user_id = ${userId} 
          AND sp.deleted_at IS NULL
        )`,
        hasLiked: sql<boolean>`EXISTS (
          SELECT 1 FROM likes l 
          WHERE l.post_id = ${posts.id} 
          AND l.user_id = ${userId}
        )`
      })
      .from(posts)
      .leftJoin(savesCountSq, eq(posts.id, savesCountSq.postId))
      .leftJoin(likesCountSq, eq(posts.id, likesCountSq.postId))
      .leftJoin(commentsCountSq, eq(posts.id, commentsCountSq.postId))
      .where(
        user.role === "MODERATOR"
          ? sql`1=1`
          : inArray(posts.courseId, courseIds)
      )
      .orderBy(desc(posts.createdAt))
      .limit(pageSize)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql<number>`cast(count(${posts.id}) as int)` })
      .from(posts)
      .where(
        user.role === "MODERATOR"
          ? sql`1=1`
          : inArray(posts.courseId, courseIds)
      );

    return {
      data: results,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  static async getPostById(user: typeof users.$inferSelect, postId: string) {
    // 1. Get user's enrolled courses
    const userEnrollments = await db
      .select({ courseId: enrollments.courseId })
      .from(enrollments)
      .where(eq(enrollments.userId, user.id));

    const courseIds = userEnrollments.map((e) => e.courseId);

    // If student has no enrollments and is not moderator, return empty
    if (courseIds.length === 0 && user.role !== "MODERATOR") return null;

    const savesCountSq = db
      .select({
        postId: savedPosts.postId,
        saves_count: sql<number>`cast(count(${savedPosts.id}) as int)`.as('saves_count')
      })
      .from(savedPosts)
      .where(isNull(savedPosts.deletedAt))
      .groupBy(savedPosts.postId)
      .as("saves_sq");

    const likesCountSq = db
      .select({
        postId: likes.postId,
        likes_count: sql<number>`cast(count(${likes.id}) as int)`.as('likes_count')
      })
      .from(likes)
      .groupBy(likes.postId)
      .as("likes_sq");

    const commentsCountSq = db
      .select({
        postId: comments.postId,
        comments_count: sql<number>`cast(count(${comments.id}) as int)`.as('comments_count')
      })
      .from(comments)
      .groupBy(comments.postId)
      .as("comments_sq");

    const [post] = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        courseId: posts.courseId,
        authorId: posts.authorId,
        createdAt: posts.createdAt,
        savesCount: sql<number>`coalesce(${savesCountSq.saves_count}, 0)`,
        likesCount: sql<number>`coalesce(${likesCountSq.likes_count}, 0)`,
        commentsCount: sql<number>`coalesce(${commentsCountSq.comments_count}, 0)`,
        hasSaved: sql<boolean>`EXISTS (
          SELECT 1 FROM saved_posts sp 
          WHERE sp.post_id = ${posts.id} 
          AND sp.user_id = ${user.id} 
          AND sp.deleted_at IS NULL
        )`,
        hasLiked: sql<boolean>`EXISTS (
          SELECT 1 FROM likes l 
          WHERE l.post_id = ${posts.id} 
          AND l.user_id = ${user.id}
        )`
      })
      .from(posts)
      .leftJoin(savesCountSq, eq(posts.id, savesCountSq.postId))
      .leftJoin(likesCountSq, eq(posts.id, likesCountSq.postId))
      .leftJoin(commentsCountSq, eq(posts.id, commentsCountSq.postId))
      .where(
        and(
          eq(posts.id, postId),
          user.role === "MODERATOR"
            ? sql`1=1`
            : inArray(posts.courseId, courseIds)
        )
      );

    return post || null;
  }

  static async getPostSaveHistory(userId: string, postId: string) {
    const history = await db
      .select({
        id: savedPosts.id,
        createdAt: savedPosts.createdAt,
        deletedAt: savedPosts.deletedAt,
      })
      .from(savedPosts)
      .where(
        and(
          eq(savedPosts.userId, userId),
          eq(savedPosts.postId, postId)
        )
      )
      .orderBy(desc(savedPosts.createdAt));

    return history;
  }

  static async deletePost(user: typeof users.$inferSelect, postId: string) {
    if (user.role !== "MODERATOR") {
      throw new Error("Forbidden: Only moderators can delete posts");
    }
    
    // Cascades take care of likes, comments, and saved_posts.
    await db.delete(posts).where(eq(posts.id, postId));
    
    return { success: true };
  }

  /**
   * Save a post (Idempotent: uses upsert)
   */
  static async savePost(user: typeof users.$inferSelect, postId: string) {
    const userId = user.id;
    // First, verify the user is enrolled in the course this post belongs to
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });

    if (!post) throw new Error("Post not found");

    if (user.role !== "MODERATOR") {
      const enrollment = await db.query.enrollments.findFirst({
        where: and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, post.courseId)
        )
      });

      if (!enrollment) throw new Error("Forbidden: Not enrolled in course");
    }

    // Atomic upsert for idempotency and concurrency
    await db.insert(savedPosts)
      .values({
        userId,
        postId,
        deletedAt: null
      })
      .onConflictDoUpdate({
        target: [savedPosts.userId, savedPosts.postId],
        set: {
          deletedAt: null,
          updatedAt: new Date()
        }
      });

    return { status: 200 };
  }

  /**
   * Unsave a post (Idempotent: soft deletes via deletedAt)
   */
  static async unsavePost(user: typeof users.$inferSelect, postId: string) {
    const userId = user.id;

    // Atomic update for idempotency and concurrency
    const result = await db.update(savedPosts)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(savedPosts.userId, userId),
          eq(savedPosts.postId, postId),
          isNull(savedPosts.deletedAt)
        )
      )
      .returning({ id: savedPosts.id });

    if (result.length > 0) {
      return { status: 200 };
    }

    return { status: 204 };
  }

  /**
   * Get a paginated list of ONLY the posts the user has saved.
   */
  static async getSavedPosts(userId: string, page: number = 1, pageSize: number = 20) {
    const offset = (page - 1) * pageSize;

    const savesCountSq = db
      .select({
        postId: savedPosts.postId,
        saves_count: sql<number>`cast(count(${savedPosts.id}) as int)`.as('saves_count')
      })
      .from(savedPosts)
      .where(isNull(savedPosts.deletedAt))
      .groupBy(savedPosts.postId)
      .as("saves_sq");

    const likesCountSq = db
      .select({
        postId: likes.postId,
        likes_count: sql<number>`cast(count(${likes.id}) as int)`.as('likes_count')
      })
      .from(likes)
      .groupBy(likes.postId)
      .as("likes_sq");

    const commentsCountSq = db
      .select({
        postId: comments.postId,
        comments_count: sql<number>`cast(count(${comments.id}) as int)`.as('comments_count')
      })
      .from(comments)
      .groupBy(comments.postId)
      .as("comments_sq");

    // Fetch the posts
    const results = await db
      .select({
        id: posts.id,
        title: posts.title,
        content: posts.content,
        courseId: posts.courseId,
        authorId: posts.authorId,
        createdAt: posts.createdAt,
        savedAt: savedPosts.createdAt,
        savesCount: sql<number>`coalesce(${savesCountSq.saves_count}, 0)`,
        likesCount: sql<number>`coalesce(${likesCountSq.likes_count}, 0)`,
        commentsCount: sql<number>`coalesce(${commentsCountSq.comments_count}, 0)`,
        hasSaved: sql<boolean>`true`, // Always true here since these are saved posts
        hasLiked: sql<boolean>`EXISTS (
          SELECT 1 FROM likes l 
          WHERE l.post_id = ${posts.id} 
          AND l.user_id = ${userId}
        )`
      })
      .from(posts)
      .innerJoin(savedPosts, eq(posts.id, savedPosts.postId))
      .leftJoin(savesCountSq, eq(posts.id, savesCountSq.postId))
      .leftJoin(likesCountSq, eq(posts.id, likesCountSq.postId))
      .leftJoin(commentsCountSq, eq(posts.id, commentsCountSq.postId))
      .where(
        and(
          eq(savedPosts.userId, userId),
          isNull(savedPosts.deletedAt)
        )
      )
      .orderBy(desc(savedPosts.createdAt))
      .limit(pageSize)
      .offset(offset);
      
    // Count total for pagination
    const [{ total }] = await db
      .select({ total: sql<number>`cast(count(${savedPosts.id}) as int)` })
      .from(savedPosts)
      .where(
        and(
          eq(savedPosts.userId, userId),
          isNull(savedPosts.deletedAt)
        )
      );

    return {
      data: results,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  static async createPost(userId: string, courseId: string, title: string, content: string) {
    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, courseId)
      )
    });
    if (!enrollment) throw new Error("Forbidden: Not enrolled in course");

    const [post] = await db.insert(posts).values({
      authorId: userId,
      courseId,
      title,
      content,
    }).returning();
    return post;
  }

  static async likePost(userId: string, postId: string) {
    await db.insert(likes).values({
      userId,
      postId,
    }).onConflictDoNothing();
    return { success: true };
  }

  static async unlikePost(userId: string, postId: string) {
    await db.delete(likes).where(
      and(
        eq(likes.userId, userId),
        eq(likes.postId, postId)
      )
    );
    return { success: true };
  }

  static async getComments(postId: string) {
    const results = await db.select({
      id: comments.id,
      postId: comments.postId,
      authorId: comments.authorId,
      authorName: users.name,
      content: comments.content,
      createdAt: comments.createdAt,
    }).from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
    return results;
  }

  static async addComment(userId: string, postId: string, content: string) {
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
    });
    if (!post) throw new Error("Post not found");

    const enrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.courseId, post.courseId)
      )
    });
    if (!enrollment) throw new Error("Forbidden: Not enrolled in course");

    const [comment] = await db.insert(comments).values({
      authorId: userId,
      postId,
      content,
    }).returning();
    return comment;
  }

  static async getEnrolledCourses(userId: string) {
    const results = await db
      .select({
        id: courses.id,
        title: courses.title
      })
      .from(courses)
      .innerJoin(enrollments, eq(courses.id, enrollments.courseId))
      .where(eq(enrollments.userId, userId));
      
    return results;
  }
}
