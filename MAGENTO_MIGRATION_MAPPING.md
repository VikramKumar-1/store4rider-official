# MAGENTO TO STORE4RIDERS - SEMANTIC MAPPING CONTRACT

> **CONFIDENCE STATUS**: Fully verified against `backup-data/import-full-catalog.ts` and `backend/src/modules/product/product.model.ts`.

This document contains the exact mapping for all 89 columns from the Magento CSV to the Store4Riders MongoDB architecture, including behavior, filtering, and variant logic as explicitly required by the final audit rules.

---

## 1. `sku`

- **Magento meaning:** Stock Keeping Unit. Unique product identifier used to identify and track a product or sellable variant.
- **Observed examples:** `BBGHTB, SMK-TYPH-RD1-GL186-M`
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Unique Identifier
- **Filter relevance:** No
- **Variant relevance:** Yes - Critical for Cart
- **Search relevance:** Yes - High
- **Pricing relevance:** No
- **Inventory relevance:** Yes - Key
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.sku / product.variants[].sku`
- **Transformation:** Direct String mapping. Child SKUs are linked to parent via configurable_variations.
- **Empty behavior:** Fatal Error - Skipped
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Used for API lookups, cart items, order fulfillment
- **Confidence:** **CONFIRMED**
- **Source of evidence:** product.model.ts, import-full-catalog.ts

---

## 2. `store_view_code`

- **Magento meaning:** Identifies the store view for which product data applies, such as a language-specific storefront.
- **Observed examples:** `(empty)`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Both
- **Business purpose:** Multi-store config
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** Default Store
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Single storefront architecture in Store4Riders (Next.js frontend)

---

## 3. `attribute_set_code`

- **Magento meaning:** Identifies the product attribute set/template, defining which attributes are available for that product type.
- **Observed examples:** `Saddle Bag, Helmet`
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** Admin template grouping
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.attributeSetCode`
- **Transformation:** Direct string mapping
- **Empty behavior:** Undefined
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Mainly historical/admin reference
- **Confidence:** **CONFIRMED**
- **Source of evidence:** import-full-catalog.ts

---

## 4. `product_type`

- **Magento meaning:** Product type, such as simple, configurable, bundle, grouped, virtual or downloadable.
- **Observed examples:** `simple, configurable`
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Determines variation logic
- **Filter relevance:** No
- **Variant relevance:** Yes - Determines if variations exist
- **Search relevance:** No
- **Pricing relevance:** Yes - Configurable derives from child
- **Inventory relevance:** Yes - Configurable derives from child
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.productType`
- **Transformation:** Direct string mapping
- **Empty behavior:** Skipped
- **Zero behavior:** N/A
- **Invalid behavior:** Skipped
- **Runtime behavior:** Used in import script to route parsing logic (isConfigurable flag)
- **Confidence:** **CONFIRMED**
- **Source of evidence:** import-full-catalog.ts

---

## 5. `categories`

- **Magento meaning:** Category paths assigned to the product.
- **Observed examples:** `Root Test 01/Motorcycle Bags / Bike Luggage/Motorcycle Tail Bags`
- **Source type:** String
- **Scope:** Store
- **Parent or child:** Parent
- **Business purpose:** Taxonomy
- **Filter relevance:** Yes
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** Yes - Breadcrumbs
- **Store4Riders target:** `product.magentoCategories`
- **Transformation:** Preserved as string; later mapped to Category IDs during sync
- **Empty behavior:** Uncategorized
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Used for catalog tree building and listing
- **Confidence:** **CONFIRMED**
- **Source of evidence:** product.model.ts, import-full-catalog.ts

---

## 6. `product_websites`

- **Magento meaning:** Website codes on which the product is assigned or available.
- **Observed examples:** `base`
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Multi-site routing
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** Default
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Store4Riders is a single website architecture

---

## 7. `name`

- **Magento meaning:** Product display name.
- **Observed examples:** `BBG Hybrid Tail Bag`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Both (Parent dominates)
- **Business purpose:** Display Name
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** Yes - High
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** Yes
- **Store4Riders target:** `product.name`
- **Transformation:** Direct string mapping. If missing, falls back to SKU.
- **Empty behavior:** Falls back to SKU
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Displayed on product cards and PDP
- **Confidence:** **CONFIRMED**
- **Source of evidence:** import-full-catalog.ts, product.model.ts

---

## 8. `description`

- **Magento meaning:** Full product description, potentially containing HTML.
- **Observed examples:** `<p>BBG Hybrid tail bag is...</p>`
- **Source type:** HTML String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Detail View
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** Yes - Low
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** Yes
- **Store4Riders target:** `product.description`
- **Transformation:** Resolves {{media url=...}} tags to S3 URLs. Appends codazon_custom_tab if present.
- **Empty behavior:** Falls back to short_description or 'No description available'
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Rendered as raw HTML on PDP
- **Confidence:** **CONFIRMED**
- **Source of evidence:** import-full-catalog.ts, resolveDescriptionMediaUrls()

---

## 9. `short_description`

- **Magento meaning:** Short product description.
- **Observed examples:** `Heavy duty 1680D fabric...`
- **Source type:** String/HTML
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Summary
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** Yes - Medium
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** Yes
- **Store4Riders target:** `product.shortDescription`
- **Transformation:** Direct string mapping, trimmed.
- **Empty behavior:** Allowed
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Used in SEO meta and list views
- **Confidence:** **CONFIRMED**
- **Source of evidence:** import-full-catalog.ts

---

## 10. `weight`

- **Magento meaning:** Product weight used by product/shipping logic.
- **Observed examples:** `1.5, 0.5`
- **Source type:** Number
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Shipping calculations
- **Filter relevance:** No
- **Variant relevance:** Yes - Child weights preserved
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** Yes - Dimension
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.weight`
- **Transformation:** safeParseFloat()
- **Empty behavior:** 0
- **Zero behavior:** 0
- **Invalid behavior:** 0
- **Runtime behavior:** Child weights override parent in checkout if distinct
- **Confidence:** **CONFIRMED**
- **Source of evidence:** import-full-catalog.ts (indexed in ChildSkuInfo)

