"use client";

import React from "react";
import Image from "next/image";
import { StarIcon } from "@heroicons/react/24/solid";
import { TestimonialData } from "../types/homepage.types";

export interface TestimonialsSectionProps {
  testimonials: TestimonialData[];
}

/**
 * TestimonialCard Component
 * 
 * Internal component for rendering an individual white card with user review.
 */
const TestimonialCard: React.FC<{ data: TestimonialData }> = ({ data }) => {
  return (
    <div className="bg-white p-5 md:p-6 shadow-sm w-[280px] md:w-[320px] shrink-0 flex flex-col gap-4 rounded-sm border border-neutral-100">
      {/* Card Header: Avatar, Name, Date, Stars */}
      <div className="flex items-start justify-between">
        
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-banner overflow-hidden relative shrink-0">
            {data.avatarUrl ? (
              <Image src={data.avatarUrl} alt={data.authorName} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-[#3e2723]" /> // Dark brown placeholder matching screenshot
            )}
          </div>
          
          {/* Author Info */}
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs font-semibold text-neutral-800 uppercase tracking-wide">
              {data.authorName}
            </span>
            <span className="text-[9px] md:text-[10px] text-neutral-500">
              {data.date}
            </span>
          </div>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              className={`w-3 h-3 md:w-3.5 md:h-3.5 ${
                i < Math.floor(data.rating) ? "text-[#FFD700]" : "text-neutral-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Card Body: Review Text */}
      <p className="text-[11px] md:text-xs text-neutral-500 leading-relaxed font-sans">
        {data.content}
      </p>
    </div>
  );
};

/**
 * TestimonialsSection Component
 * 
 * Renders the "WHAT CUSTOMERS SAY ABOUT US" section with a horizontally scrollable
 * carousel of testimonial cards on a light grey background.
 */
export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials }) => {
  return (
    <section className="w-full bg-[#f8f8f8] py-8 md:py-10 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6">
        
        {/* Title Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-neutral-900 tracking-wide leading-tight">
            WHAT CUSTOMERS SAY <br /> ABOUT US
          </h2>
        </div>

        {/* Horizontal Carousel */}
        <div className="flex overflow-x-auto gap-4 md:gap-6 pb-6 snap-x snap-mandatory hide-scrollbar">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="snap-center">
              <TestimonialCard data={testimonial} />
            </div>
          ))}
        </div>

      </div>

      {/* Custom styles to hide scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </section>
  );
};

export default TestimonialsSection;
