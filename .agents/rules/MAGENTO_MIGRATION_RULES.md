# Magento to MongoDB Migration & Commerce Rules

> **⚠️ MANDATORY: Rules for handling Magento product exports and commercial architecture.**

## 1. Configurable Parent vs Child (The Golden Rule)
For configurable Magento products, treat **child/simple SKU pricing, stock, weight, and variant-specific attributes as the authoritative commercial data.**
- Treat any parent price/qty as source metadata unless Magento behavior and the existing Store4Riders implementation prove otherwise. 
- Parent listing price, price ranges, and availability may be **derived** from valid child variants, but must **never overwrite or replace** child-level values.

## 2. Parent Display Price Derivation
When calculating the parent's minimum displayed price (e.g., "From ₹2,999"), **DO NOT blindly run `Math.min(all child prices)`**.
- Explicitly decide and test the derivation logic according to the Store4Riders business rule: Should the minimum price be taken from *all* children, only *enabled* children, or only *currently purchasable/in-stock* children?
- Exclude out-of-stock variants from the minimum price calculation if the storefront logic requires it (to prevent misleading "From" prices for variants users cannot actually buy).

## 3. Generic Variant Options
Variant axes are dynamic. Support whatever actual Magento variation axes exist (e.g., `color`, `size`, `eu_size_for_boots`, `motorcycle_model`, `jacket_kit`, `weight_in_ml`). 
- Do NOT hardcode variations to only `color + size`.
- Represent combinations generically in `variant.options = { ... }`.

## 4. Never Create Fake Combinations
Only actual Magento child combinations are valid. If actual children are `Black/S` and `Black/M`, do NOT generate `Red/S` just because `Red` and `S` exist elsewhere in the catalog.

## 5. Cart Validation & Server-Side Integrity
- The Cart MUST use the specific child SKU.
- When a child SKU is added to the cart, the backend MUST revalidate the authoritative current price, stock availability, and option validity directly from the database. 
- NEVER trust the frontend's selected price or disabled button states.

## 6. Multi-select Attributes
Attributes like `gender="Male"|"Unisex"` must be accurately split and mapped as arrays, preserving the true multi-select intent without destroying the original data via naive string splitting.