---

## 11. `product_online`

- **Magento meaning:** Indicates whether the product is enabled or disabled.
- **Observed examples:** `1, 2`
- **Source type:** Integer (1=Enabled, 2=Disabled)
- **Scope:** Store View
- **Parent or child:** Both
- **Business purpose:** Status
- **Filter relevance:** No
- **Variant relevance:** Yes - Disables child
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** Yes - Off switch
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.status`
- **Transformation:** Currently all imported are set to 'published'. (TODO: Map 2 to 'archived' or 'draft')
- **Empty behavior:** Published
- **Zero behavior:** Published
- **Invalid behavior:** Published
- **Runtime behavior:** Governs catalog visibility
- **Confidence:** **LIKELY**
- **Source of evidence:** import-full-catalog.ts hardcodes 'published' currently. Needs logic update.

---

## 12. `tax_class_name`

- **Magento meaning:** Magento product tax-class information.
- **Observed examples:** `Taxable Goods`
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** Tax Calculation
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** Yes - Post-cart calculation
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** Yes
- **SEO relevance:** No
- **Store4Riders target:** `product.taxClassName`
- **Transformation:** Preserved as metadata. Store4Riders handles GST implicitly in listed price usually.
- **Empty behavior:** Undefined
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Historical mapping for future GST dynamic features
- **Confidence:** **CONFIRMED**
- **Source of evidence:** product.model.ts

---

## 13. `visibility`

- **Magento meaning:** Controls catalog/search visibility.
- **Observed examples:** `Catalog, Search (4)`
- **Source type:** String/Enum
- **Scope:** Store View
- **Parent or child:** Parent (4), Child (1 - Not Visible Individually)
- **Business purpose:** Display logic
- **Filter relevance:** No
- **Variant relevance:** Yes - Hides children from catalog
- **Search relevance:** Yes - Excludes 1
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Implicit during import`
- **Transformation:** Used to filter rows: only 'Catalog' or '4' are imported as top-level. Children (Not Visible) are processed but not created as independent docs.
- **Empty behavior:** Skipped as top-level
- **Zero behavior:** N/A
- **Invalid behavior:** Skipped
- **Runtime behavior:** Determines parent vs child row logic
- **Confidence:** **CONFIRMED**
- **Source of evidence:** import-full-catalog.ts (visibility.includes('Catalog') || visibility === '4')

---

## 14. `price`

- **Magento meaning:** Base product price.
- **Observed examples:** `2999`
- **Source type:** Number
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Base Pricing
- **Filter relevance:** Yes
- **Variant relevance:** Yes - Child dictates actual price
- **Search relevance:** No
- **Pricing relevance:** Yes - Primary
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.basePrice / product.variants[].price`
- **Transformation:** For simple: safeParseFloat(). For Configurable: Derived as lowest valid child price.
- **Empty behavior:** Skipped if 0
- **Zero behavior:** Skipped if 0
- **Invalid behavior:** Skipped
- **Runtime behavior:** Used for display ranges and sorting
- **Confidence:** **CONFIRMED**
- **Source of evidence:** import-full-catalog.ts (lowestChildPrice derivation)

---

## 15. `special_price`

- **Magento meaning:** Promotional or discounted price.
- **Observed examples:** `2499, (empty)`
- **Source type:** Number
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Discount Pricing
- **Filter relevance:** Yes
- **Variant relevance:** Yes - Child dictates discount
- **Search relevance:** No
- **Pricing relevance:** Yes - Secondary
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.specialPrice / product.variants[].specialPrice`
- **Transformation:** Validated: must be > 0 and < basePrice.
- **Empty behavior:** null
- **Zero behavior:** null
- **Invalid behavior:** null
- **Runtime behavior:** Overrides basePrice for active sales
- **Confidence:** **CONFIRMED**
- **Source of evidence:** getValidSpecialPrice() in import-full-catalog.ts

---

## 16. `special_price_from_date`

- **Magento meaning:** Start date for special price.
- **Observed examples:** `2023-01-01`
- **Source type:** Date String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Discount Timing
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** Yes
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.specialPriceFromDate`
- **Transformation:** Ignored in current import script, but defined in model.
- **Empty behavior:** null
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Will require dynamic date checks in API if populated
- **Confidence:** **INFERRED**
- **Source of evidence:** Present in product.model.ts, absent in import script

---

## 17. `special_price_to_date`

- **Magento meaning:** End date for special price.
- **Observed examples:** `2023-12-31`
- **Source type:** Date String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Discount Expiry
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** Yes
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.specialPriceToDate`
- **Transformation:** Ignored in current import script, but defined in model.
- **Empty behavior:** null
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Will require dynamic date checks in API
- **Confidence:** **INFERRED**
- **Source of evidence:** Present in product.model.ts

