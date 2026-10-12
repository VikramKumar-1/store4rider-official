"use client";

import { memo, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUp, ArrowUpRight, Instagram, Youtube, Twitter, Facebook, Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-slate-950 text-slate-300 overflow-hidden mt-auto pt-0">
      
      {/* Hidden SVG Filter for Real-time Hardware Image Sharpening */}

      {/* Top 4:1 Ultrawide Panoramic Anime Mountain Rider Banner */}
      <div className="relative w-full h-[200px] sm:h-[240px] md:h-[280px] lg:h-[320px] overflow-hidden bg-slate-950 flex items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/footer-img.jpg"
          alt="Golden Mountain Rider Ultrawide Panoramic Anime Artwork"
          className="w-full h-full object-cover object-[center_60%] contrast-[1.15] saturate-[1.1] brightness-[0.95]"
        />

        {/* Soft Minimal Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-transparent to-slate-950/90 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
      </div>

      {/* Footer Main Links Content */}
      <div className="container mx-auto px-6 relative z-10 -mt-6 pb-12">
        
        {/* Links Grid (5 Column Layout) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 sm:gap-10 pb-16 border-b border-slate-800/80">
          
          {/* Column 1: STORE */}
          <div>
            <h4 className="font-black text-brand text-xs tracking-widest uppercase mb-4">
              STORE
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              {[
                "Protective Gear",
                "Performance Layers",
                "Luggage",
                "Accessories",
                "Lifestyle Merch",
              ].map((item) => (
                <li key={item}>
                  <Link 
                    href={`/products?search=${encodeURIComponent(item)}`}
                    className="text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{item}</span>
                    <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-brand" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: SUPPORT */}
          <div>
            <h4 className="font-black text-brand text-xs tracking-widest uppercase mb-4">
              SUPPORT
            </h4>
            <ul className="space-y-2.5 text-xs font-medium text-slate-400">
              <li><Link href="/guides" className="hover:text-white transition-colors">Motorcycle Guides & Advice</Link></li>
              <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
              <li><Link href="/warranty" className="hover:text-white transition-colors">Warranty</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">Refund / Exchange Policy</Link></li>
              <li><Link href="/care" className="hover:text-white transition-colors">Care Instructions</Link></li>
              <li><Link href="/insurance" className="hover:text-white transition-colors">Wingman Insurance</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms Of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Column 3: CONTACT US */}
          <div>
            <h4 className="font-black text-brand text-xs tracking-widest uppercase mb-4">
              CONTACT US
            </h4>
            <div className="space-y-3 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-2 text-slate-300">
                <Phone size={14} className="text-brand" />
                <span className="font-bold">Contact Number: 07795688316</span>
              </div>
              <p className="text-[11px] text-slate-500">Mon-Fri 11.00 AM to 4.30 PM</p>
              
              <div className="flex items-center gap-2 text-slate-300 pt-1">
                <Mail size={14} className="text-brand" />
                <span>support@store4riders.com</span>
              </div>

              <div className="pt-2">
                <Link href="/support" className="inline-block underline underline-offset-4 text-xs font-bold text-white hover:text-brand transition-colors">
                  For any Queries please contact Customer Support
                </Link>
              </div>
            </div>
          </div>

          {/* Column 4: CAREERS */}
          <div>
            <h4 className="font-black text-brand text-xs tracking-widest uppercase mb-4">
              CAREERS
            </h4>
            <div className="space-y-3 text-xs text-slate-400 font-medium">
              <Link href="/careers" className="text-slate-300 font-bold hover:text-brand transition-colors block">
                Join #TeamStore4Riders
              </Link>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Explore open engineering & gear design positions.
              </p>
            </div>
          </div>

          {/* Column 5: LOCATION & SOCIALS */}
          <div>
            <h4 className="font-black text-brand text-xs tracking-widest uppercase mb-4">
              LOCATION
            </h4>
            <div className="space-y-3 text-xs text-slate-400 font-medium">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-brand shrink-0 mt-0.5" />
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Store4Riders HQ, 1107, Kohinoor Square, NC Kelkar Marg, Opposite Shiv Sena Bhavan, Dadar (west), Mumbai, Maharashtra 400028
                </p>
              </div>
              <p className="text-slate-300 font-bold text-xs">+91 7795688316</p>

              {/* Social Media Icons */}
              <div className="pt-2 flex items-center gap-3">
                <a href="https://twitter.com/store4riders" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:bg-brand hover:border-brand text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                  <Twitter size={14} />
                </a>
                <a href="https://www.facebook.com/store4riders/" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:bg-brand hover:border-brand text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                  <Facebook size={14} />
                </a>
                <a href="https://www.instagram.com/store4riders/" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:bg-brand hover:border-brand text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                  <Instagram size={14} />
                </a>
                <a href="https://www.youtube.com/channel/UCfXjs09-TOC1WJnutHUjphg" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 hover:bg-brand hover:border-brand text-slate-300 hover:text-white flex items-center justify-center transition-colors">
                  <Youtube size={14} />
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar with Scroll-to-Top Button */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-brand text-white font-black text-xs flex items-center justify-center">
              S
            </div>
            <p>&copy; {new Date().getFullYear()} Store4Riders Inc. All rights reserved.</p>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms Of Service</Link>
            
            {/* Scroll To Top Button */}
            <button
              onClick={scrollToTop}
              aria-label="Scroll to top"
              className="w-10 h-10 rounded-full bg-slate-900 border-2 border-brand text-brand hover:bg-brand hover:text-white flex items-center justify-center transition-all shadow-md group"
            >
              <ArrowUp size={18} className="group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>

        </div>

      </div>

    </footer>
  );
};

export default memo(Footer);
