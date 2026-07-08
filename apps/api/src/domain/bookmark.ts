/**
 * Core business logic for Bookmarks (Saved Posts).
 * These are pure functions designed to be easily testable without a database.
 */

export type SaveAction = 'insert' | 'noop';

/**
 * Determines whether a user's save request should result in a new database insert or if it is a no-op.
 * @param activeSavesCount The number of currently active saves for this user and post.
 * @returns The action to take: 'insert' if a new record should be created, 'noop' if the post is already saved.
 */
export function determineSaveAction(activeSavesCount: number): SaveAction {
  if (activeSavesCount > 0) {
    return 'noop'; // Idempotent: already saved
  }
  return 'insert';
}

export type UnsaveAction = 'soft_delete' | 'noop';

/**
 * Determines whether a user's unsave request should result in soft deletion or if it is a no-op.
 * @param activeSavesCount The number of currently active saves for this user and post.
 * @returns The action to take: 'soft_delete' if there is an active save to delete, 'noop' if it's already unsaved.
 */
export function determineUnsaveAction(activeSavesCount: number): UnsaveAction {
  if (activeSavesCount > 0) {
    return 'soft_delete';
  }
  return 'noop';
}

/**
 * Calculates the net number of active saves for a post.
 * (In our current system, the database handles this via COUNT(id) WHERE deleted_at IS NULL,
 * but this function exists to demonstrate testable domain logic for aggregations if needed).
 */
export function calculateNetSaves(totalSaves: number, totalUnsaves: number): number {
  return Math.max(0, totalSaves - totalUnsaves);
}
