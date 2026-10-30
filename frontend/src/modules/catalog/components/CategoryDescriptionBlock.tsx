"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { cleanRichContent, handleRichTextClick } from "@/core/utils/cleanRichContent";

export function CategoryDescriptionBlock({
  description,
  pageTitle,
  disableToggle = true,
}: {
  description?: string;
  pageTitle?: string;
  disableToggle?: boolean;
}) {
  const router = useRouter();

  const cleanedDescription = useMemo(() => {
    return cleanRichContent(description || "");
  }, [description]);

  if (!cleanedDescription) {
    return null;
  }

  return (
    <article className="w-full relative py-1">
      <div
        onClick={(e) => handleRichTextClick(e, router)}
        className="prose prose-sm max-w-none prose-neutral text-[12px] sm:text-[13px] leading-relaxed prose-headings:text-[14px] sm:prose-headings:text-[15px] prose-headings:font-bold prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-p:mt-0 prose-p:mb-2 prose-ul:mt-0 prose-ul:mb-2 prose-li:my-0 prose-strong:text-neutral-900 prose-a:text-brand prose-a:no-underline hover:prose-a:underline prose-table:w-full prose-table:table-fixed prose-table:border-collapse prose-th:border prose-th:border-neutral-200 prose-th:bg-neutral-50 prose-th:p-2 prose-td:border prose-td:border-neutral-200 prose-td:p-2 prose-img:rounded-md prose-img:shadow-sm transition-all duration-300 font-sans"
        dangerouslySetInnerHTML={{ __html: cleanedDescription }}
      />
    </article>
  );
}
