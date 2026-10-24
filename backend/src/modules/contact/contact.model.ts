import mongoose, { Schema, Document } from "mongoose";
import { IContactIssue, IContactIssueNote } from "@store4riders/shared-types";

export interface IContactIssueDocument extends Omit<IContactIssue, "id">, Document {}

const noteSchema = new Schema<IContactIssueNote>(
  {
    text: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const contactIssueSchema = new Schema<IContactIssueDocument>(
  {
    ticketId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, trim: true, index: true },
    orderNumber: { type: String, trim: true, index: true },
    orderId: { type: String },
    userId: { type: String, index: true },
    category: {
      type: String,
      enum: ["order_issue", "payment_issue", "return_exchange", "product_sizing", "shipping_delay", "other"],
      default: "order_issue",
      index: true,
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    assignedTo: { type: String },
    notes: [noteSchema],
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

contactIssueSchema.index({ createdAt: -1 });
contactIssueSchema.index({ status: 1, createdAt: -1 });
contactIssueSchema.index({ category: 1, createdAt: -1 });

export const ContactIssueModel =
  mongoose.models.ContactIssue ||
  mongoose.model<IContactIssueDocument>("ContactIssue", contactIssueSchema);
