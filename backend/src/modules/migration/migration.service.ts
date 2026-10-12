import { addMigrationJob } from "../../core/queue/migration.queue";
import { AppError } from "../../core/errors/AppError";

export class MigrationService {
  /**
   * Starts a background migration job for a given CSV file
   */
  static async startCsvMigration(filePath: string, adminId: string) {
    if (!filePath) {
      throw new AppError("File path is required", 400);
    }
    
    // Add job to BullMQ
    const job = await addMigrationJob(filePath, adminId);
    
    return {
      jobId: job.id,
      message: "Migration job added successfully. Processing in background.",
    };
  }

  static async getJobStatus(jobId: string) {
    const { getMigrationJob } = await import("../../core/queue/migration.queue");
    const job = await getMigrationJob(jobId);
    
    if (!job) {
      throw new AppError("Job not found", 404);
    }
    
    const state = await job.getState();
    const progress = job.progress;
    
    return {
      jobId: job.id,
      state,
      progress,
      result: job.returnvalue || null,
      failedReason: job.failedReason || null
    };
  }
}
