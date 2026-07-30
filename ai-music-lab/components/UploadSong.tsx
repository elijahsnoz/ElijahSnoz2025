"use client";

import { useRef, useState } from "react";
import { validateAudioFile } from "@/lib/upload";

interface UploadSongProps {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
}

export default function UploadSong({ onFileAccepted, disabled }: UploadSongProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function handleFile(file: File | undefined | null) {
    if (!file) return;
    const result = validateAudioFile(file);
    if (!result.valid) {
      setLocalError(result.error ?? "This file could not be used.");
      return;
    }
    setLocalError(null);
    onFileAccepted(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors duration-300 ${
          isDragging ? "border-cyan bg-cyan/5" : "border-glass bg-surface/40"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/x-wav,audio/flac,audio/x-flac"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet to-cyan px-8 py-3 font-mono text-xs uppercase tracking-[0.2em] text-void transition-transform duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
        >
          Upload Song
        </button>

        <p className="mt-4 text-sm text-text-soft">or drag a file anywhere in this box</p>

        <div className="mt-6 flex items-center justify-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
          <span>Supported</span>
          <span className="text-text-muted/40">·</span>
          <span>MP3</span>
          <span>WAV</span>
          <span>FLAC</span>
        </div>
      </div>

      {localError && (
        <div className="mt-4 rounded-xl border border-magenta/30 bg-magenta/10 px-4 py-3 text-sm text-magenta" role="alert">
          {localError}
        </div>
      )}
    </div>
  );
}
