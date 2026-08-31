"use client";

import Link from "next/link";
import { Space_Mono } from "next/font/google";
import { categories } from "@/lib/tools-data";

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] });

const ACCENTS = ["#c99a5b", "#b6552f", "#3a5a78", "#8f7bd4", "#5f9e83", "#c9705b"];

export default function DeyvidBentoVariant() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1b1815] text-[#f4ede4]">
      {/* Mesh gradient blobs, matching deyvid.dev's .mesh-blob treatment */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-20 h-[60vmax] w-[60vmax] rounded-full opacity-20 blur-[80px]"
        style={{ background: "radial-gradient(circle, #c99a5b 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-52 -right-20 h-[55vmax] w-[55vmax] rounded-full opacity-15 blur-[90px]"
        style={{ background: "radial-gradient(circle, #b6552f 0%, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/4 right-1/4 h-[40vmax] w-[40vmax] rounded-full opacity-15 blur-[90px]"
        style={{ background: "radial-gradient(circle, #3a5a78 0%, transparent 70%)" }}
      />

      <div className="relative z-10 flex justify-center px-4 pt-6">
        <nav className="flex w-full max-w-5xl items-center justify-between rounded-full border border-white/10 bg-[#1b1815]/70 px-6 py-3 backdrop-blur-md">
          <span className="text-lg font-bold tracking-tight">Tools</span>
          <div className="hidden items-center gap-6 text-sm font-medium text-white/60 sm:flex">
            <span>Security</span>
            <span>Network</span>
            <span>Data</span>
          </div>
          <a
            href="https://github.com/DeyvidLabs/tools"
            className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-bold transition hover:bg-white/15"
          >
            Source
          </a>
        </nav>
      </div>

      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-20 pb-16 text-center">
        <span
          className={`${spaceMono.className} rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-widest text-white/60`}
        >
          27 tools · self-hosted
        </span>
        <h1 className="mt-8 text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
          Tools you reach <br />
          <span className="italic" style={{ color: "#c99a5b" }}>
            for every day.
          </span>
        </h1>
        <p className="mt-8 max-w-xl text-lg text-white/60">
          A self-hosted toolbox of formatters, generators, and testers.
          No signup, no tracking — most of it never leaves your browser.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="#tools"
            className="rounded-2xl px-8 py-4 text-center font-bold text-[#1b1815] transition hover:scale-105 hover:shadow-2xl"
            style={{ backgroundColor: "#c99a5b", boxShadow: "0 20px 40px -20px #c99a5b66" }}
          >
            Browse all tools
          </a>
          <a
            href="https://github.com/DeyvidLabs/tools"
            className="rounded-2xl border border-white/10 bg-white/5 px-8 py-4 text-center font-bold transition hover:bg-white/10"
          >
            View source
          </a>
        </div>
      </section>

      <section id="tools" className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="flex flex-col gap-16">
          {categories.map((category, ci) => {
            const accent = ACCENTS[ci % ACCENTS.length];
            return (
              <div key={category.name}>
                <div className="mb-5 flex items-baseline gap-3">
                  <span className="font-black" style={{ color: `${accent}cc` }}>
                    {String(ci + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-2xl font-black tracking-tight">{category.name}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {category.tools.map((tool) => (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      prefetch={false}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.08]"
                      style={{ borderColor: "rgba(255,255,255,0.1)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${accent}80`)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                    >
                      <span className="font-bold tracking-tight text-white">{tool.name}</span>
                      <p className="mt-2 text-sm leading-relaxed text-white/50">{tool.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
