async function run() {
  const res = await fetch("http://localhost:4000/api/v1/products?category=modular-helmets");
  const data = await res.json();
  console.log("Total Count:", data.data?.totalCount);
  console.log("First 3 items:", data.data?.items?.slice(0,3).map((i: any) => i.name));
}
run().catch(console.error);
