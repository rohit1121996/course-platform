"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Bookmark, ChevronLeft, ChevronRight, Loader2, LogOut } from "lucide-react";
import { usePosts, Post, Pagination } from "@/hooks/usePosts";
import { PostCard } from "@/components/PostCard";
import { CreatePost } from "@/components/CreatePost";

export default function FeedPage() {
  const t = useTranslations("Index");
  const [page, setPage] = useState(1);
  const { data, isLoading, error, isFetching } = usePosts(page);

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
  if (error) return <div className="p-8 text-center text-red-500">Failed to load posts. Is the API running?</div>;

  const handleLogout = () => {
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
  };

  const posts: Post[] = data?.data || [];
  const pagination: Pagination = data?.pagination || { total: 0, page: 1, pageSize: 10, totalPages: 1 };

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <div className="flex items-center gap-4">
          <Link href="/saved" className="text-blue-600 hover:underline flex items-center gap-2 font-medium">
            <Bookmark className="w-5 h-5" />
            {t("viewSavedPosts")}
          </Link>
          <button 
            onClick={handleLogout} 
            className="inline-flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors w-fit"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
      
      <CreatePost />

      <div className={`space-y-6 ${isFetching ? "opacity-50" : ""}`}>
        {posts.map((post: Post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8 pt-4 border-t">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 text-gray-900 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {pagination.totalPages}
          </span>
          <button 
            disabled={page === pagination.totalPages}
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium disabled:opacity-50 text-gray-900 cursor-pointer disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </main>
  );
}
