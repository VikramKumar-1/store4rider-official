export type SearchRedirectMatchType = "exact" | "contains" | "fuzzy";
export type SearchRedirectTargetType = "category" | "brand" | "product" | "custom";

export interface ISearchRedirect {
  _id?: string;
  searchTerm: string;
  cleanSearchTerm?: string;
  redirectUrl: string;
  targetType: SearchRedirectTargetType;
  targetTitle?: string;
  matchType: SearchRedirectMatchType;
  synonyms: string[];
  cleanSynonyms?: string[];
  isActive: boolean;
  redirectCount?: number;
  lastTriggeredAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface ISearchRedirectCheckResult {
  hasRedirect: boolean;
  redirectUrl?: string;
  targetTitle?: string;
  targetType?: SearchRedirectTargetType;
  searchTerm?: string;
}
