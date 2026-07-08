import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface Post {
  id: string;
  courseId: string;
  authorId: string;
  title: string;
  content: string;
  savesCount: number;
  hasSaved: boolean;
  likesCount: number;
  hasLiked: boolean;
  commentsCount: number;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName?: string;
  content: string;
  createdAt: string;
}

export interface SaveHistoryRecord {
  id: string;
  createdAt: string;
  deletedAt: string | null;
}

const getUserId = () => Cookies.get("userId") || "";

async function authFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }
  return res;
}

async function fetchPosts(page: number): Promise<{ data: Post[], pagination: Pagination }> {
  const res = await authFetch(`${API_URL}/posts?page=${page}`, {
    headers: { Authorization: `Bearer ${getUserId()}` },
  });
  if (!res.ok) throw new Error("Failed to fetch posts");
  return res.json();
}

async function savePost(id: string) {
  const res = await authFetch(`${API_URL}/posts/${id}/save`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getUserId()}` },
  });
  if (!res.ok) throw new Error("Failed to save post");
}

async function unsavePost(id: string) {
  const res = await authFetch(`${API_URL}/posts/${id}/save`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getUserId()}` },
  });
  if (!res.ok) throw new Error("Failed to unsave post");
}

export function usePosts(page: number = 1) {
  return useQuery({
    queryKey: ["posts", getUserId(), page],
    queryFn: () => fetchPosts(page),
    refetchInterval: 5000,
  });
}

async function fetchSavedPosts(page: number): Promise<{ data: Post[], pagination: Pagination }> {
  const res = await authFetch(`${API_URL}/saved-posts?page=${page}`, {
    headers: { Authorization: `Bearer ${getUserId()}` },
  });
  if (!res.ok) throw new Error("Failed to fetch saved posts");
  return res.json();
}

export function useSavedPosts(page: number = 1) {
  return useQuery({
    queryKey: ["savedPosts", getUserId(), page],
    queryFn: () => fetchSavedPosts(page),
    refetchInterval: 5000,
  });
}

async function fetchSaveHistory(postId: string): Promise<SaveHistoryRecord[]> {
  const res = await authFetch(`${API_URL}/posts/${postId}/save-history`, {
    headers: { Authorization: `Bearer ${getUserId()}` },
  });
  if (!res.ok) throw new Error("Failed to fetch save history");
  return res.json();
}

export function useSaveHistory(postId: string) {
  return useQuery({
    queryKey: ["saveHistory", postId, getUserId()],
    queryFn: () => fetchSaveHistory(postId),
    enabled: !!postId,
  });
}

export function useSavePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => savePost(postId),
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["savedPosts"] });
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      // Snapshot previous
      const previousPosts = queryClient.getQueryData(["posts"]);
      const previousSavedPosts = queryClient.getQueryData(["savedPosts"]);
      const previousPost = queryClient.getQueryData(["post", postId]);

      // Optimistically update
      const updateData = (old: { data: Post[] } | undefined) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((post: Post) => {
            if (post.id === postId) {
              return { ...post, hasSaved: true, savesCount: post.savesCount + 1 };
            }
            return post;
          }),
        };
      };

      queryClient.setQueriesData({ queryKey: ["posts"] }, updateData);
      queryClient.setQueriesData({ queryKey: ["savedPosts"] }, updateData);

      return { previousPosts, previousSavedPosts, previousPost };
    },
    onError: (err, postId, context) => {
      // Rollback
      if (context?.previousPosts) queryClient.setQueryData(["posts"], context.previousPosts);
      if (context?.previousSavedPosts) queryClient.setQueryData(["savedPosts"], context.previousSavedPosts);
      if (context?.previousPost) queryClient.setQueryData(["post", postId], context.previousPost);
    },
    onSettled: (data, error, postId) => {
      // Refresh to ensure sync
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["saveHistory", postId] });
    },
  });
}

