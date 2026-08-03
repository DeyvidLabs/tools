"use client";

import { CheckIcon, CopyIcon } from "./icons";

interface CopyButtonProps {
  label: string;
  copied: boolean;
  onClick: () => void;
}

// The "Copied!" state is absolutely positioned over an invisible copy of the
// label, instead of replacing it, so the button keeps the label's width and
// doesn't shift its neighbors when the content swaps after a click.
export function CopyButton({ label, copied, onClick }: CopyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
    >
      <span className={`inline-flex items-center gap-1.5 ${copied ? "invisible" : ""}`}>
        <CopyIcon />
        {label}
      </span>
      <span
        className={`absolute inset-0 inline-flex items-center justify-center gap-1.5 ${copied ? "" : "invisible"}`}
      >
        <CheckIcon />
        Copied!
      </span>
    </button>
  );
}
