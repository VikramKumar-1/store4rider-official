import axios from "axios";
import { apiClient } from "../api/client";

export interface VideoUploadProgressCallback {
  (percentage: number): void;
}

/**
 * Uploads a video file (.mp4, .webm, .mov) directly to AWS S3 using presigned URL.
 */
export async function uploadVideoToS3(
  file: File,
  onProgress?: VideoUploadProgressCallback
): Promise<string> {
  const validMimes = ["video/mp4", "video/webm", "video/quicktime"];
  const isVideo = validMimes.includes(file.type) || /\.(mp4|webm|mov)$/i.test(file.name);

  if (!isVideo) {
    throw new Error("Invalid video file. Please upload an MP4, WebM, or MOV file.");
  }

  // Max 50MB file size limit for web performance
  const maxBytes = 50 * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error("Video file size exceeds 50MB limit. Please compress or upload a shorter reel clip.");
  }

  const fileType = file.type || "video/mp4";

  // 1. Request presigned URL from backend
  const res = await apiClient.post<{ data: { url: string } }>("/upload/presigned-url", {
    fileName: file.name,
    fileType,
  });

  const presignedUrl = res.data.data.url;
  if (!presignedUrl) {
    throw new Error("Did not receive a presigned URL from the server");
  }

  // 2. Direct PUT to S3 with progress tracking
  await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": fileType,
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });

  // 3. Return clean public URL
  return presignedUrl.split("?")[0];
}
