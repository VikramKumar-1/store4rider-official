"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { GUIDE_CATEGORIES, GUIDE_POSTS } from "../data/guides-data";
import { GuideCard } from "./GuideCard";
import { GuideAuthorCard } from "./GuideAuthorCard";
import { buildBlogCollectionSchema, buildBreadcrumbSchema } from "../utils/schema";
import { MagnifyingGlassIcon, BookOpenIcon, SparklesIcon } from "@heroicons/react/24/outline";

export const GuidesHubModule: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredPosts = useMemo(() => {
    return GUIDE_POSTS.filter((post) => {
      const matchesCat =
        selectedCategory === "all" || post.categorySlug === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const collectionSchema = useMemo(() => {
    return buildBlogCollectionSchema(
      "Motorcycle Guides & Advice | Store4Riders",
      "Comprehensive motorcycle riding gear guides, maintenance checklists, superbike buying tips, and touring advice.",
      GUIDE_POSTS,
      "https://www.store4riders.com/guides"
    );
  }, []);

  const breadcrumbSchema = useMemo(() => {
    return buildBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Guides", url: "/guides" },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50/60 pb-20">
      {/* Blog Schema */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      {/* Breadcrumb Schema */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Guides" },
        ]}
      />

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-neutral-100/70 via-white to-neutral-50/50 border-b border-neutral-200/80 py-12 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-widest mb-4">
              <SparklesIcon className="w-4 h-4" />
              <span>Official Store4Riders Knowledge Base</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-sans font-black tracking-tight text-neutral-900 mb-4 leading-tight">
              Motorcycle Guides & Expert Advice
            </h1>
            
            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-8">
              Real-world gear tests, sizing walkthroughs, maintenance checklists, and touring preparation guides curated by riders for Indian roads and conditions.
            </p>

            {/* Search Input */}
            <div className="relative max-w-xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guides (e.g. helmets, chain care, touring, CE armour)..."
                className="w-full bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 pl-11 pr-4 py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand transition-all shadow-sm"
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 pt-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
              selectedCategory === "all"
                ? "bg-brand text-white shadow-sm"
                : "bg-white text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200"
            }`}
          >
            All Guides ({GUIDE_POSTS.length})
          </button>

          {GUIDE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                selectedCategory === cat.slug
                  ? "bg-brand text-white shadow-sm"
                  : "bg-white text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200"
              }`}
            >
              {cat.name} {cat.articleCount ? `(${cat.articleCount})` : ""}
            </button>
          ))}
        </div>

        {/* Guides Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-6">
            {filteredPosts.map((post, idx) => (
              <GuideCard key={post.slug} post={post} priority={idx < 3} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-neutral-200 max-w-md mx-auto my-12">
            <BookOpenIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-neutral-900 mb-1">
              No matching guides found
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Try searching with a different keyword or choose another category.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-bold hover:bg-brand/90 transition-colors shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Author Spotlight */}
        <div className="mt-16 pt-10 border-t border-neutral-200">
          <GuideAuthorCard
            author={GUIDE_POSTS[0].author}
          />
        </div>
      </div>
    </div>
  );
};
