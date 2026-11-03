"use client";

import React from "react";
import Link from "next/link";
import { TopBanner } from "@/modules/homepage/components/TopBanner";
import { Navbar } from "@/modules/homepage/components/Navbar";
import { Footer } from "@/modules/homepage/components/Footer";

export const ReturnsReplacementsModule: React.FC = () => {
  return (
    <div className="w-full min-h-screen flex flex-col font-sans bg-white text-neutral-800">
      {/* Header */}
      <header className="w-full">
        <TopBanner />
        <div className="w-full bg-white relative z-40 border-b border-neutral-200 shadow-2xs sticky top-0">
          <Navbar logoText="Store4Riders" theme="light" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full py-4 sm:py-6 px-4 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Breadcrumb Header */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-neutral-500 py-1"
          >
            <Link href="/" className="hover:text-neutral-900 transition-colors">
              Home
            </Link>
            <span className="text-neutral-400 font-normal">&gt;</span>
            <span className="text-neutral-700 font-normal">
              Exchange &amp; Replacements Policy - Store4Riders.com
            </span>
          </nav>

          {/* Page Title */}
          <h1 className="text-2xl sm:text-3xl font-normal text-neutral-900 pt-2 pb-1">
            Exchange &amp; Replacements Policy
          </h1>

          {/* Policy Body */}
          <div className="space-y-4 text-sm sm:text-base text-neutral-700 leading-relaxed">
            <p>
              Wrong size, wrong colour - No Problem! If there was mistake from our side (i.e. wrong size and/or wrong colour delivered) in the product that you received, we will bear the return shipping charges (not exceeding the shipping charges charged at the time of sale) and re-shipping charges.
            </p>

            <p>
              If you made a mistake while placing the order, please get in touch with us urgently to change the order. It is easier to change the product before it is shipped. You can contact us during office hours by call / SMS / Whatsapp on{" "}
              <a
                href="https://wa.me/917263007788"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                07263007788
              </a>{" "}
              or email us on{" "}
              <a
                href="mailto:support@store4riders.com"
                className="text-blue-600 hover:underline"
              >
                support@store4riders.com
              </a>{" "}
              and we will be happy to change your order. Once a shipping label is created, we can&apos;t change any aspect of your order.
            </p>

            <p>
              If you received riding gear that you wish to replace because of size issue, then Worry Not! we will facilitate the replacement. You will need to bear the return shipping charges and re-shipping charges. Just make sure that the product is not used and has all the original tags still attached.{" "}
              <u className="underline underline-offset-2">
                Items repacked, tags removed etc won&apos;t be replaced.
              </u>{" "}
              Replacements must include all tags, packaging and be shipped in a sturdy shipping box. Ideally return the product in the same box you received it in. Items received that do not meet these criteria will not be accepted and will be sent back to you (after collecting reshipping charges from you, if any). Product must be shipped back within 48hrs of receiving the product. Any late claims will not be entertained.
            </p>

            <p>
              You will need to choose replacement from the products available in stock. In case the size and/or graphic that you want as replacement is not available, we will be unable to execute replacement and/or refund.
            </p>

            <div className="pt-2">
              <p className="font-bold text-neutral-900 mb-2">Points to keep in mind:</p>
              <ul className="list-disc pl-5 sm:pl-6 space-y-2 text-neutral-700">
                <li>Size replacement can be done only once. Repeated replacements will not be permitted.</li>
                <li>Only size exchange is permitted. Exchanging one product for another product/series/brand is not permitted.</li>
                <li>Exchange / Replacement for spares (sprockets, spark plugs, air filters) is not permitted.</li>
                <li>Return of any product will not be accepted.</li>
                <li>Products on sale can&apos;t be exchanged.</li>
                <li>
                  In case of any manufacturing issue, it must be brought to our notice by email to{" "}
                  <a
                    href="mailto:support@store4riders.com"
                    className="text-blue-600 hover:underline"
                  >
                    support@store4riders.com
                  </a>{" "}
                  within 3 days from receipt of the material. We will be happy to help you out in making a warranty claim with manufacturer. For more information about warranty, head to{" "}
                  <Link
                    href="/warranty"
                    className="text-blue-600 hover:underline"
                  >
                    Store4Riders.com warranty
                  </Link>
                  .
                </li>
              </ul>
            </div>

            <p className="font-bold text-neutral-900 pt-3">
              Keychains, stickers, visors, helmet accessories like ratchets, chin curtains, nose guards, balaclava, badges, T-shirts, Hoodies can&apos;t be exchanged / replaced.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
