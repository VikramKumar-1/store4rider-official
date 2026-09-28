const fs = require('fs');
const axios = require('axios');
const path = require('path');

async function testApi() {
  console.log("Checking for API Key in .env files...");
  
  const envPaths = [
    path.join(__dirname, 'frontend', '.env'),
    path.join(__dirname, 'frontend', '.env.local'),
    path.join(__dirname, '.env')
  ];

  let apiKey = null;

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/SERPAPI_KEY=([^\r\n]+)/);
        if (match) {
          apiKey = match[1].trim();
          console.log(`Found API key in ${envPath}`);
          break;
        }
      }
    } catch (e) {
      // ignore and try next
    }
  }

  if (!apiKey) {
    console.log("❌ SERPAPI_KEY not found in any .env file.");
    return;
  }

  console.log("✅ API Key loaded. Fetching actual Store4Riders Google Reviews...");
  
  const url = `https://serpapi.com/search.json?engine=google_maps_reviews&data_id=0x3bc2c00d5a48819f:0xd4b529549919577c&api_key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const reviews = response.data.reviews;
    
    if (!reviews || reviews.length === 0) {
      console.log("❌ No reviews returned from API.");
      return;
    }

    console.log(`\n🎉 SUCCESS! Fetched ${reviews.length} real reviews from Google Maps.\n`);
    console.log("========== TOP 3 LIVE REVIEWS ==========");
    
    reviews.slice(0, 3).forEach((r, idx) => {
      console.log(`${idx + 1}. ${r.user?.name || 'Customer'} | ⭐ ${r.rating} Stars | ${r.date || 'Recently'}`);
      console.log(`   💬 "${(r.snippet || '').substring(0, 100)}..."`);
      console.log(`   🔗 Link: ${r.share_link || 'N/A'}`);
      console.log("----------------------------------------");
    });
    
    console.log(`\n(Showing 3 out of 10 fetched reviews. The frontend will display the top 10).`);
    
  } catch (error) {
    console.log("❌ Error calling SerpApi:", error.message);
  }
}

testApi();
