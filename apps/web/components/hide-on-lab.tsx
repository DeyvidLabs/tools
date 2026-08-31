"use client";

import { usePathname } from "next/navigation";

// The /lab routes are full-bleed design mockups that own their own header,
// background, and footer — the site chrome from the root layout would
// otherwise render on top of every variant.
export function HideOnLab({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/lab")) return null;
  return <>{children}</>;
}
