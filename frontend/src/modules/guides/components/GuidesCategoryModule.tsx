"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import {
  getCategoryBySlug,
  getGuidesByCategory,
  GUIDE_CATEGORIES,
} from "../data/guides-data";
import { GuideCard } from "./GuideCard";
import { GuideAuthorCard } from "./GuideAuthorCard";

interface GuidesCategoryModuleProps {
  categorySlug: string;
}

export const GuidesCategoryModule: React.FC<GuidesCategoryModuleProps> = ({
  categorySlug,
}) => {
  const category = getCategoryBySlug(categorySlug);
  const posts = getGuidesByCategory(categorySlug);

  if (!category) {
    notFound();
  }
  return (
    <div className="min-h-screen bg-neutral-50/60 pb-20">

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Guides", href: "/guides" },
          { label: category.name },
        ]}
      />

      {/* Header Banner */}
      <header className="bg-gradient-to-b from-neutral-100/70 via-white to-neutral-50/50 border-b border-neutral-200/80 py-10 sm:py-14">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-2 h-2 rounded-full bg-brand shadow-xs" />
              <span className="text-xs font-black uppercase tracking-widest text-brand">
                {category.name} Guides & Manuals
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-xs font-medium text-neutral-500">
                Store4Riders Editorial
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-sans font-black tracking-tight text-neutral-900 mb-3">
              {category.name}
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-6">
              {category.description}
            </p>

            <span className="inline-block text-xs font-bold px-3 py-1.5 bg-neutral-100 text-neutral-700 border border-neutral-200 rounded-lg">
              {posts.length} {posts.length === 1 ? "Guide" : "Guides"} Available
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 scrollbar-none mb-6">
          <Link
            href="/guides"
            className="px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
          >
            All Guides
          </Link>

          {GUIDE_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/guides/category/${cat.slug}`}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                cat.slug === category.slug
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {posts.map((post, idx) => (
            <GuideCard key={post.slug} post={post} priority={idx < 3} />
          ))}
        </div>

        {/* Author Card */}
        {posts[0] && (
          <div className="mt-16 pt-10 border-t border-neutral-200">
            <GuideAuthorCard author={posts[0].author} />
          </div>
        )}
      </div>
    </div>
  );
};
