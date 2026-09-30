import https from 'https';

const testUrls = [
  "https://store4riders.s3.ap-south-2.amazonaws.com/wysiwyg/Rynox%20H2GO%20Pro%20jacket%20YKK.jpg",
  "https://store4riders.s3.ap-south-2.amazonaws.com/media/wysiwyg/Rynox%20H2GO%20Pro%20jacket%20YKK.jpg",
  "https://store4riders.s3.ap-south-2.amazonaws.com/catalog/product/wysiwyg/Rynox%20H2GO%20Pro%20jacket%20YKK.jpg",
  "https://store4riders.s3.ap-south-2.amazonaws.com/wysiwyg/Rynox+H2GO+Pro+jacket+YKK.jpg",
  "https://store4riders.s3.ap-south-2.amazonaws.com/media/wysiwyg/Rynox+H2GO+Pro+jacket+YKK.jpg",
  "https://store4riders.s3.ap-south-2.amazonaws.com/media/wysiwyg/Rynox_H2GO_Pro_jacket_YKK.jpg",
  "https://store4riders.s3.ap-south-2.amazonaws.com/wysiwyg/Rynox_H2GO_Pro_jacket_YKK.jpg"
];

async function checkUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log(`[${res.statusCode}] ${url}`);
      resolve();
    }).on('error', (e) => {
      console.log(`[Error] ${url}: ${e.message}`);
      resolve();
    });
  });
}

async function run() {
  console.log("Checking if S3 has these files...");
  for (const url of testUrls) {
    await checkUrl(url);
  }
}

run();
