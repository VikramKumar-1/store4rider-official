# Filter & Aggregation Logic Rules (DO NOT MODIFY)

> **⚠️ CRITICAL: Any agent working on `product.service.ts` or `product.validator.ts` MUST read and strictly obey these rules. NEVER overwrite or simplify the filter/aggregation logic described here.**

## 1. Product Validator Logic (\`product.validator.ts\`)
The grid products MUST be filtered accurately based on user selection.
*   **Size and Color Filters:** MUST use an `$or` query to support both modern and legacy data structures:
    1.  **Modern Products (Variants Array):** Use `$elemMatch` to check the `variants` array and strictly enforce `stock: { $gt: 0 }`.
    2.  **Legacy Products (String):** Fallback to checking the `configurableVariations` string regex AND enforce root-level `stockStatus: 1`. 
    *Never remove the legacy fallback condition.*

## 2. Smart Faceting Aggregations (\`product.service.ts\` -> \`getAggregations\`)
The Left Sidebar facets (Brands, Categories, Colors, Sizes) use a highly specific "Hybrid Faceted Search" pattern. **DO NOT change this behavior to a simple loop.**

*   **Brand and Category Facets = STATIC:**
    *   When a user selects a Color or Size, the Brands and Categories lists MUST NOT shrink.
    *   They must evaluate based *only* on the base category and search query.
    *   *Why?* So the user can always see sibling brands (like SMK and Axor) and change their selection without the brand disappearing from the UI.

*   **Color and Size Facets = DYNAMIC (Smart Shrink):**
    *   When a user selects a Brand, the Colors and Sizes lists MUST shrink.
    *   They must only show Colors/Sizes that are actually available and **In-Stock** for that specific Brand.
    *   *Why?* To prevent the user from clicking a Color that the selected Brand does not manufacture (preventing "0 Products Found" dead ends).

## 3. Color Extraction Hierarchy
When building the \`colorsMap\` in aggregations, you MUST extract colors from all three sources in this exact order:
1.  **Structured Variants:** Extract from \`p.variants\` (only where \`v.stock > 0\`).
2.  **Legacy String:** Extract from \`p.configurableVariations\` (only if \`p.stockStatus === 1\`).
3.  **DB Migrated \`colorImages\` (Source of Truth):** Always extract keys from \`p.colorImages\` (if \`p.stockStatus === 1\`). This handles edge cases where the DB script mapped colors that were missing in the variant arrays.

**DO NOT REFACTOR THIS LOGIC TO BE "SIMPLER". It handles complex legacy e-commerce data.**
