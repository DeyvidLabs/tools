import Link from "next/link";
import { categories } from "@/lib/tools-data";

const ACCENTS = ["#8b6cf1", "#ec6fa8", "#4fb0e8", "#f0a355", "#4fc9a8", "#c96fe8"];

export default function GlassAuroraVariant() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f2ff] text-[#231f33]">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/4 h-[36rem] w-[36rem] rounded-full opacity-40 blur-[90px]"
        style={{ background: "radial-gradient(circle, #c7b8ff, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-0 h-[28rem] w-[28rem] rounded-full opacity-40 blur-[90px]"
        style={{ background: "radial-gradient(circle, #ffc7e0, transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-64 left-0 h-[24rem] w-[24rem] rounded-full opacity-30 blur-[90px]"
        style={{ background: "radial-gradient(circle, #b8e3ff, transparent 70%)" }}
      />

      <header className="relative z-10 flex justify-center px-4 pt-6">
        <nav className="flex w-full max-w-4xl items-center justify-between rounded-full border border-white/60 bg-white/40 px-6 py-3 backdrop-blur-md">
          <span className="font-semibold tracking-tight">Tools</span>
          <a href="https://github.com/DeyvidLabs/tools" className="text-sm text-[#5b5470] hover:text-[#231f33]">
            Source
          </a>
        </nav>
      </header>

      <section className="relative z-10 mx-auto max-w-2xl px-6 pt-16 pb-14 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          A soft landing for
          <br />
          <span style={{ color: "#8b6cf1" }}>everyday dev tasks.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[#5b5470]">
          27 self-hosted tools — formatters, generators, testers. No signup,
          most run entirely in your browser.
        </p>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="flex flex-col gap-12">
          {categories.map((category, ci) => {
            const accent = ACCENTS[ci % ACCENTS.length];
            return (
              <div key={category.name}>
                <div className="mb-4 flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ color: accent, backgroundColor: `${accent}22` }}
                  >
                    {category.icon}
                  </span>
                  <h2 className="text-lg font-semibold tracking-tight">{category.name}</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {category.tools.map((tool) => (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      prefetch={false}
                      className="rounded-3xl border border-white/60 bg-white/50 p-5 shadow-[0_8px_30px_-16px_rgba(80,60,140,0.25)] backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/70"
                    >
                      <span className="font-medium text-[#231f33]">{tool.name}</span>
                      <p className="mt-1.5 text-sm text-[#5b5470]">{tool.description}</p>
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
