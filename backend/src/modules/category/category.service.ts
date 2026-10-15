import { CategoryRepository } from "./category.repository";
import { ICategory } from "@store4riders/shared-types";
import { getCache, setCache, deleteCache } from "../../core/cache/redis";

const CACHE_KEY = "category_tree_v2";

/**
 * @class CategoryService
 * @description Pure business logic for Category management.
 * Highlights:
 * - Operates completely independent of HTTP context.
 * - Auto-caches the category tree in Redis for 1 hour.
 * - Auto-invalidates the cache whenever a new category is created.
 */
export class CategoryService {
  
  static async getCategoryTree() {
    const cached = await getCache(CACHE_KEY);
    if (cached) return cached;

    const categories = await CategoryRepository.findAll();
    const tree = this.buildTree(categories);
    
    await setCache(CACHE_KEY, tree, 3600); // Cache for 1 hour
    return tree;
  }

  static async createCategory(data: Partial<ICategory>): Promise<ICategory> {
    const slug = data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const category = await CategoryRepository.create({ ...data, slug });
    await this.invalidateCache();
    return category;
  }

  static async updateCategory(id: string, data: Partial<ICategory>): Promise<ICategory> {
    if (data.name && !data.slug) {
      data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
    const category = await CategoryRepository.update(id, data);
    if (!category) throw new Error("Category not found");
    await this.invalidateCache();
    return category;
  }

  static async deleteCategory(id: string): Promise<void> {
    const category = await CategoryRepository.findById(id);
    if (!category) throw new Error("Category not found");
    await CategoryRepository.delete(id);
    await this.invalidateCache();
  }

  static async getCategoryBySlug(slug: string): Promise<ICategory | null> {
    let cat = await CategoryRepository.findBySlug(slug);
    if (!cat && slug.endsWith("s")) {
      cat = await CategoryRepository.findBySlug(slug.slice(0, -1));
    } else if (!cat && !slug.endsWith("s")) {
      cat = await CategoryRepository.findBySlug(`${slug}s`);
    }
    if (!cat) {
      const aliasMap: Record<string, string[]> = {
        "full-face-helmets": ["full-face-helmets", "full-face-helmet", "premium-full-face-helmets"],
        "modular-helmets": ["modular-helmets-flip-up-helmets", "modular-flip-up"],
        "off-road-helmets": ["off-road-helmets-motocross-helmet", "off-road"],
        "open-face-helmets": ["half-face-helmets", "open-face", "half-face-helmet"],
        "half-face-helmets": ["open-face-helmets", "open-face", "half-face-helmet"],
        "helmet-accessories": ["helmet-accessories-helmet-visors", "helmet-visors"],
        "helmet-visors": ["helmet-accessories-helmet-visors", "helmet-accessories"],
        "bluetooth-intercoms": ["communicators"],
        "riding-gloves": ["motorcycle-riding-gloves", "riding-gloves-biker-gloves", "gloves", "biker-gloves"],
        "motorcycle-riding-gloves": ["riding-gloves", "riding-gloves-biker-gloves", "gloves", "biker-gloves"],
        "full-gauntlet-gloves": ["premium-full-gauntlet-riding-gloves"],
        "semi-gauntlet-gloves": ["semi-gauntlet-bike-riding-gloves"],
        "short-motorbike-gloves": ["short-cuff-biker-gloves"],
        "riding-jacket": ["riding-jackets", "riding-jackets-bike-jackets", "riding-jackets-motorcycle-jackets", "motorcycle-jackets"],
        "riding-jackets": ["riding-jacket", "riding-jackets-bike-jackets", "riding-jackets-motorcycle-jackets", "motorcycle-jackets"],
        "protectors-armour": ["protectors-armour", "protectors", "armour", "armor"],
        "women-riding-gear": ["riding-gear-for-women", "women-riding-gear", "riding-gear-women"],
        "riding-gear-for-women": ["women-riding-gear", "riding-gear-for-women", "riding-gear-women"],
        "riding-jeans": ["motorcycle-riding-jeans", "riding-jeans", "riding-jean"],
        "motorcycle-riding-jeans": ["riding-jeans", "motorcycle-riding-jeans", "riding-jean"],
        "knee-guards": ["knee-guards-for-bikers"],
        "knee-guards-bikers": ["knee-guards-for-bikers", "knee-guards", "knee-guard"],
        "touring-pants": ["touring-pant", "riding-pants"],
        "short-biking-boots": ["short-city-riding-biking-boots"],
        "sports-riding-shoes": ["sport-riding-shoes"],
        "off-road-boots": ["off-road-riding-boots-motocross-boots"],
        "off-road-riding-boots": ["off-road-boots", "off-road-riding-boots-motocross-boots"],
        "off-road-motocross": ["off-road-motocross-riding-gear"],
        "off-road-motocross-riding-gear": ["off-road-motocross", "off-road-motocross-riding-gear"],
        "tank-bags": ["tank-bags-for-bike"],
        "tank-bags-bikes": ["tank-bags-for-bike", "tank-bags"],
        "saddle-bags": ["saddle-bags-bikes", "saddle-bags-for-bikes-panniers", "saddle-bags-for-bikes"],
        "saddle-bags-bikes": ["saddle-bags", "saddle-bags-for-bikes-panniers"],
        "bike-top-box": ["top-box", "top-boxes"],
        "hydration-bag": ["hydration-bag", "hydration-bags"],
        "motorcycle-other-luggage": ["other-luggage", "other-luggages"],
        "auxiliary-lights": ["bike-auxiliary-lights", "bike-auxiliary-lights-filters-flashers"],
        "bike-auxiliary-lights": ["auxiliary-lights", "bike-auxiliary-lights"],
        "auxiliary-light-filter": ["auxiliary-light-filters"],
        "auxiliary-light-filters": ["auxiliary-light-filter"],
        "clamps-and-mounts-for-lights": ["bike-auxiliary-light-clamps-and-mounts"],
        "bike-auxiliary-light-clamps-mounts": ["bike-auxiliary-light-clamps-and-mounts", "clamps-and-mounts-for-lights"],
        "auxiliary-light-wiring-harness-switch": ["auxiliary-light-wiring-harness-and-switch"],
        "off-beat-accessories": ["off-beat-bike-accessories-online"],
        "off-beat-motorcycle-accessories": ["off-beat-bike-accessories-online", "off-beat-accessories"],
        "rally-tower": ["rally-tower", "rally-towers-navigation-tower"],
        "bike-phone-holders": ["bike-phone-holders-mobile-holder-for-bike"],
        "iridium-spark-plugs": ["iridium-spark-plug"],
        "iridium-spark-plug": ["iridium-spark-plugs"],
        "performance-air-filters": ["performance-air-filters-for-bikes"],
        "performance-air-filter-bike": ["performance-air-filters-for-bikes", "performance-air-filters"],
        "spares": ["bike-spare-parts-online", "bike-spares"],
        "bike-spares": ["bike-spare-parts-online", "spares"],
        "brake-pads": ["brake-pads"],
      };
      const aliases = aliasMap[slug] || [];
      for (const alias of aliases) {
        cat = await CategoryRepository.findBySlug(alias);
        if (cat) break;
      }
    }
    return cat;
  }

  static async invalidateCache() {
    await deleteCache(CACHE_KEY);
  }

  private static buildTree(categories: any[], parentId?: string, visited = new Set<string>()): any[] {
    const idMap = new Map<string, any>();
    categories.forEach(c => {
      const id = String(c._id || c.id);
      idMap.set(id, c);
      if (c.slug) idMap.set(c.slug, c);
    });

    const buildChildren = (pId?: string, curVisited = new Set<string>()): any[] => {
      return categories
        .filter(c => {
          const itemPid = c.parentId ? String(c.parentId) : undefined;
          return itemPid === pId;
        })
        .map(c => {
          const id = String(c._id || c.id);
          if (curVisited.has(id)) return { ...c, children: [] };
          curVisited.add(id);

          const children = buildChildren(id, new Set(curVisited));

          // Resolve hero section category cards
          let heroCategories: any[] = [];
          if (Array.isArray(c.heroCategoryIds) && c.heroCategoryIds.length > 0) {
            heroCategories = c.heroCategoryIds
              .map((targetId: string) => idMap.get(targetId))
              .filter(Boolean);
          } else if (children.length > 0) {
            heroCategories = children;
          } else if (c.parentId) {
            // Sibling categories sharing the same parent (e.g. Modular -> Full Face, Open Face)
            heroCategories = categories.filter(other => 
              String(other.parentId) === String(c.parentId) && 
              String(other._id || other.id) !== id
            );
          }

          return {
            ...c,
            children,
            heroCategories,
          };
        });
    };

    return buildChildren(parentId, visited);
  }
}