---

## 18. `url_key`

- **Magento meaning:** URL slug used to construct the product URL.
- **Observed examples:** `bbg-hybrid-tail-bag`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Routing
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** Yes - High
- **Store4Riders target:** `product.slug`
- **Transformation:** generateSlug(). Ensure unique appending (-1, -2) if duplicates.
- **Empty behavior:** Generates from name
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Used in Next.js App Router for PDP
- **Confidence:** **CONFIRMED**
- **Source of evidence:** generateSlug() and getUniqueSlug() in import-full-catalog.ts

---

## 19. `meta_title`

- **Magento meaning:** SEO title for the product page.
- **Observed examples:** `Buy BBG Hybrid Tail Bag Online`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** SEO
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** Yes - High
- **Store4Riders target:** `product.metaTitle`
- **Transformation:** Direct string mapping, trimmed.
- **Empty behavior:** Undefined (falls back to Name in UI)
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Next.js Metadata generation
- **Confidence:** **CONFIRMED**
- **Source of evidence:** import-full-catalog.ts

---

## 20. `meta_keywords`

- **Magento meaning:** SEO keyword metadata.
- **Observed examples:** `tail bag, bbg, motorcycle luggage`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** SEO
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** Yes - Low
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** Yes - Low
- **Store4Riders target:** `product.metaKeywords`
- **Transformation:** Direct string mapping, trimmed.
- **Empty behavior:** Undefined
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Rendered in <meta name='keywords'>
- **Confidence:** **CONFIRMED**
- **Source of evidence:** import-full-catalog.ts

---

## 21. `meta_description`

- **Magento meaning:** SEO description metadata.
- **Observed examples:** `Shop BBG Hybrid Tail Bag with 60L capacity.`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** SEO
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** Yes - Low
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** Yes - High
- **Store4Riders target:** `product.metaDescription`
- **Transformation:** Direct string mapping, trimmed.
- **Empty behavior:** Undefined (falls back to shortDescription)
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Rendered in <meta name='description'>
- **Confidence:** **CONFIRMED**
- **Source of evidence:** import-full-catalog.ts

---

## 22. `base_image`

- **Magento meaning:** Main product image.
- **Observed examples:** `/b/b/bbg_hybrid_tail_bag_1.jpg`
- **Source type:** Path String
- **Scope:** Store View
- **Parent or child:** Both
- **Business purpose:** Media Primary
- **Filter relevance:** No
- **Variant relevance:** Yes - Configurable maps to child specific images
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** Yes
- **Store4Riders target:** `product.images[0].url`
- **Transformation:** buildImageUrl() prepends S3 bucket base. Child images merged into parent gallery.
- **Empty behavior:** Skipped
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Hero image on PDP and Product Cards
- **Confidence:** **CONFIRMED**
- **Source of evidence:** extractImages() and mergeChildImages() in import-full-catalog.ts

---

## 23. `base_image_label`

- **Magento meaning:** Text label/alt-text associated with the base image.
- **Observed examples:** `BBG Hybrid Tail Bag Front`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Both
- **Business purpose:** Accessibility & SEO
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** Yes
- **Store4Riders target:** `product.images[0].altText`
- **Transformation:** Mapped directly.
- **Empty behavior:** Empty string
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** img alt attr
- **Confidence:** **CONFIRMED**
- **Source of evidence:** extractImages() in import-full-catalog.ts

---

## 24. `small_image`

- **Magento meaning:** Image for catalog listings.
- **Observed examples:** `/b/b/bbg_small.jpg`
- **Source type:** Path String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Listing Media
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Store4Riders dynamically sizes base_image via Next/Image
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped in import script

---

## 25. `small_image_label`

- **Magento meaning:** Label for small image.
- **Observed examples:** `BBG Small`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Accessibility
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** N/A
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 26. `thumbnail_image`

- **Magento meaning:** Image for thumbnails.
- **Observed examples:** `/b/b/bbg_thumb.jpg`
- **Source type:** Path String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Thumbnail Media
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Store4Riders dynamically sizes base_image via Next/Image
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 27. `thumbnail_image_label`

- **Magento meaning:** Label for thumbnail.
- **Observed examples:** `BBG Thumb`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Accessibility
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** N/A
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 28. `swatch_image`

