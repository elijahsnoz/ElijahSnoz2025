export type StemKey = "vocals" | "drums" | "bass" | "other";

export type ProcessingStage =
  | "idle"
  | "uploading"
  | "separating"
  | "analysing"
  | "finishing"
  | "done"
  | "error";

export interface StemResult {
  key: StemKey;
  label: string;
  streamUrl: string;
  downloadUrl: string;
}

export interface JobStatusResponse {
  jobId: string;
  stage: ProcessingStage;
  progress: number;
  message?: string;
  stems?: StemResult[];
  error?: string;
}

export interface UploadResponse {
  jobId: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
