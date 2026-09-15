/**
 * @file homepage.types.ts
 * @description Strongly-typed interfaces for the Homepage module components.
 * Strictly presentational data structures with zero business/domain logic.
 */

/**
 * Interface representing a item link in the header navigation bar.
 */
export interface NavLinkItem {
  id: string;
  label: string;
  href: string;
  hasDropdown?: boolean;
}

/**
 * Props for the TopBanner component.
 */
export interface TopBannerProps {
  /** Regular message text */
  message: string;
  /** Highlighted bold text (e.g. ONLY FOR TODAY!!) */
  highlightText: string;
  /** Optional link if banner is clickable */
  bannerUrl?: string;
}

/**
 * Props for the Navbar component.
 */
export interface NavbarProps {
  /** Brand/Logo text to display (e.g. Store4Riders) */
  logoText: string;
  /** List of navigation links */
  navItems: NavLinkItem[];
  /** Callback triggered when user submits search */
  onSearch?: (query: string) => void;
  /** Callback triggered when user clicks account icon */
  onAccountClick?: () => void;
}

/**
 * Data model for floating product cards in the Hero section.
 */
export interface HeroProductCardData {
  id: string;
  title: string;
  priceFormatted: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
}

/**
 * Props for the HeroSection component.
 */
export interface HeroSectionProps {
  /** Small category/tagline above main heading */
  subtitle: string;
  /** Main hero banner headline */
  title: string;
  /** Background image URL */
  bgImageUrl: string;
  /** List of products to display as floating cards */
  featuredProducts: HeroProductCardData[];
}

/**
 * Data model for Featured Categories section.
 */
export interface CategoryCardData {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
}

/**
 * Data model for Browse Products grid section.
 */
export interface BrowseProductData {
  id: string;
  category: string;
  name: string;
  priceFormatted: string;
  imageUrl: string;
  rating: number;
  productUrl: string;
}

/**
 * Data model for Testimonial cards.
 */
export interface TestimonialData {
  id: string;
  authorName: string;
  date: string;
  rating: number;
  content: string;
  avatarUrl?: string;
}