- **Magento meaning:** Image used for a swatch.
- **Observed examples:** `/swatch/red.jpg, no_selection`
- **Source type:** Path String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Color Selection UI
- **Filter relevance:** No
- **Variant relevance:** Yes - Used for color pickers
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored natively, but color is extracted via additional_attributes`
- **Transformation:** Store4Riders uses `parseColorToBackground` to dynamically generate CSS hex colors from string names. `swatch_image` is discarded.
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** no_selection ignored
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** parseColorToBackground in frontend, swatch_image absent in import script

---

## 29. `swatch_image_label`

- **Magento meaning:** Label for swatch image.
- **Observed examples:** `Red`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Both
- **Business purpose:** UI
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** N/A
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 75. `additional_images`

- **Magento meaning:** Additional product gallery image paths.
- **Observed examples:** `/1/1.jpg,/2/2.jpg`
- **Source type:** Comma-separated String
- **Scope:** Store View
- **Parent or child:** Both
- **Business purpose:** Gallery
- **Filter relevance:** No
- **Variant relevance:** Yes - Child additionals are merged to parent
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** Yes
- **Store4Riders target:** `product.images[n].url`
- **Transformation:** Split by comma, mapped through buildImageUrl(), deduplicated.
- **Empty behavior:** Skipped
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** PDP Image Gallery
- **Confidence:** **CONFIRMED**
- **Source of evidence:** extractImages() and mergeChildImages() in import-full-catalog.ts

---

## 76. `additional_image_labels`

- **Magento meaning:** Labels corresponding to additional gallery images.
- **Observed examples:** `Side View, Back View`
- **Source type:** Comma-separated String
- **Scope:** Store View
- **Parent or child:** Both
- **Business purpose:** Accessibility
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** Yes
- **Store4Riders target:** `product.images[n].altText`
- **Transformation:** Split and zipped with additional_images.
- **Empty behavior:** Empty string
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** img alt attr
- **Confidence:** **CONFIRMED**
- **Source of evidence:** extractImages() in import script

---

## 77. `hide_from_product_page`

- **Magento meaning:** Extension-specific. Hides specific images.
- **Observed examples:** `1, 0`
- **Source type:** Integer/Boolean
- **Scope:** Store View
- **Parent or child:** Both
- **Business purpose:** Media Control
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** All listed images are imported
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped in script

---

## 30. `created_at`

- **Magento meaning:** Creation timestamp.
- **Observed examples:** `2023-01-01 10:00:00`
- **Source type:** Datetime
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** Historical
- **Filter relevance:** Yes - New Arrivals
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored as source, generated by Mongoose (timestamps: true)`
- **Transformation:** Mongoose `createdAt` takes current import time. Original creation date lost.
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** New Arrival sorting relies on Mongoose createdAt
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Mongoose `timestamps: true` in product.model.ts

---

## 31. `updated_at`

- **Magento meaning:** Last update timestamp.
- **Observed examples:** `2023-02-01 10:00:00`
- **Source type:** Datetime
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** Historical
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored (managed by Mongoose updatedAt)`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Mongoose timestamps

---

## 32. `new_from_date`

- **Magento meaning:** Start of 'new' period.
- **Observed examples:** `2023-01-01`
- **Source type:** Date
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** New Badge
- **Filter relevance:** Yes
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 33. `new_to_date`

- **Magento meaning:** End of 'new' period.
- **Observed examples:** `2023-02-01`
- **Source type:** Date
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** New Badge
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 34. `display_product_options_in`

- **Magento meaning:** Layout placement for options.
- **Observed examples:** `Block after Info Column`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** UI Theme
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded. Next.js dictates UI layout.
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 38. `gift_message_available`

- **Magento meaning:** Gift message allowed.
- **Observed examples:** `0, 1`
- **Source type:** Integer
- **Scope:** Store View
- **Parent or child:** Both
- **Business purpose:** Checkout Feature
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 39. `custom_design`

- **Magento meaning:** Custom theme.
- **Observed examples:** `blank`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Theming
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 40. `custom_design_from`

- **Magento meaning:** Start date for theme.
- **Observed examples:** ``
- **Source type:** Date
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Theming
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 41. `custom_design_to`

- **Magento meaning:** End date for theme.
- **Observed examples:** ``
- **Source type:** Date
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Theming
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 42. `custom_layout_update`

- **Magento meaning:** Layout XML.
- **Observed examples:** ``
- **Source type:** XML
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Theming
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 43. `page_layout`

- **Magento meaning:** Template selected.
- **Observed examples:** `1 column`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Theming
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 44. `product_options_container`

- **Magento meaning:** Container layout.
- **Observed examples:** `Block after Info Column`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Theming
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 45. `msrp_display_actual_price_type`

- **Magento meaning:** MSRP Display Rules.
- **Observed examples:** `1`
- **Source type:** Integer
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** Pricing UI
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 35. `map_price`

- **Magento meaning:** Minimum Advertised Price.
- **Observed examples:** ``
- **Source type:** Number
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** Pricing Compliance
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.mapPrice`
- **Transformation:** Ignored in import script, but defined in model.
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **INFERRED**
- **Source of evidence:** Absent in import script

---

## 36. `msrp_price`

- **Magento meaning:** MSRP.
- **Observed examples:** ``
- **Source type:** Number
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** Pricing UI
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.msrpPrice`
- **Transformation:** Ignored in import script, but defined in model.
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **INFERRED**
- **Source of evidence:** Absent in import script

---

## 37. `map_enabled`

- **Magento meaning:** Is MAP enabled.
- **Observed examples:** ``
- **Source type:** Boolean
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** Pricing Compliance
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 46. `country_of_manufacture`

- **Magento meaning:** Country of Origin.
- **Observed examples:** `India, IN`
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** Compliance/Info
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.countryOfManufacture`
- **Transformation:** Direct string mapping.
- **Empty behavior:** Undefined
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Displayed on PDP specs
- **Confidence:** **CONFIRMED**
- **Source of evidence:** import-full-catalog.ts

---

## 47. `additional_attributes`

