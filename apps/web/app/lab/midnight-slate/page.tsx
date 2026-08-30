import Link from "next/link";
import { categories } from "@/lib/tools-data";

const ACCENTS = ["#6f8dfb", "#8f7bd4", "#5b9fd6", "#7ba8c9", "#6bb3a8", "#8397d6"];

export default function MidnightSlateVariant() {
  return (
    <div className="min-h-screen bg-[#0e1120] text-[#eef0f7]">
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-0 h-[28rem] w-[48rem] -translate-x-1/2 rounded-full opacity-[0.12] blur-[100px]"
        style={{ background: "radial-gradient(closest-side, #6f8dfb, transparent)" }}
      />

      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <span className="text-sm font-semibold tracking-[0.2em] text-[#8c93ab] uppercase">
          Tools
        </span>
        <a
          href="https://github.com/DeyvidLabs/tools"
          className="text-sm text-[#8c93ab] transition-colors hover:text-[#eef0f7]"
        >
          Source →
        </a>
      </header>

      <section className="relative z-10 mx-auto max-w-3xl px-6 pt-16 pb-20 text-center">
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
          A quiet toolbox for
          <br />
          <span style={{ color: "#6f8dfb" }}>late-night debugging.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-[#8c93ab]">
          27 self-hosted developer utilities. No signup, no tracking, no
          noise — most of it runs entirely in your browser.
        </p>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="flex flex-col gap-14">
          {categories.map((category, ci) => {
            const accent = ACCENTS[ci % ACCENTS.length];
            return (
              <div key={category.name}>
                <div className="mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accent }} />
                  <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[#c3c7d9]">
                    {category.name}
                  </h2>
                  <span className="text-xs text-[#565b73]">{category.tools.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {category.tools.map((tool) => (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      prefetch={false}
                      className="rounded-lg border border-[#232744] bg-[#141729] p-5 transition-colors duration-200 hover:border-[#3a3f66]"
                    >
                      <span className="font-medium text-[#eef0f7]">{tool.name}</span>
                      <p className="mt-1.5 text-sm text-[#7b8098]">{tool.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <footer className="relative z-10 py-8 text-center text-xs text-[#565b73]">
        Midnight Slate — an unused theme draft from deyvid.dev, brought back.
      </footer>
    </div>
  );
}
