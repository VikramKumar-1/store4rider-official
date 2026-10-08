import { NextResponse } from 'next/server';
import fs from 'fs';

export async function GET() {
    const filePath = 'c:/Users/vikur/Downloads/store4riders/frontend/src/modules/catalog/index.tsx';
    let content = fs.readFileSync(filePath, 'utf-8');

    // Add import
    if (!content.includes('import { StoreReviews }')) {
        content = content.replace(
            'import { useSearchParams, useRouter, useParams, usePathname } from "next/navigation";',
            'import { useSearchParams, useRouter, useParams, usePathname } from "next/navigation";\nimport { StoreReviews } from "@/modules/product-detail/components/StoreReviews";'
        );
    }

    // Replace CategoryDescriptionBlock with the dual accordions
    const searchStr = '<CategoryDescriptionBlock description={categoryNode?.description} pageTitle={pageTitle} />';
    const replacement = `
        {/* Category Description & Google Reviews Accordions */}
        <div className="w-full flex flex-col gap-2 mb-6 mt-4">
          <CategorySEOAccordion 
            categoryName="Category Info & Reviews" 
            items={[
              ...(categoryNode?.description ? [{
                id: 'cat-desc',
                title: 'Category Description',
                content: <CategoryDescriptionBlock description={categoryNode.description} pageTitle={pageTitle} disableToggle={true} />
              }] : []),
              {
                id: 'google-reviews',
                title: 'Google Reviews',
                content: <div className="-mx-3 sm:mx-0"><StoreReviews /></div>
              }
            ]}
          />
        </div>
`;
    
    if (content.includes(searchStr)) {
        content = content.replace(searchStr, replacement);
        fs.writeFileSync(filePath, content, 'utf-8');
        return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, msg: "search string not found" });
}