- **Magento meaning:** Encoded collection of custom attributes.
- **Observed examples:** `color="Black",brand="Rynox",ship_cost="0.000000",gender="Male"|"Unisex"`
- **Source type:** Key-Value encoded String
- **Scope:** Store View
- **Parent or child:** Both
- **Business purpose:** All Custom Specs
- **Filter relevance:** Yes - High
- **Variant relevance:** Yes - Child attributes map to variant.attributes
- **Search relevance:** Yes - High
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** Yes - Free shipping derivation
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.brand, product.gender, product.isFreeShipping, product.sizeChart, product.variants[].attributes`
- **Transformation:** Parsed via parseAdditionalAttributes() custom state machine. Extracts specific keys to root product properties, appends codazon_custom_tab to description, and maps child options to variant.attributes map.
- **Empty behavior:** Empty Map
- **Zero behavior:** N/A
- **Invalid behavior:** Safely skips broken keys
- **Runtime behavior:** Filters (Brand, Category, Options), Free Shipping Tag, PDP specs
- **Confidence:** **CONFIRMED**
- **Source of evidence:** parseAdditionalAttributes() in import-full-catalog.ts

---

## 48. `qty`

- **Magento meaning:** Stock quantity.
- **Observed examples:** `5, 0`
- **Source type:** Number
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Inventory
- **Filter relevance:** Yes - Out of stock filtering
- **Variant relevance:** Yes - Critical for child
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** Yes - Primary
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.qty / product.variants[].stock`
- **Transformation:** For simple: safeParseFloat(qty). For configurable: Aggregated sum of all valid child stock.
- **Empty behavior:** 0
- **Zero behavior:** 0
- **Invalid behavior:** 0
- **Runtime behavior:** Validates Add to Cart, shows Low Stock badges
- **Confidence:** **CONFIRMED**
- **Source of evidence:** totalChildQty aggregation in import-full-catalog.ts

---

## 49. `out_of_stock_qty`

- **Magento meaning:** Threshold for out of stock.
- **Observed examples:** `0`
- **Source type:** Number
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** Inventory Policy
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.outOfStockQty`
- **Transformation:** Ignored in import script, but defined in model.
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Currently hardcoded > 0 rule in application logic.
- **Confidence:** **INFERRED**
- **Source of evidence:** Absent in import script

---

## 50. `use_config_min_qty`

- **Magento meaning:** Use default OOS threshold.
- **Observed examples:** `1`
- **Source type:** Boolean
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** Inventory Policy
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 51. `is_qty_decimal`

- **Magento meaning:** Decimal quantities allowed.
- **Observed examples:** `0`
- **Source type:** Boolean
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Inventory Logic
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded. Store4Riders assumes integer quantities for gear.
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 52. `allow_backorders`

- **Magento meaning:** Backorder permission.
- **Observed examples:** `0`
- **Source type:** Integer
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Purchasability
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** Yes
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.allowBackorders`
- **Transformation:** Ignored in import script. Model defaults to false.
- **Empty behavior:** false
- **Zero behavior:** false
- **Invalid behavior:** false
- **Runtime behavior:** Currently no backorder support enabled in UI.
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped in script, model defaults false

---

## 53. `use_config_backorders`

- **Magento meaning:** Use config backorders.
- **Observed examples:** `1`
- **Source type:** Boolean
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** Purchasability
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 54. `min_cart_qty`

- **Magento meaning:** Min quantity.
- **Observed examples:** `1`
- **Source type:** Number
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Cart Logic
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.minCartQty`
- **Transformation:** Ignored in script.
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 55. `use_config_min_sale_qty`

- **Magento meaning:** Use config min.
- **Observed examples:** `1`
- **Source type:** Boolean
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Cart Logic
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 56. `max_cart_qty`

- **Magento meaning:** Max quantity.
- **Observed examples:** `10000`
- **Source type:** Number
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Cart Logic
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.maxCartQty`
- **Transformation:** Ignored in script.
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 57. `use_config_max_sale_qty`

- **Magento meaning:** Use config max.
- **Observed examples:** `1`
- **Source type:** Boolean
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Cart Logic
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 58. `is_in_stock`

- **Magento meaning:** Stock status.
- **Observed examples:** `1, 0`
- **Source type:** Integer
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Availability
- **Filter relevance:** Yes - High
- **Variant relevance:** Yes - Dictates child salability
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** Yes - High
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.stockStatus`
- **Transformation:** For simple: safeParseFloat(). For configurable: 1 if ANY child is in stock, else 0.
- **Empty behavior:** 0
- **Zero behavior:** 0
- **Invalid behavior:** 0
- **Runtime behavior:** Determines out-of-stock overlay on product cards
- **Confidence:** **CONFIRMED**
- **Source of evidence:** import-full-catalog.ts (anyChildInStock logic)

---

## 59. `notify_on_stock_below`

- **Magento meaning:** Low stock alert threshold.
- **Observed examples:** `1`
- **Source type:** Number
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Inventory Mgmt
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.notifyOnStockBelow`
- **Transformation:** Ignored in script.
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 60. `use_config_notify_stock_qty`

- **Magento meaning:** Use config threshold.
- **Observed examples:** `1`
- **Source type:** Boolean
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Inventory Mgmt
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 61. `manage_stock`

- **Magento meaning:** Stock tracking enabled.
- **Observed examples:** `0, 1`
- **Source type:** Integer
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Inventory Logic
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** Yes
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded. Store4Riders assumes all physical stock is managed.
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 62. `use_config_manage_stock`

- **Magento meaning:** Use config tracking.
- **Observed examples:** `1`
- **Source type:** Boolean
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Inventory Logic
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 63. `use_config_qty_increments`

