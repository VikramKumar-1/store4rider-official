const fs = require('fs');
const path = 'frontend/src/modules/catalog/components/SidebarFilters.tsx';
const content = fs.readFileSync(path, 'utf8');

const returnIndex = content.indexOf('return (');
if (returnIndex === -1) {
  console.log('Return statement not found');
  process.exit(1);
}

// Slice everything before the first `return (`
const prefix = content.slice(0, returnIndex);

const newReturnBlock = `return (
    <div className="w-full flex flex-col font-sans">
      
      {/* SHOPPING OPTIONS Header */}
      <div className="mb-2">
        <h3 className="text-[22px] text-neutral-900 font-light mb-4">Shop By</h3>
        <div className="border-t-2 border-neutral-900 w-12 mb-4"></div>
        <h4 className="text-[13px] font-bold uppercase text-neutral-900 tracking-wide">SHOPPING OPTIONS</h4>
      </div>

      {/* Dynamic Filter Sections powered by Backend filterConfig */}
      {(aggregations?.filterConfig || [
        { code: "category", label: "Category" },
        { code: "price", label: "Price" },
        { code: "size", label: "Size" },
        { code: "brand", label: "Brand" },
        { code: "color", label: "Color" }
      ]).map((config) => {
        
        // 1. Categories
        if (config.code === "category" && !currentCategory && CATEGORIES.length > 0) {
          return (
            <AccordionSection key="category" title={config.label} defaultOpen={true}>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {CATEGORIES.map((cat) => {
                  const active = isCategoryActive(cat.slug);
                  return (
                    <label 
                      key={cat.fullName} 
                      className="flex items-center gap-2 cursor-pointer group"
                      style={{ paddingLeft: \`\${cat.indent}px\` }}
                    >
                      <input 
                        type="checkbox" 
                        checked={active}
                        onChange={() => handleCategoryClick(cat.slug)}
                        className="w-3.5 h-3.5 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer"
                      />
                      <span className={\`text-[13px] \${active ? "text-banner font-semibold" : "text-neutral-700 group-hover:text-banner"}\`}>
                        {cat.displayName}
                      </span>
                      <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 tabular-nums">
                        {cat.count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </AccordionSection>
          );
        }

        // 2. Price
        if (config.code === "price") {
          return (
            <AccordionSection key="price" title={config.label} defaultOpen={true}>
              <div className="flex flex-col gap-2">
                {PRICE_RANGES.map((range) => {
                  const active = activePriceId === range.id;
                  return (
                    <button
                      key={range.id}
                      onClick={() => handlePriceSelect(range)}
                      className="flex items-center gap-2 text-[13px] text-left cursor-pointer group"
                    >
                      <ChevronRight className={\`w-3.5 h-3.5 \${active ? "text-banner" : "text-neutral-400 group-hover:text-banner"}\`} />
                      <span className={active ? "text-banner font-semibold" : "text-neutral-700 group-hover:text-banner"}>
                        {range.short}
                      </span>
                    </button>
                  );
                })}
              </div>
            </AccordionSection>
          );
        }

        // 3. Size
        if (config.code === "size" && SIZES.length > 0) {
          return (
            <AccordionSection key="size" title={config.label} defaultOpen={true}>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {SIZES.map((sz) => {
                  const active = activeSizes.includes(sz);
                  return (
                    <label key={sz} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={active}
                        onChange={() => handleSizeToggle(sz)}
                        className="w-3.5 h-3.5 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer"
                      />
                      <span className={\`text-[13px] \${active ? "text-banner font-semibold" : "text-neutral-700 group-hover:text-banner"}\`}>
                        {sz}
                      </span>
                    </label>
                  );
                })}
              </div>
            </AccordionSection>
          );
        }

        // 4. Brand
        if (config.code === "brand" && BRANDS.length > 0) {
          return (
            <AccordionSection key="brand" title={config.label} defaultOpen={true}>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {BRANDS.map((brand) => {
                  const active = activeBrands.includes(brand.name);
                  return (
                    <label key={brand.name} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={active}
                        onChange={() => handleBrandToggle(brand.name)}
                        className="w-3.5 h-3.5 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer"
                      />
                      <span className={\`text-[13px] \${active ? "text-banner font-semibold" : "text-neutral-700 group-hover:text-banner"}\`}>
                        {brand.short}
                      </span>
                      <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 tabular-nums">
                        {brand.count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </AccordionSection>
          );
        }

        // 5. Color
        if (config.code === "color" && COLOURS.length > 0) {
          return (
            <AccordionSection key="color" title={config.label} defaultOpen={true}>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {COLOURS.map((color) => {
                  const active = activeColours.includes(color.name);
                  return (
                    <label key={color.name} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={active}
                        onChange={() => handleColourToggle(color.name)}
                        className="w-3.5 h-3.5 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer"
                      />
                      <div className="w-3 h-3 rounded-sm border border-neutral-300" style={{ backgroundColor: color.hex }}></div>
                      <span className={\`text-[13px] \${active ? "text-banner font-semibold" : "text-neutral-700 group-hover:text-banner"}\`}>
                        {color.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </AccordionSection>
          );
        }

        // 6. Dynamic Filter Attributes (helmet_type, gender, material, etc)
        const dynamicFilter = DYNAMIC_FILTERS.find(df => df.code === config.code);
        if (dynamicFilter && dynamicFilter.values.length > 0) {
          const paramValue = searchParams.get(dynamicFilter.code) || "";
          const activeValues = Array.from(new Set(paramValue ? paramValue.split(",").map((v) => v.trim()) : []));
          
          return (
            <AccordionSection key={dynamicFilter.code} title={dynamicFilter.label} defaultOpen={true}>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                {dynamicFilter.values.map((val) => {
                  const active = activeValues.includes(val.name);
                  return (
                    <label key={val.name} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={active}
                        onChange={() => handleDynamicFilterToggle(dynamicFilter.code, val.name)}
                        className="w-3.5 h-3.5 rounded-sm border-neutral-300 text-banner focus:ring-banner cursor-pointer"
                      />
                      <span className={\`text-[13px] \${active ? "text-banner font-semibold" : "text-neutral-700 group-hover:text-banner"}\`}>
                        {val.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 tabular-nums">
                        {val.count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </AccordionSection>
          );
        }

        return null;
      })}
    </div>
  );
}
`;

fs.writeFileSync(path, prefix + newReturnBlock);
console.log('Successfully sliced and replaced SidebarFilters.tsx return block');
