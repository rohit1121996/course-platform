"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, ArrowLeft, LogOut } from "lucide-react";
import { useSavedPosts, Post, Pagination } from "@/hooks/usePosts";
import { PostCard } from "@/components/PostCard";

export default function SavedPostsPage() {
  const t = useTranslations("Index");
  const [page, setPage] = useState(1);
  const { data, isLoading, error, isFetching } = useSavedPosts(page);

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
  if (error) return <div className="p-8 text-center text-red-500">{t("errorLoadingSavedPosts")}</div>;

  const posts: Post[] = data?.data || [];
  const pagination: Pagination = data?.pagination || { total: 0, page: 1, pageSize: 10, totalPages: 1 };

  const handleLogout = () => {
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/login";
  };

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="flex flex-col mb-8 gap-4">
        <div className="flex items-center justify-between">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToFeed")}
          </Link>
          <button 
            onClick={handleLogout} 
            className="inline-flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors w-fit"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
        <h1 className="text-3xl font-bold">{t("savedPosts")}</h1>
      </div>
      
      {posts.length === 0 ? (
        <div className="text-center text-gray-500 py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          {t("noSavedPosts")}
        </div>
      ) : (
        <>
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
        </>
      )}
    </main>
  );
}