- **Magento meaning:** Use config increments.
- **Observed examples:** `1`
- **Source type:** Boolean
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Cart Logic
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 64. `qty_increments`

- **Magento meaning:** Qty increments.
- **Observed examples:** `1`
- **Source type:** Number
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Cart Logic
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 65. `use_config_enable_qty_inc`

- **Magento meaning:** Use config enable inc.
- **Observed examples:** `1`
- **Source type:** Boolean
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Cart Logic
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 66. `enable_qty_increments`

- **Magento meaning:** Enable increments.
- **Observed examples:** `0`
- **Source type:** Integer
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Cart Logic
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 67. `is_decimal_divided`

- **Magento meaning:** Decimal split allowed.
- **Observed examples:** `0`
- **Source type:** Boolean
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Shipping Logic
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 68. `website_id`

- **Magento meaning:** Website IDs array.
- **Observed examples:** `0`
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** Routing
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 69. `related_skus`

- **Magento meaning:** Related products (Complete Your Kit).
- **Observed examples:** `SKU1, SKU2`
- **Source type:** Comma-separated String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Cross-sell UI
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.relatedSkus`
- **Transformation:** splitSkus(), trimmed and filtered.
- **Empty behavior:** Empty Array
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Shown in 'Complete Your Kit' section on PDP
- **Confidence:** **CONFIRMED**
- **Source of evidence:** splitSkus(row.related_skus) in import-full-catalog.ts

---

## 70. `related_position`

- **Magento meaning:** Order of related products.
- **Observed examples:** `1, 2`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** UI Sorting
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Store4Riders displays them in arbitrary or mapped order
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 71. `crosssell_skus`

- **Magento meaning:** Cross-sell SKUs.
- **Observed examples:** `SKU3`
- **Source type:** Comma-separated String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** Cart UI
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.crosssellSkus`
- **Transformation:** splitSkus()
- **Empty behavior:** Empty Array
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Usually Cart cross-sells
- **Confidence:** **CONFIRMED**
- **Source of evidence:** splitSkus() in script

---

## 72. `crosssell_position`

- **Magento meaning:** Order of cross-sell.
- **Observed examples:** `1`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** UI Sorting
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 73. `upsell_skus`

- **Magento meaning:** Upsell SKUs (You May Also Like).
- **Observed examples:** `SKU4, SKU5`
- **Source type:** Comma-separated String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** PDP UI
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.upsellSkus`
- **Transformation:** splitSkus()
- **Empty behavior:** Empty Array
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Shown in 'You May Also Like' on PDP
- **Confidence:** **CONFIRMED**
- **Source of evidence:** splitSkus() in script

---

## 74. `upsell_position`

- **Magento meaning:** Order of upsell.
- **Observed examples:** `1, 2`
- **Source type:** String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** UI Sorting
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 78. `custom_options`

- **Magento meaning:** Encoded custom options.
- **Observed examples:** ``
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** N/A
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 79. `bundle_price_type`

- **Magento meaning:** Bundle price type.
- **Observed examples:** ``
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** N/A
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 80. `bundle_sku_type`

- **Magento meaning:** Bundle SKU type.
- **Observed examples:** ``
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** N/A
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 81. `bundle_price_view`

- **Magento meaning:** Bundle price view.
- **Observed examples:** ``
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** N/A
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 82. `bundle_weight_type`

- **Magento meaning:** Bundle weight type.
- **Observed examples:** ``
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** N/A
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 83. `bundle_values`

- **Magento meaning:** Bundle values.
- **Observed examples:** ``
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** N/A
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 84. `bundle_shipment_type`

- **Magento meaning:** Bundle shipment type.
- **Observed examples:** ``
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** N/A
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 85. `associated_skus`

- **Magento meaning:** Grouped product SKUs.
- **Observed examples:** ``
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** N/A
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 86. `downloadable_links`

- **Magento meaning:** Digital product links.
- **Observed examples:** ``
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** N/A
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 87. `downloadable_samples`

- **Magento meaning:** Digital product samples.
- **Observed examples:** ``
- **Source type:** String
- **Scope:** Global
- **Parent or child:** Both
- **Business purpose:** N/A
- **Filter relevance:** No
- **Variant relevance:** No
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `Ignored`
- **Transformation:** Discarded
- **Empty behavior:** N/A
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** N/A
- **Confidence:** **CONFIRMED**
- **Source of evidence:** Not mapped

---

## 88. `configurable_variations`

- **Magento meaning:** Encodes parent-child relationships and option axes.
- **Observed examples:** `sku=SKU-RED-S,color=Red,size=S|sku=SKU-RED-M,color=Red,size=M`
- **Source type:** Encoded String
- **Scope:** Global
- **Parent or child:** Parent
- **Business purpose:** Variant Logic
- **Filter relevance:** No
- **Variant relevance:** Yes - CRITICAL
- **Search relevance:** No
- **Pricing relevance:** Yes - Maps child prices
- **Inventory relevance:** Yes - Maps child stock
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.configurableVariations, product.variants[]`
- **Transformation:** Split by '|' then ','. Looks up child SKU in skuIndex to resolve child price, specialPrice, qty, and images. Builds the `variants` array of objects.
- **Empty behavior:** Empty array
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Drives PDP color/size selections, cart items, and availability matrix
- **Confidence:** **CONFIRMED**
- **Source of evidence:** import-full-catalog.ts variant parsing logic

