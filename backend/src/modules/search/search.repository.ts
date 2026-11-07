import { SearchRedirectModel } from "./search.model";
import { ISearchRedirect } from "@store4riders/shared-types";

export class SearchRepository {
  /**
   * Resolves whether an active search redirect exists for the given user query.
   * Priority:
   * 1. Exact match on cleanSearchTerm or cleanSynonyms
   * 2. Contains match (if matchType === "contains")
   * 3. Fuzzy/Typo-tolerant match
   */
  static async findMatchingRedirect(rawQuery: string): Promise<ISearchRedirect | null> {
    if (!rawQuery || typeof rawQuery !== "string") return null;
    const clean = rawQuery.replace(/[\0\$\{\}\[\]\<\>\\]/g, "").trim().toLowerCase().slice(0, 120);
    if (!clean) return null;

    // 1. Exact Match on primary term or defined synonyms (Fast indexed lookup)
    const exactMatch = await SearchRedirectModel.findOne({
      isActive: true,
      $or: [
        { cleanSearchTerm: clean },
        { cleanSynonyms: clean },
      ],
    }).lean().exec();

    if (exactMatch) {
      return exactMatch as unknown as ISearchRedirect;
    }

    // 2. Contains / Partial Match
    // Matches if the rule is set to 'contains' or 'fuzzy'
    const flexibleRules = await SearchRedirectModel.find({
      isActive: true,
      matchType: { $in: ["contains", "fuzzy"] },
    }).lean().exec();

    for (const rule of flexibleRules) {
      const ruleTerm = rule.cleanSearchTerm;
      const synonyms = rule.cleanSynonyms || [];

      // If user typed "axor apex helmet" and rule is "axor apex"
      if (clean.includes(ruleTerm)) {
        return rule as unknown as ISearchRedirect;
      }

      // If user typed partial e.g. "axor ap" and rule is "axor apex" (min length 3 to prevent false positives)
      if (clean.length >= 3 && ruleTerm.includes(clean)) {
        return rule as unknown as ISearchRedirect;
      }

      // Check synonyms contains
      for (const syn of synonyms) {
        if (clean.includes(syn) || (clean.length >= 3 && syn.includes(clean))) {
          return rule as unknown as ISearchRedirect;
        }
      }
    }

    return null;
  }

  /**
   * Increments redirect counter and records timestamp without blocking.
   */
  static async incrementRedirectCount(id: string): Promise<void> {
    try {
      await SearchRedirectModel.findByIdAndUpdate(id, {
        $inc: { redirectCount: 1 },
        $set: { lastTriggeredAt: new Date() },
      }).exec();
    } catch {
      // Non-blocking telemetry
    }
  }

  /**
   * Paginated list of redirects for Admin console.
   */
  static async listRedirects(page = 1, limit = 20, search?: string) {
    const query: any = {};
    if (search && typeof search === "string" && search.trim()) {
      const sanitized = search.replace(/[\0\$\{\}\[\]\<\>\\]/g, "").trim().slice(0, 100);
      if (sanitized) {
        const escaped = sanitized.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
        const regex = new RegExp(escaped, "i");
        query.$or = [
          { searchTerm: regex },
          { redirectUrl: regex },
          { targetTitle: regex },
          { synonyms: regex },
        ];
      }
    }

    const skip = (page - 1) * limit;
    const [items, totalCount] = await Promise.all([
      SearchRedirectModel.find(query)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      SearchRedirectModel.countDocuments(query).exec(),
    ]);

    return {
      items: items as unknown as ISearchRedirect[],
      totalCount,
    };
  }

  static async getById(id: string): Promise<ISearchRedirect | null> {
    return (await SearchRedirectModel.findById(id).lean().exec()) as unknown as ISearchRedirect | null;
  }

  static async create(data: Partial<ISearchRedirect>): Promise<ISearchRedirect> {
    const cleanSearchTerm = (data.searchTerm || "").trim().toLowerCase();
    const cleanSynonyms = (data.synonyms || []).map((s) => s.trim().toLowerCase()).filter(Boolean);

    const doc = await SearchRedirectModel.create({
      ...data,
      cleanSearchTerm,
      cleanSynonyms,
    });
    return doc.toObject() as unknown as ISearchRedirect;
  }

  static async update(id: string, data: Partial<ISearchRedirect>): Promise<ISearchRedirect | null> {
    const updateData: any = { ...data };
    if (data.searchTerm !== undefined) {
      updateData.cleanSearchTerm = data.searchTerm.trim().toLowerCase();
    }
    if (data.synonyms !== undefined) {
      updateData.cleanSynonyms = data.synonyms.map((s) => s.trim().toLowerCase()).filter(Boolean);
    }

    const doc = await SearchRedirectModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean().exec();

    return doc as unknown as ISearchRedirect | null;
  }

  static async delete(id: string): Promise<boolean> {
    const res = await SearchRedirectModel.findByIdAndDelete(id).exec();
    return !!res;
  }
}
