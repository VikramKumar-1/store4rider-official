const images = [
{url: "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/l/o/lone-ranger-mashak-hydration-backpack-black-_1_.jpg", altText: "Lone Ranger Mashak Hydration Backpack"},
{url: "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/l/o/lone-ranger-mashak-hydration-backpack-orange-black-_1_.jpg", altText: "Lone Ranger Mashak Hydration Backpack"}
];

const selectedColor = "Yellow";
const normalizedValue = selectedColor.trim().toLowerCase();
const normalizeForCompare = (str) => {
    if (!str) return "";
    return str.replace(/[^a-z0-9]/gi, '').toLowerCase();
};
const exactNormVal = normalizeForCompare(selectedColor);

let matchIdx = -1;
matchIdx = images.findIndex(img => {
if (!img.altText) return false;
const parts = img.altText.split('-');
if (parts.length > 1 && normalizeForCompare(parts[parts.length - 1]) === exactNormVal) return true;
if (normalizeForCompare(img.altText) === exactNormVal) return true;
if (normalizeForCompare(img.altText).endsWith(exactNormVal)) return true;
return false;
});

if (matchIdx === -1) {
    const tokens = normalizedValue.split(/[/\\&\-_+ ]/).filter(Boolean);
    const isPureColor = tokens.length === 1;
    const allAccents = ["red", "orange", "blue", "green", "neon", "yellow", "silver", "white", "grey", "gray", "brown", "purple"];
    
    matchIdx = images.findIndex(img => {
    const alt = (img.altText || "").toLowerCase();
    const url = (img.url || "").toLowerCase();
    
    if (isPureColor && tokens[0] === "black") {
        if (allAccents.some(c => alt.includes(c) || url.includes(c))) return false;
        return alt.includes("black") || url.includes("black");
    }
    
    return tokens.every(t => {
        const term = t === "flu." || t === "flu" ? "neon" : t;
        
        let isMatch = alt.includes(term) || url.includes(term);
        if (t === "flu." && !isMatch) isMatch = alt.includes("flu") || url.includes("flu");
        
        if (term === "yellow" && !isMatch) {
            isMatch = alt.includes("orange") || url.includes("orange");
        }
        
        return isMatch;
    });
    });
}
console.log("Matched Index:", matchIdx);
