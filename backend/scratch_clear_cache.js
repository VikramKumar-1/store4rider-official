import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });
import Redis from 'ioredis';

async function run() {
  if (!process.env.REDIS_URL) {
    console.log('No REDIS_URL configured');
    process.exit(0);
  }
  const redis = new Redis(process.env.REDIS_URL);
  const keys = await redis.keys('products_*');
  const slugKeys = await redis.keys('product_*');
  const allKeys = [...keys, ...slugKeys];
  console.log('Found keys to delete:', allKeys.length);
  if (allKeys.length > 0) {
    await redis.del(...allKeys);
    console.log('Deleted all product and aggregation keys from Redis!');
  }
  await redis.quit();
  process.exit(0);
}
run().catch(console.error);
