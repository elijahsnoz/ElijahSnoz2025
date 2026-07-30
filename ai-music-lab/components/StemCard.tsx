import AudioPlayer from "./AudioPlayer";
import DownloadButton from "./DownloadButton";
import type { StemResult } from "@/lib/types";

interface StemCardProps {
  stem: StemResult;
  songName: string;
}

export default function StemCard({ stem, songName }: StemCardProps) {
  const filename = `${songName} - ${stem.label}.wav`;

  return (
    <div className="rounded-2xl border border-glass bg-surface/60 p-5 backdrop-blur-sm transition-colors duration-300 hover:border-glass-hover">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm tracking-wide text-text">{stem.label}</h3>
        <DownloadButton href={stem.downloadUrl} filename={filename} />
      </div>
      <AudioPlayer src={stem.streamUrl} label={stem.label} />
    </div>
  );
}
