import mongoose from "mongoose";
import { config } from "dotenv";
import { OrderModel } from "../modules/order/order.model.js";

config();

async function deletePendingOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected to DB");

    // Delete one pending order (the oldest one)
    const orderToDelete = await OrderModel.findOne({ status: "pending_payment" }).sort({ createdAt: 1 });
    
    if (orderToDelete) {
      await OrderModel.findByIdAndDelete(orderToDelete._id);
      console.log(`Successfully deleted duplicate order: ${orderToDelete._id}`);
    } else {
      console.log("No pending test orders found.");
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

deletePendingOrders();