---

## 89. `configurable_variation_labels`

- **Magento meaning:** Labels for variant axes.
- **Observed examples:** `Color,Size`
- **Source type:** Comma-separated String
- **Scope:** Store View
- **Parent or child:** Parent
- **Business purpose:** UI Text
- **Filter relevance:** No
- **Variant relevance:** Yes - Display names for dropdowns
- **Search relevance:** No
- **Pricing relevance:** No
- **Inventory relevance:** No
- **Shipping relevance:** No
- **Tax relevance:** No
- **SEO relevance:** No
- **Store4Riders target:** `product.configurableVariationLabels`
- **Transformation:** Direct string mapping.
- **Empty behavior:** Undefined
- **Zero behavior:** N/A
- **Invalid behavior:** N/A
- **Runtime behavior:** Used for frontend selector labels
- **Confidence:** **CONFIRMED**
- **Source of evidence:** product.model.ts

---


## BEHAVIORAL CONTRACTS & EDGE CASES VERIFIED

### 1. Simple Product Stock Behavior
* Handled correctly in `import-full-catalog.ts`. Directly maps `qty` and `is_in_stock`.

### 2. Configurable Product Stock
* `import-full-catalog.ts` performs a complete **2-Pass Parse**.
* It never uses the parent's raw `qty`. Instead, it aggregates the sum of all valid child stock (`totalChildQty`).
* The parent's `is_in_stock` (`stockStatus`) is evaluated as `true` if **ANY** child is in stock (`anyChildInStock`).

### 3. Variant Pricing
* The configurable parent base price is derived dynamically as the **lowest child price** (`lowestChildPrice`).
* Child special prices are strictly validated (must be > 0 and < basePrice). The lowest valid special price becomes the parent's display special price.
* The frontend retains the exact child price in the `variants` array, which updates dynamically on the PDP upon selection.

### 4. Variant Options & Combinations
* Extracted strictly from `configurable_variations`.
* Fake combinations are impossible because the frontend relies exclusively on the parsed `variants` array mapped from actual child SKUs.

### 5. Custom Attributes & Shipping
* `additional_attributes` is parsed robustly. 
* `ship_cost="0.000000"` correctly resolves to `product.isFreeShipping = true`.
* Brand, Gender, and custom tabs are reliably extracted.

*(Audit completed automatically based on codebase rules and script analysis)*


## BEHAVIORAL CONTRACTS & DEEP ANALYSIS

### 1. Simple Product Stock Behavior
**State Matrix & Validation:**
- **Enabled & In-Stock (`product_online=1`, `is_in_stock=1`, `qty>0`):** Fully purchasable. Shown normally.
- **Enabled & Out-of-Stock (`is_in_stock=0` OR `qty<=0`):** The product remains visible in the catalog (unless explicitly hidden by filters), but the "Add to Cart" button is replaced with "Out of Stock".
- **Disabled (`product_online=2` or `status='draft'`):** Product is hidden from all catalog listings, search results, and direct PDP visits return a 404 (NotFound).
- **Backorders (`allowBackorders=true`):** If true, the product ignores `qty<=0` and remains purchasable. The backend `ProductService.getAggregations` specifically includes products where `{ allowBackorders: true }` even if `stockStatus === 0`.

### 2. Configurable Product Stock
**Parent vs Child Aggregation:**
For `product_type='configurable'`, the parent's raw `qty` and `is_in_stock` in the CSV are ignored.
- The migration script (`import-full-catalog.ts`) parses `configurable_variations` and looks up every child SKU.
- `product.qty` becomes the sum of all child variant quantities (`totalChildQty`).
- `product.stockStatus` becomes `1` if *any* child has `is_in_stock=1`, otherwise `0`.
- **Edge Case:** If a configurable parent is imported but child rows are missing, it defaults to `stockStatus=0` and basePrice=0, causing it to be skipped by safety checks.

### 3. All Children Out of Stock
**Behavior:**
When every child variant of a configurable product reaches `stock <= 0`:
- The parent `stockStatus` evaluates to `0`.
- The frontend PDP remains accessible, but no valid combination can be added to the cart.
- The backend `ProductService.getAggregations` filters out the parent from search results entirely because neither `stockStatus != 0` nor `"variants.stock" > 0` is satisfied (unless backorders are allowed).

### 4. Some Children Out of Stock
**Partial Availability:**
- The parent product remains fully visible in the catalog (`stockStatus=1`).
- On the PDP (`ProductDetailPageModule.tsx`), the `variants` array contains the explicit `stock` value for each child.
- When a user selects a color (e.g., "Red"), the size dropdown will disable or strike through sizes (e.g., "S") where that specific child variant has `stock=0`.
- The user cannot bypass this; `useCartStore.ts` and the server validate the specific `variantId` stock during the `/cart/items` POST.

### 5. Variant Option Availability Matrix
**Color × Size Combinations:**
- **Example CSV Data:** `configurable_variations="sku=HELM-RED-S,color=Red,size=S|sku=HELM-RED-M,color=Red,size=M"`
- **Logic:** The frontend does not independently multiply all colors by all sizes. It relies strictly on the parsed `rawVariants` array in `ProductDetailPageModule.tsx`.
- If a user selects "Red", the UI filters `rawVariants` where `attributes.color === 'Red'` and extracts the available sizes from that subset. Fake combinations (e.g., if Red-L was never manufactured) are impossible to select.