export function useUnsavePostMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => unsavePost(postId),
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["savedPosts"] });
      await queryClient.cancelQueries({ queryKey: ["post", postId] });

      // Snapshot previous
      const previousPosts = queryClient.getQueryData(["posts"]);
      const previousSavedPosts = queryClient.getQueryData(["savedPosts"]);
      const previousPost = queryClient.getQueryData(["post", postId]);

      // Optimistically update
      const updateData = (old: { data: Post[] } | undefined) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((post: Post) => {
            if (post.id === postId) {
              return { ...post, hasSaved: false, savesCount: Math.max(0, post.savesCount - 1) };
            }
            return post;
          }),
        };
      };

      queryClient.setQueriesData({ queryKey: ["posts"] }, updateData);
      queryClient.setQueriesData({ queryKey: ["savedPosts"] }, updateData);

      return { previousPosts, previousSavedPosts, previousPost };
    },
    onError: (err, postId, context) => {
      // Rollback
      if (context?.previousPosts) queryClient.setQueryData(["posts"], context.previousPosts);
      if (context?.previousSavedPosts) queryClient.setQueryData(["savedPosts"], context.previousSavedPosts);
      if (context?.previousPost) queryClient.setQueryData(["post", postId], context.previousPost);
    },
    onSettled: (data, error, postId) => {
      // Refresh to ensure sync
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["saveHistory", postId] });
    },
  });
}

// --- NEW HOOKS FOR EXTENDED FORUM ---

export function useLikePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await authFetch(`${API_URL}/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getUserId()}` },
      });
      if (!res.ok) throw new Error("Failed to like post");
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["savedPosts"] });

      const updateData = (old: { data: Post[] } | undefined) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((post: Post) =>
            post.id === postId ? { ...post, hasLiked: true, likesCount: post.likesCount + 1 } : post
          ),
        };
      };

      queryClient.setQueriesData({ queryKey: ["posts"] }, updateData);
      queryClient.setQueriesData({ queryKey: ["savedPosts"] }, updateData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });
}

export function useUnlikePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await authFetch(`${API_URL}/posts/${postId}/like`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getUserId()}` },
      });
      if (!res.ok) throw new Error("Failed to unlike post");
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      await queryClient.cancelQueries({ queryKey: ["savedPosts"] });

      const updateData = (old: { data: Post[] } | undefined) => {
        if (!old || !old.data) return old;
        return {
          ...old,
          data: old.data.map((post: Post) =>
            post.id === postId ? { ...post, hasLiked: false, likesCount: Math.max(0, post.likesCount - 1) } : post
          ),
        };
      };

      queryClient.setQueriesData({ queryKey: ["posts"] }, updateData);
      queryClient.setQueriesData({ queryKey: ["savedPosts"] }, updateData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async (): Promise<Comment[]> => {
      const res = await authFetch(`${API_URL}/posts/${postId}/comments`, {
        headers: { Authorization: `Bearer ${getUserId()}` },
      });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: !!postId,
    refetchInterval: 5000,
  });
}

export function useAddCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const res = await authFetch(`${API_URL}/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getUserId()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["savedPosts"] });
    },
  });
}

export function useEnrolledCourses() {
  return useQuery({
    queryKey: ["enrolled-courses", getUserId()],
    queryFn: async (): Promise<{ id: string; title: string }[]> => {
      const res = await authFetch(`${API_URL}/courses/enrolled`, {
        headers: { Authorization: `Bearer ${getUserId()}` },
      });
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });
}

export function useCreatePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, title, content }: { courseId: string; title: string; content: string }) => {
      const res = await authFetch(`${API_URL}/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getUserId()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ courseId, title, content }),
      });
      if (!res.ok) throw new Error("Failed to create post");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user", getUserId()],
    queryFn: async (): Promise<{ id: string; name: string; role: string }> => {
      const res = await authFetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${getUserId()}` },
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
  });
}

export function useDeletePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await authFetch(`${API_URL}/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getUserId()}` },
      });
      if (!res.ok) throw new Error("Failed to delete post");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
    },
  });
}
