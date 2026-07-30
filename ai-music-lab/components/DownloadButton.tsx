interface DownloadButtonProps {
  href: string;
  filename: string;
  label?: string;
  variant?: "ghost" | "solid";
}

export default function DownloadButton({ href, filename, label = "Download", variant = "ghost" }: DownloadButtonProps) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors duration-200";
  const styles =
    variant === "solid"
      ? "bg-gradient-to-r from-violet to-cyan text-void hover:brightness-110"
      : "border border-glass text-text-soft hover:border-cyan/60 hover:text-cyan";

  return (
    <a href={href} download={filename} className={`${base} ${styles}`}>
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path d="M10 3a1 1 0 0 1 1 1v7.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.42l2.3 2.3V4a1 1 0 0 1 1-1Z" />
        <path d="M4 15a1 1 0 0 1 1 1v1a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1a1 1 0 1 1 2 0v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-1a1 1 0 0 1 1-1Z" />
      </svg>
      {label}
    </a>
  );
}
