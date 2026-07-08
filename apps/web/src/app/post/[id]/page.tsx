"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { PostCard } from "@/components/PostCard";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { Post, useSaveHistory } from "@/hooks/usePosts";
import Cookies from "js-cookie";

export default function PostPage() {
  const t = useTranslations("Index");
  const params = useParams();
  const postId = params.id as string;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const token = mounted ? Cookies.get("userId") : undefined;

  const { data: post, isLoading, error } = useQuery<Post>({
    queryKey: ["post", postId],
    queryFn: async () => {
      const res = await fetch(`http://localhost:3001/api/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error("Failed to fetch post");
      }
      return res.json();
    },
    enabled: !!token && !!postId,
    refetchInterval: 5000,
  });

  const { data: saveHistory, isLoading: isLoadingHistory } = useSaveHistory(postId);

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div className="space-y-6">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("backToFeed")}
        </Link>

        {!mounted || isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error || !post ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">
          <p className="font-medium">{t("postNotFound")}</p>
        </div>
      ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <PostCard post={post} initialShowComments={true} />
            </div>
            
            {saveHistory && saveHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6 mt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t("saveHistory")}</h3>
                <div className="space-y-4">
                  {saveHistory.map((record) => (
                    <div key={record.id} className="border-l-2 border-blue-200 pl-4 py-1">
                      <div className="text-sm text-gray-800">
                        <span className="font-medium">{t("savedOn")}:</span>{' '}
                        <span suppressHydrationWarning>{new Date(record.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      {record.deletedAt ? (
                        <div className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">{t("unsavedOn")}:</span>{' '}
                          <span suppressHydrationWarning>{new Date(record.deletedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      ) : (
                        <div className="text-sm text-green-600 font-medium mt-1">
                          {t("currentlyActive")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
