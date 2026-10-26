"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { IGuidePost } from "@store4riders/shared-types";
import { Clock, Calendar, ArrowRight } from "lucide-react";

interface GuideCardProps {
  post: IGuidePost;
  priority?: boolean;
}

export const GuideCard: React.FC<GuideCardProps> = ({ post, priority = false }) => {
  const formattedDate = post.publishedDate
    ? new Date(post.publishedDate).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const authorInitials =
    post.author?.name
      ?.trim()
      .split(/\s+/)
      .map((part: string) => part[0]?.toUpperCase())
      .filter(Boolean)
      .slice(0, 2)
      .join("") || "VM";

  return (
    <article className="group bg-white rounded-2xl border border-neutral-200/90 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full hover:-translate-y-1">
      {/* Featured Image */}
      <Link
        href={`/guides/post/${post.slug}`}
        className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100 block shrink-0"
      >
        <Image
          src={post.featuredImage}
          alt={post.title}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Category Pill Over Image */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-white/95 backdrop-blur-md text-neutral-900 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm border border-neutral-100">
            {post.categoryName}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 sm:p-6 flex flex-col flex-1">
        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-neutral-500 font-medium mb-2.5">
          {formattedDate && (
            <span className="flex items-center gap-1" suppressHydrationWarning>
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span suppressHydrationWarning>{formattedDate}</span>
            </span>
          )}
          {post.readingTimeMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              {post.readingTimeMinutes} min read
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-neutral-900 group-hover:text-brand transition-colors duration-200 line-clamp-2 leading-snug mb-2.5">
          <Link href={`/guides/post/${post.slug}`}>
            {post.title}
          </Link>
        </h3>

        {/* Description Excerpt */}
        <p className="text-xs sm:text-sm text-neutral-600 line-clamp-2 leading-relaxed mb-4 flex-1">
          {post.description}
        </p>

        {/* Footer: Author & Read More */}
        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            {post.author?.avatar ? (
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-slate-200 shrink-0">
                <Image
                  src={post.author.avatar}
                  alt={post.author.name || "Author"}
                  fill
                  sizes="24px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-banner/10 text-brand flex items-center justify-center text-[10px] font-black shrink-0">
                {authorInitials}
              </div>
            )}
            <span className="text-xs font-semibold text-neutral-700">
              {post.author.name}
            </span>
          </div>

          <Link
            href={`/guides/post/${post.slug}`}
            className="text-xs font-bold text-banner group-hover:text-brand flex items-center gap-1 transition-colors"
          >
            <span>Read Guide</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </article>
  );
};
