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

export type VocalFxStage = "queued" | "processing" | "done" | "error";

export interface VocalFxOptions {
  enhance: boolean;
  retuneStrength: number;
  key?: string;
}

export interface VocalFxStatusResponse {
  jobId: string;
  stage: VocalFxStage;
  progress: number;
  message?: string;
  error?: string;
}

export interface VocalFxStartResponse {
  vocalFxJobId: string;
}

export type MasteringIntensity = "gentle" | "balanced" | "loud";

export type MasteringStage = "queued" | "mastering" | "done" | "error";

export interface MasteringOptions {
  intensity: MasteringIntensity;
}

export interface MasteringStatusResponse {
  jobId: string;
  stage: MasteringStage;
  progress: number;
  message?: string;
  error?: string;
}

export interface MasteringStartResponse {
  masteringJobId: string;
}
