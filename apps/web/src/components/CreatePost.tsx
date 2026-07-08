"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCreatePostMutation, useEnrolledCourses } from "@/hooks/usePosts";

export function CreatePost() {
  const t = useTranslations("Index");
  const { data: courses } = useEnrolledCourses();
  const createPostMutation = useCreatePostMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title || !content) return;

    await createPostMutation.mutateAsync({ courseId, title, content });

    // Reset form
    setCourseId("");
    setTitle("");
    setContent("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="mb-8 w-full py-4 border-2 border-dashed border-gray-300 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-100 transition-colors"
      >
        + {t("createNewPost")}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{t("createNewPost")}</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("course")}</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
            required
          >
            <option value="">{t("selectCourse")}</option>
            {courses?.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("postTitle")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white placeholder-gray-500"
            placeholder={t("postTitlePlaceholder")}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("postContent")}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] text-gray-900 bg-white placeholder-gray-500"
            placeholder={t("postContentPlaceholder")}
            required
          />
        </div>

        <div className="flex items-center gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-gray-900 bg-white hover:bg-gray-100 rounded-lg"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={createPostMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {createPostMutation.isPending ? t("publishing") : t("publish")}
          </button>
        </div>
      </div>
    </form>
  );
}
