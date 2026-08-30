import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { GithubIcon } from "@/components/icons";
import { HideOnLab } from "@/components/hide-on-lab";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tools",
  description: "A collection of self-contained dev tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <HideOnLab>
          <div className="bg-glow" aria-hidden="true" />
          <div className="bg-grid" aria-hidden="true" />
          <header className="flex items-center justify-between px-6 py-5 sm:px-10">
            <Link
              href="/"
              className="flex items-center gap-1.5 font-semibold tracking-tight text-foreground"
            >
              <span className="font-mono text-primary" aria-hidden="true">
                &gt;_
              </span>
              Tools
            </Link>
            <a
              href="https://github.com/DeyvidLabs/tools"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <GithubIcon />
              <span className="hidden sm:inline">Source</span>
            </a>
          </header>
        </HideOnLab>
        {children}
        <HideOnLab>
          <footer className="py-6 text-center text-xs text-muted-foreground">
            crafted with{" "}
            <a
              href="https://claude.ai/code"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Claude
            </a>
          </footer>
        </HideOnLab>
      </body>
    </html>
  );
}
