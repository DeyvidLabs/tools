"use client";

import { DownloadIcon } from "./icons";

interface DownloadButtonProps {
  label: string;
  onClick: () => void;
}

export function DownloadButton({ label, onClick }: DownloadButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
    >
      <DownloadIcon />
      {label}
    </button>
  );
}
