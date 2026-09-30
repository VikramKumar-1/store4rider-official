import axios from "axios";

async function testApi() {
  try {
    console.log("Testing Aggregations API...");
    const aggRes = await axios.get("http://localhost:4000/api/v1/products/aggregations");
    console.log("Aggregations Success:", aggRes.status);
  } catch (err: any) {
    console.error("Aggregations Error:", err.response?.data || err.message);
  }

  try {
    console.log("\nTesting Products List API...");
    const prodRes = await axios.get("http://localhost:4000/api/v1/products?category=helmets");
    console.log("Products Success:", prodRes.status);
  } catch (err: any) {
    console.error("Products Error:", err.response?.data || err.message);
  }
}

testApi();
