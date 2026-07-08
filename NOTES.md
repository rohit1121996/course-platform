# Staff Engineer Take-Home Assessment: Saved Posts Feature

## 1. Architecture Overview
This project uses a clean Monorepo structure, separating the frontend (Next.js 19, React 19) from the backend API (Elysia.js, Bun/Node) and a shared database package (Drizzle ORM). 

- **Frontend**: Handles UI, caching, and optimistic updates via React Query v5. 
- **Backend**: Exposes RESTful endpoints with Zod validation. It validates authentication via a mocked `Bearer <token>` middleware.
- **Database**: PostgreSQL schema containing soft-delete mechanisms (`deletedAt`) to preserve user history and allow idempotent saves.

## 2. Folder Structure
- `apps/web`: Next.js App Router frontend application.
- `apps/api`: Elysia backend application providing the REST API.
- `packages/db`: Drizzle ORM schemas, migrations, and seed scripts.
- `packages/shared`: Shared types and logic.

## 3. Database Schema & Trade-offs
### Schema Design
- `users`, `courses`, `enrollments`, `posts`.
- `saved_posts`: Contains a `deletedAt` column for soft deletes, and a unique composite index on `(userId, postId)`.

### Why Soft Delete instead of Hard Delete?
1. **Analytics & History**: Business typically wants to know user behavior (e.g., how often users change their minds). A hard delete destroys this data.
2. **Concurrency & Idempotency**: By using a unique constraint on `(userId, postId)` and an `onConflictDoUpdate` strategy, we prevent duplicate rows and race conditions. If a user spam-clicks "Save", the database safely upserts the row.

### Alternative Designs
An alternative would be an event-sourced `post_events` table (Save/Unsave events) and a materialized view for current state. While excellent for analytics, it adds significant complexity. The soft-delete approach provides a good balance of simplicity and data preservation for this specific use case.

## 4. Authorization Strategy
Authorization is implemented in a middleware layer. 
- Students can only view posts from courses they are enrolled in.
- This is enforced in the `PostService.getPostsForUser` by doing an initial lookup of enrolled courses.
- The `savePost` endpoint verifies enrollment before allowing a save.

## 5. Performance & Query Optimization
- **N+1 Problem**: Fetching `hasSaved` and `savesCount` on a list of posts can easily trigger N+1 queries. To solve this, we use a single query with a `LEFT JOIN` and a `GROUP BY` subquery to aggregate the counts in one pass.

## 6. Frontend: Optimistic Updates & React Query
When a user clicks "Save", we immediately update the local React Query cache to reflect `hasSaved = true` and `savesCount += 1`. This provides instant feedback. If the API request fails, React Query's `onMutate` pattern rolls back the cache to the previous state.

### Potential Race Conditions
If a user clicks Save and Unsave in rapid succession on poor network connections, the server could process them out of order. React Query's optimistic updates help, but the backend's idempotency ensures the final state will match the last successfully processed request.

## 7. Internationalization (i18n)
We use basic next-intl or a custom dictionary approach for pluralization (e.g., "1 saved post" vs "2 saved posts").

## 8. Testing Strategy
- **Unit Tests**: Test the DB service layers for correct logic (soft delete behavior).
- **API Tests**: Test Elysia endpoints (Unauthorized, Save, Unsave).
- **Frontend Integration**: Test React Query hooks and components for correct optimistic updates.

## 9. Future Improvements
- Implement a real JWT-based authentication system.
- Add Redis for caching the `savesCount` if reads scale to millions of users, avoiding heavy `GROUP BY` operations on the DB.
- Use Cursor-based pagination instead of Offset-based pagination for `saved-posts` to improve performance on large datasets.

## 10. How to Run
1. Install dependencies: `npm install`
2. Run database migrations and seed: `npm run db:push` && `npm run db:seed`
3. Start the API: `npm run dev:api`
4. Start the Web: `npm run dev:web`
