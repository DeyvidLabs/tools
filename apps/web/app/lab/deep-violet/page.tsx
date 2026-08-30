import Link from "next/link";
import { categories } from "@/lib/tools-data";

export default function DeepVioletVariant() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#120f1e] text-[#ece9f7]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[56rem] -translate-x-1/2 rounded-full opacity-20 blur-[110px]"
        style={{ background: "radial-gradient(closest-side, #8b6cf1, transparent)" }}
      />

      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <span className="font-semibold tracking-tight">Tools</span>
        <a href="https://github.com/DeyvidLabs/tools" className="text-sm text-[#8d87ab] hover:text-white">
          Source
        </a>
      </header>

      <section className="relative z-10 mx-auto max-w-2xl px-6 pt-16 pb-16 text-center">
        <span className="rounded-full border border-[#8b6cf1]/30 bg-[#8b6cf1]/10 px-3 py-1 text-xs uppercase tracking-widest text-[#b5a4f5]">
          27 tools · self-hosted
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          One quiet corner for
          <br />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(90deg, #8b6cf1, #c96fe8)" }}
          >
            every dev utility.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-[#8d87ab]">
          Formatters, generators, and testers. No signup, no tracking, most
          of it never leaves your browser.
        </p>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="flex flex-col gap-12">
          {categories.map((category, ci) => (
            <div key={category.name}>
              <div className="mb-4 flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8b6cf1]/10 text-[#b5a4f5]">
                  {category.icon}
                </span>
                <h2 className="text-lg font-semibold tracking-tight">{category.name}</h2>
                <span className="font-mono text-xs text-[#5c577a]">
                  {String(ci + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.tools.map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    prefetch={false}
                    className="rounded-2xl border border-[#2b2748] bg-[#1b1730] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#8b6cf1]/50 hover:shadow-[0_12px_32px_-16px_#8b6cf1aa]"
                  >
                    <span className="font-medium text-[#ece9f7]">{tool.name}</span>
                    <p className="mt-1.5 text-sm text-[#8d87ab]">{tool.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
