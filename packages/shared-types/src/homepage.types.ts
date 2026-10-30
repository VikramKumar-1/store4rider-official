export interface IHeroCard {
  id: string;
  title: string;
  priceFormatted: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
}

export interface IHeroSectionConfig {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bgImages: string[];
  featuredCards: IHeroCard[];
}

export interface IHomepageSeoConfig {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export interface ICategoryCardConfig {
  title: string;
  imageUrl: string;
  linkUrl: string;
}

export interface IFeaturedCategoriesSectionConfig {
  sectionTitle: string;
  helmets: ICategoryCardConfig;
  gloves: ICategoryCardConfig;
  jackets: ICategoryCardConfig;
}

export interface IBrowseProductItem {
  id?: string;
  name: string;
  priceFormatted: string;
  imageUrl: string;
  category?: string;
  productUrl: string;
  rating?: number;
}

export interface IBrowseCategoriesSectionConfig {
  sectionTitle: string;
  items?: IBrowseProductItem[];
}

export interface ITouringGearSectionConfig {
  sectionTitle: string;
  seeMoreText: string;
  seeMoreLink: string;
}

export interface ISocialMediaBannerBottom {
  imageUrl: string;
  linkUrl: string;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  imagePosition?: "top" | "center" | "bottom";
}

export interface ISocialMediaBannerTop {
  imageUrl: string;
  linkUrl: string;
  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;
  imagePosition?: "top" | "center" | "bottom";
}

export interface IInstagramReel {
  _id?: string;
  id?: string;
  title?: string;
  thumbnailUrl: string;
  videoType: "upload" | "embed";
  videoUrl: string;
  instagramUrl?: string;
  views?: string;
  likes?: string;
  author?: string;
  order?: number;
  isActive?: boolean;
  timestamp?: string;
}

export interface ISocialMediaSectionConfig {
  sectionTitle: string;
  sectionSubtitle?: string;
  instagramHandle?: string;
  instagramProfileUrl?: string;
  profileName?: string;
  bio?: string;
  websiteUrl?: string;
  followersCount?: string;
  followingCount?: string;
  postsCount?: string;
  profileAvatarUrl?: string;
  reels?: IInstagramReel[];
  reelImages: string[];
  bannerTop: ISocialMediaBannerTop;
  bannerBottom: ISocialMediaBannerBottom;
  lastSyncedAt?: string;
}

export interface ITestimonialsSectionConfig {
  sectionTitle: string;
}

export interface ITopBannerConfig {
  message: string;
  highlightText: string;
  isEnabled: boolean;
  linkUrl?: string;
}

export interface IHomepageSectionsConfig {
  topBanner: ITopBannerConfig;
  featuredCategories: IFeaturedCategoriesSectionConfig;
  browseCategories: IBrowseCategoriesSectionConfig;
  touringGear: ITouringGearSectionConfig;
  socialMedia: ISocialMediaSectionConfig;
  testimonials: ITestimonialsSectionConfig;
}

export interface IHomepageConfig {
  _id?: string;
  hero: IHeroSectionConfig;
  seo: IHomepageSeoConfig;
  sections: IHomepageSectionsConfig;
  updatedAt?: string;
}
