"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { getGuideBySlug, getRelatedGuides } from "../data/guides-data";
import { GuideAuthorCard } from "./GuideAuthorCard";
import { GuideCard } from "./GuideCard";
import { buildBlogPostingSchema, buildBreadcrumbSchema } from "../utils/schema";
import {
  Calendar,
  Clock,
  Share2,
  Check,
  ArrowLeft,
  BookOpen,
} from "lucide-react";

interface GuideDetailModuleProps {
  slug: string;
}

export const GuideDetailModule: React.FC<GuideDetailModuleProps> = ({ slug }) => {
  const post = getGuideBySlug(slug);
  const [copied, setCopied] = useState(false);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedGuides(post.slug, 3);

  const blogPostingSchema = useMemo(() => {
    return buildBlogPostingSchema(post);
  }, [post]);

  const breadcrumbSchema = useMemo(() => {
    return buildBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Guides", url: "/guides" },
      { name: post.categoryName, url: `/guides/category/${post.categorySlug}` },
      { name: post.title, url: `/guides/post/${post.slug}` },
    ]);
  }, [post]);

  const formattedDate = post.publishedDate
    ? new Date(post.publishedDate).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareUrl = typeof window !== "undefined" ? encodeURIComponent(window.location.href) : "";
  const shareTitle = encodeURIComponent(post.title);

  return (
    <article className="min-h-screen bg-neutral-50/50 pb-24">
      {/* 1. Official Google & Schema.org JSON-LD BlogPosting Schema */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />

      {/* 2. Official Google BreadcrumbList JSON-LD Schema */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Guides", href: "/guides" },
          {
            label: post.categoryName,
            href: `/guides/category/${post.categorySlug}`,
          },
          { label: post.title },
        ]}
      />

      {/* Post Header */}
      <header className="bg-white border-b border-neutral-200/80 pt-10 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href={`/guides/category/${post.categorySlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-brand transition-colors mb-6 uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {post.categoryName}</span>
          </Link>

          {/* Category Badge */}
          <div className="mb-4">
            <Link
              href={`/guides/category/${post.categorySlug}`}
              className="inline-block bg-brand/10 text-brand text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full hover:bg-brand hover:text-white transition-colors"
            >
              {post.categoryName}
            </Link>
          </div>

          {/* Headline - CSS Selector matched in speakable spec */}
          <h1 className="guide-headline text-2xl sm:text-4xl lg:text-5xl font-sans font-black text-neutral-900 tracking-tight leading-tight mb-4">
            {post.title}
          </h1>

          {/* Excerpt / Summary */}
          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed mb-6 font-normal">
            {post.description}
          </p>

          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-neutral-100 text-xs sm:text-sm text-neutral-600">
            {/* Author info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-banner text-white flex items-center justify-center font-black text-xs shadow-sm">
                VM
              </div>
              <div>
                <p className="font-bold text-neutral-900 leading-tight">
                  {post.author.name}
                </p>
                <p className="text-xs text-neutral-500">
                  {post.author.jobTitle || "Founder & Gear Specialist"}
                </p>
              </div>
            </div>

            {/* Date and Reading Time */}
            <div className="flex items-center gap-4 text-xs font-medium text-neutral-500">
              {formattedDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <span>{formattedDate}</span>
                </span>
              )}
              {post.readingTimeMinutes && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  <span>{post.readingTimeMinutes} min read</span>
                </span>
              )}
              {post.wordCount && (
                <span className="hidden sm:flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-neutral-400" />
                  <span>{post.wordCount.toLocaleString()} words</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-lg border border-neutral-200/80 mb-10 bg-neutral-100">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        )}

        {/* Article Body - CSS Selector matched in speakable spec */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 lg:p-12 border border-neutral-200/80 shadow-sm mb-12">
          <div
            className="guide-article-body prose prose-neutral sm:prose-lg max-w-none 
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-neutral-950
              prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:mb-4
              prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:border-neutral-100 prose-h2:pb-2
              prose-p:text-neutral-700 prose-p:leading-relaxed prose-p:mb-4
              prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-li:text-neutral-700 prose-li:my-1
              prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-li:text-neutral-700
              prose-strong:text-neutral-900 prose-strong:font-bold
              prose-a:text-brand prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Social Share Bar */}
          <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-neutral-500" />
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Share this guide:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
              >
                WhatsApp
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-black text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
              >
                X / Twitter
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-[#1877F2] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
              >
                Facebook
              </a>
              <button
                onClick={handleCopyLink}
                className="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Author Bio Card */}
        <div className="mb-14">
          <GuideAuthorCard
            author={post.author}
            publishedDate={post.publishedDate}
            readingTimeMinutes={post.readingTimeMinutes}
          />
        </div>

        {/* Related Guides Section */}
        {relatedPosts.length > 0 && (
          <section className="mt-14">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
                  Related Guides & Tips
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Continue exploring rider knowledge and gear recommendations.
                </p>
              </div>
              <Link
                href="/guides"
                className="text-xs font-bold text-banner hover:text-brand transition-colors"
              >
                View All Guides &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((relPost) => (
                <GuideCard key={relPost.slug} post={relPost} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
};
