"use client";

import { useState } from "react";
import { Bookmark, Heart, MessageSquare, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { 
  Post, 
  useSavePostMutation, 
  useUnsavePostMutation,
  useLikePostMutation,
  useUnlikePostMutation,
  useComments,
  useAddCommentMutation,
  useCurrentUser,
  useDeletePostMutation
} from "@/hooks/usePosts";

import Link from "next/link";

export function PostCard({ post, initialShowComments = false }: { post: Post, initialShowComments?: boolean }) {
  const t = useTranslations("Index");
  
  const saveMutation = useSavePostMutation();
  const unsaveMutation = useUnsavePostMutation();
  const likeMutation = useLikePostMutation();
  const unlikeMutation = useUnlikePostMutation();
  const addCommentMutation = useAddCommentMutation();
  const deleteMutation = useDeletePostMutation();

  const { data: user } = useCurrentUser();
  const isModerator = user?.role === "MODERATOR";

  const [showComments, setShowComments] = useState(initialShowComments);
  const [commentContent, setCommentContent] = useState("");

  const { data: comments, isLoading: isLoadingComments } = useComments(showComments ? post.id : "");

  const handleSaveToggle = () => {
    if (post.hasSaved) {
      unsaveMutation.mutate(post.id);
    } else {
      saveMutation.mutate(post.id);
    }
  };

  const handleLikeToggle = () => {
    if (post.hasLiked) {
      unlikeMutation.mutate(post.id);
    } else {
      likeMutation.mutate(post.id);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    await addCommentMutation.mutateAsync({ postId: post.id, content: commentContent });
    setCommentContent("");
  };

  const date = new Date(post.createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <article className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <header className="mb-4 flex justify-between items-start">
        <Link href={`/post/${post.id}`} className="hover:opacity-80 transition-opacity block flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{post.title}</h2>
          <div className="text-sm text-gray-500" suppressHydrationWarning>
            Course ID: {post.courseId} • {date}
          </div>
        </Link>
        {isModerator && (
          <button 
            onClick={() => {
              if (confirm(t("confirmDelete"))) {
                deleteMutation.mutate(post.id);
              }
            }}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            title={t("deletePost")}
          >
            <Trash2 className="w-4 h-4" />
            {deleteMutation.isPending ? t("deleting") : t("delete")}
          </button>
        )}
      </header>
      
      <Link href={`/post/${post.id}`} className="block">
        <p className="text-gray-700 mb-6 whitespace-pre-line leading-relaxed hover:opacity-80 transition-opacity">
          {post.content}
        </p>
      </Link>
      
      <footer className="flex items-center gap-6 border-t pt-4">
        {/* Like Button */}
        <button 
          onClick={handleLikeToggle}
          disabled={likeMutation.isPending || unlikeMutation.isPending}
          className={`flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
            post.hasLiked ? "text-red-500 hover:text-red-600" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Heart className={`w-5 h-5 ${post.hasLiked ? "fill-current" : ""}`} />
          {t("likesCount", { count: post.likesCount })}
        </button>

        {/* Comment Button */}
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <MessageSquare className="w-5 h-5" />
          {t("commentsCount", { count: post.commentsCount })}
        </button>

        {/* Save Button */}
        <button 
          onClick={handleSaveToggle}
          disabled={saveMutation.isPending || unsaveMutation.isPending}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ml-auto cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
            post.hasSaved ? "text-blue-600 hover:text-blue-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Bookmark className={`w-5 h-5 ${post.hasSaved ? "fill-current" : ""}`} />
          {post.hasSaved ? t("saved") : t("save")} 
          <span className="text-xs ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {post.savesCount}
          </span>
        </button>
      </footer>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-6 border-t pt-4 bg-gray-50 -mx-6 px-6 -mb-6 pb-6 rounded-b-xl">
          <h3 className="font-semibold text-gray-800 mb-4">{t("comments")}</h3>
          
          <div className="space-y-4 mb-4">
            {isLoadingComments ? (
              <div className="text-sm text-gray-500">{t("loadingComments")}</div>
            ) : comments?.length === 0 ? (
              <div className="text-sm text-gray-500">{t("noComments")}</div>
            ) : (
              comments?.map(comment => {
                const initial = comment.authorName ? comment.authorName.charAt(0).toUpperCase() : "?";
                
                return (
                  <div key={comment.id} className="bg-white p-4 rounded-xl border border-gray-100 flex gap-3 shadow-sm">
                    {/* Avatar */}
                    <div className="w-8 h-8 flex-shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                      {initial}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{comment.authorName || "Unknown User"}</span>
                        <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input 
              type="text"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder={t("writeComment")}
              className="flex-1 p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white placeholder-gray-500"
            />
            <button 
              type="submit"
              disabled={!commentContent.trim() || addCommentMutation.isPending}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {t("post")}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