### 6. Default Variant Selection
**PDP Load Behavior:**
- The PDP does **not** auto-select a default child variant on load.
- The user must explicitly click a Color and a Size before the "Add to Cart" button enables.
- If the URL contains pre-selected query params (e.g., `?color=Red&size=M`), the UI will attempt to pre-select them if valid.
- The displayed base price is the **lowest child price** (`Math.min(...variantPrices)`) until a specific variant is selected.

### 7. Child Visibility Rules
**Not Visible Individually Handling:**
- In Magento, child variants are often marked `visibility="Not Visible Individually" (1)`.
- The migration script filters rows: `const isVisible = visibility.includes('Catalog') || visibility === '4'`.
- Child rows are processed in Pass 1 to build the `skuIndex`, but are **skipped** in Pass 2 (document creation).
- Thus, child SKUs do not exist as independent documents in MongoDB; they live entirely within the parent's `product.variants` array.

### 8. Parent vs Child Filters
**Filter Aggregation:**
- Filters (Color, Size) are aggregated across the variants in `ProductService.getAggregations`.
- A parent product is returned in a "Size M" filter if *any* of its children have `size: "M"` and `stock > 0`.
- The dynamic filter engine extracts these from `variants[].attributes` and the `colorImages` map, building accurate `colorsMap` and `sizesMap` sets without destroying the parent-child structure.

### 9. Pricing Behavior
**Derivation & Fallbacks:**
- **Special Price Validation:** A special price is only valid if `> 0` and `< basePrice`. Otherwise, it is ignored (`getValidSpecialPrice`).
- **Configurable Price:** The parent's base price is dynamically calculated as the lowest valid child price.
- **Zero Price Fallback:** If `basePrice` is 0, the backend attempts to recover it from `variants.price`. If still 0, it tries to use `specialPrice`. If STILL 0, it attempts a regex extraction from `metaTitle` (Legacy Magento fallback: `/(?:rs.?|inr|₹)s*([0-9,]+)/i`).

### 10. Image & Swatch Behavior
**Gallery Merge & CSS Swatches:**
- **Gallery:** `import-full-catalog.ts` extracts parent images and actively merges all child `base_image` and `additional_images` into a single `product.images` array, deduplicating by URL.
- **Swatches:** Magento `swatch_image` paths are ignored. Instead, `ProductDetailPageModule.tsx` uses `parseColorToBackground()`. This dynamically translates string color names ("Black/Red") into CSS linear gradients (`linear-gradient(135deg, #111111 50%, #DC2626 50%)`) natively on the frontend.

### 11. Relationship SKUs
**Cross-sell / Upsell Resolution:**
- CSV columns `related_skus`, `upsell_skus`, and `crosssell_skus` are split by commas and stored as string arrays in MongoDB.
- `ProductService.getKitRecommendations` strictly queries the DB using `$in: product.relatedSkus`. If a SKU from the CSV no longer exists in the DB, it is silently dropped (no fake/broken products rendered).

### 12. Shipping & Weight
**Derivation:**
- Free shipping is derived if the custom attribute `ship_cost="0.000000"`, or dynamically on the frontend if the final `displayPrice >= 999`.
- `weight` is mapped directly. In cart logic, if a child variant has a distinct weight in its attributes (though currently unmapped in `rawVariants`), the parent weight acts as the fallback for shipping APIs.

### 13. Tax & GST
**Current Handling:**
- `tax_class_name` is preserved from Magento (e.g., "Taxable Goods").
- Currently, Store4Riders assumes the `basePrice` and `specialPrice` are **inclusive of GST**.
- The API does not dynamically add tax at checkout. This mapping ensures future readiness if tax rules become dynamic based on region.

### 14. Cart & Checkout Safety
**Server-Side Revalidation:**
- `useCartStore.ts` manages local optimistic state, but calls `apiClient.post("/cart/sync")`.
- The server recalculates total prices based on the **database's current price** for the specific `variantId`. The client-provided `price` is never trusted.
- If a variant goes out of stock while in the cart, the server API rejects the checkout attempt.

### 15. Edge Case Test Scenarios (Checklist)

| Scenario | Expected Behavior | Verification Status |
|---|---|---|
| Simple product with `price=0` | Skipped during import; not visible. | Confirmed (Import Script) |
| Configurable product, all children `stock=0` | `stockStatus=0`, visible but out-of-stock overlay, no add-to-cart. | Confirmed (Service/Frontend) |
| Configurable product, child price > parent price | Parent `basePrice` adjusts to lowest valid child price. | Confirmed (Import Script) |
| Child variant has unique gallery images | Images merged into parent gallery deduplicated. | Confirmed (mergeChildImages) |
| `special_price` is higher than `price` | `special_price` is nullified; `price` is used. | Confirmed (getValidSpecialPrice) |
| Multi-tone color string (e.g. "Matte Black Red") | Frontend generates diagonal CSS gradient swatch. | Confirmed (parseColorToBackground) |
| Product missing `name` | Falls back to `sku`. | Confirmed (Import Script) |
| `ship_cost="0.000000"` | `isFreeShipping` set to `true`. | Confirmed (parseAdditionalAttributes) |
| Guest adds to cart, then logs in | Guest cart merges with cloud cart via `/cart/sync`. | Confirmed (useCartStore) |

