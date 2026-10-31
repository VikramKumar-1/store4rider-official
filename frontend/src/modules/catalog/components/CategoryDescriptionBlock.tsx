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
        className="prose prose-neutral max-w-none text-[15px] sm:text-[16px] leading-[1.65] font-sans prose-headings:font-heading prose-headings:font-semibold prose-headings:text-neutral-900 prose-h1:text-[22px] sm:prose-h1:text-[28px] prose-h2:text-[19px] sm:prose-h2:text-[22px] prose-h3:text-[17px] sm:prose-h3:text-[19px] prose-p:text-neutral-700 prose-p:text-[15px] sm:prose-p:text-[16px] prose-p:leading-[1.65] prose-p:my-2 prose-ul:my-2.5 prose-li:my-0.5 prose-strong:text-neutral-900 prose-strong:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-800 prose-a:underline prose-a:font-medium prose-table:w-full prose-table:border-collapse prose-th:font-heading prose-th:font-medium prose-th:text-[13px] sm:prose-th:text-[14px] prose-th:border prose-th:border-neutral-200 prose-th:bg-neutral-50 prose-th:p-2.5 prose-td:font-sans prose-td:text-[13px] sm:prose-td:text-[14px] prose-td:border prose-td:border-neutral-200 prose-td:p-2.5 prose-img:rounded-md prose-img:shadow-sm overflow-x-auto transition-all duration-300"
        dangerouslySetInnerHTML={{ __html: cleanedDescription }}
      />
    </article>
  );
}
