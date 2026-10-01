import { Schema, model, models } from "mongoose";
import { IPincode } from "@store4riders/shared-types";

const pincodeSchema = new Schema<IPincode>(
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

export const PincodeModel = models.Pincode || model<IPincode>("Pincode", pincodeSchema);
