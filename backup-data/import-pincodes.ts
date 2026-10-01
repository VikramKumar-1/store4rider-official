import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
import mongoose from "mongoose";

const MONGO_URI = "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";

// Define schema directly for the script to avoid TS module resolution issues with workspaces in a standalone script
const pincodeSchema = new mongoose.Schema(
  {
    pincode: { type: String, required: true, unique: true, index: true },
    state: { type: String, required: true },
    district: { type: String, required: true },
    circleName: { type: String },
    regionName: { type: String },
    divisionName: { type: String },
    offices: [{ type: String }],
  },
  { timestamps: true }
);

const PincodeModel = mongoose.models.Pincode || mongoose.model("Pincode", pincodeSchema);

async function importPincodes() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB.");

  const csvFilePath = path.join(__dirname, "India Pincode data.csv");
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`File not found: ${csvFilePath}`);
    process.exit(1);
  }

  const pincodeMap = new Map<string, { state: string; district: string; circleName: string; regionName: string; divisionName: string; offices: Set<string> }>();

  console.log("Reading CSV...");
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csvParser())
      .on("data", (row) => {
        const pin = row.pincode?.trim();
        const state = row.statename?.trim();
        const district = row.district?.trim();
        const circleName = row.circlename?.trim();
        const regionName = row.regionname?.trim();
        const divisionName = row.divisionname?.trim();
        const office = row.officename?.trim();

        if (pin && state && district) {
          if (!pincodeMap.has(pin)) {
            pincodeMap.set(pin, { state, district, circleName, regionName, divisionName, offices: new Set() });
          }
          if (office) {
            pincodeMap.get(pin)!.offices.add(office);
          }
        }
      })
      .on("end", async () => {
        console.log(`Successfully parsed ${pincodeMap.size} unique pincodes.`);
        
        try {
          const operations = [];
          let count = 0;
          
          for (const [pincode, data] of pincodeMap.entries()) {
            operations.push({
              updateOne: {
                filter: { pincode },
                update: {
                  $set: {
                    state: data.state,
                    district: data.district,
                    circleName: data.circleName,
                    regionName: data.regionName,
                    divisionName: data.divisionName,
                    offices: Array.from(data.offices),
                  }
                },
                upsert: true
              }
            });

            // Batch write every 1000 records
            if (operations.length === 1000) {
              await PincodeModel.bulkWrite(operations, { ordered: false });
              count += operations.length;
              console.log(`Inserted/Updated ${count} records...`);
              operations.length = 0; // clear array
            }
          }

          // Write remaining
          if (operations.length > 0) {
            await PincodeModel.bulkWrite(operations, { ordered: false });
            count += operations.length;
            console.log(`Inserted/Updated final batch. Total: ${count}`);
          }

          console.log("Import completed successfully!");
          await mongoose.disconnect();
          resolve(true);
        } catch (err) {
          console.error("Error inserting data:", err);
          await mongoose.disconnect();
          reject(err);
        }
      })
      .on("error", (err) => {
        console.error("Error reading CSV:", err);
        reject(err);
      });
  });
}

importPincodes().catch(console.error);
