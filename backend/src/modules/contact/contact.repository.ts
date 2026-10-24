import { ContactIssueModel, IContactIssueDocument } from "./contact.model";
import { ContactIssueStatus, IContactIssueStats } from "@store4riders/shared-types";
import { ClientSession } from "mongoose";

export class ContactRepository {
  static async create(data: Partial<IContactIssueDocument>, session?: ClientSession) {
    if (session) {
      const [issue] = await ContactIssueModel.create([data], { session });
      return issue.toObject();
    }
    const issue = await ContactIssueModel.create(data);
    try {
      const { deleteCache } = await import("../../core/cache/redis");
      await deleteCache("contact:stats");
    } catch {}
    return issue.toObject();
  }

  static async findById(id: string) {
    return await ContactIssueModel.findById(id).lean().exec();
  }

  static async findByTicketId(ticketId: string) {
    return await ContactIssueModel.findOne({ ticketId }).lean().exec();
  }

  static async findPaginated(
    query: any,
    page: number = 1,
    limit: number = 20,
    sort: any = { createdAt: -1 }
  ) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      ContactIssueModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      ContactIssueModel.countDocuments(query).exec(),
    ]);

    return {
      items: items.map((doc: any) => ({
        ...doc,
        id: String(doc._id),
      })),
      total,
    };
  }

  static async updateStatus(
    id: string,
    status: ContactIssueStatus,
    noteText?: string,
    author: string = "Staff"
  ) {
    const updateDoc: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === "resolved" || status === "closed") {
      updateDoc.resolvedAt = new Date();
    }

    const pushDoc: any = {};
    if (noteText) {
      pushDoc.notes = {
        text: noteText,
        author,
        createdAt: new Date(),
      };
    }

    const updateQuery: any = { $set: updateDoc };
    if (pushDoc.notes) {
      updateQuery.$push = pushDoc;
    }

    const updated = await ContactIssueModel.findByIdAndUpdate(id, updateQuery, {
      new: true,
    })
      .lean()
      .exec();

    if (!updated) return null;
    try {
      const { deleteCache } = await import("../../core/cache/redis");
      await deleteCache("contact:stats");
    } catch {}
    return {
      ...updated,
      id: String((updated as any)._id),
    };
  }

  static async addNote(id: string, text: string, author: string = "Staff") {
    const updated = await ContactIssueModel.findByIdAndUpdate(
      id,
      {
        $push: {
          notes: {
            text,
            author,
            createdAt: new Date(),
          },
        },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    )
      .lean()
      .exec();

    if (!updated) return null;
    try {
      const { deleteCache } = await import("../../core/cache/redis");
      await deleteCache("contact:stats");
    } catch {}
    return {
      ...updated,
      id: String((updated as any)._id),
    };
  }

  static async getStats(): Promise<IContactIssueStats> {
    const cacheKey = "contact:stats";
    try {
      const { getCache } = await import("../../core/cache/redis");
      const cached = await getCache(cacheKey);
      if (cached) return cached;
    } catch {
      // Non-fatal if cache unavailable
    }

    const [total, open, inProgress, resolved, closed] = await Promise.all([
      ContactIssueModel.countDocuments().exec(),
      ContactIssueModel.countDocuments({ status: "open" }).exec(),
      ContactIssueModel.countDocuments({ status: "in_progress" }).exec(),
      ContactIssueModel.countDocuments({ status: "resolved" }).exec(),
      ContactIssueModel.countDocuments({ status: "closed" }).exec(),
    ]);

    const stats = {
      total,
      open,
      inProgress,
      resolved,
      closed,
    };

    try {
      const { setCache } = await import("../../core/cache/redis");
      await setCache(cacheKey, stats, 15);
    } catch {
      // Non-fatal
    }

    return stats;
  }
}
