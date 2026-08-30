import Link from "next/link";
import { JetBrains_Mono } from "next/font/google";
import { categories } from "@/lib/tools-data";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

const ACCENTS = ["#2f6fed", "#3b82f6", "#4f7ee8", "#5b8def", "#3d6fd6", "#4a7de0"];

export default function ElectricBlueVariant() {
  return (
    <div className={`${mono.className} relative min-h-screen overflow-hidden bg-[#05070d] text-[#dce3f5]`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, #14203a 1px, transparent 1px), linear-gradient(to bottom, #14203a 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 70% 50% at 50% 0%, #000 40%, transparent 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-96 w-[42rem] -translate-x-1/2 rounded-full opacity-20 blur-[100px]"
        style={{ background: "radial-gradient(closest-side, #2f6fed, transparent)" }}
      />

      <header className="relative z-10 flex items-center justify-between px-8 py-6 text-sm">
        <span className="tracking-tight text-[#dce3f5]">
          <span style={{ color: "#2f6fed" }}>&gt;</span> tools --list
        </span>
        <a href="https://github.com/DeyvidLabs/tools" className="text-[#5b6b8c] hover:text-[#dce3f5]">
          ./source
        </a>
      </header>

      <section className="relative z-10 mx-auto max-w-3xl px-6 pt-16 pb-16 text-center">
        <span
          className="inline-block rounded border border-[#1c2947] bg-[#0a0f1c] px-3 py-1 text-xs text-[#5b8def]"
        >
          $ 27 tools found in ./browser
        </span>
        <h1 className="mt-8 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Dev tools that run
          <br />
          <span style={{ color: "#3b82f6" }}>where you already are.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-[#5b6b8c]">
          A self-hosted toolbox — formatters, generators, testers. No signup,
          no tracking, nothing leaves your machine unless you tell it to.
        </p>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="flex flex-col gap-12">
          {categories.map((category, ci) => {
            const accent = ACCENTS[ci % ACCENTS.length];
            return (
              <div key={category.name}>
                <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
                  <span style={{ color: accent }}>#</span>
                  <span className="text-[#8b98bd]">{category.name}</span>
                  <span className="text-[#3a4568]">[{category.tools.length}]</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {category.tools.map((tool) => (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      prefetch={false}
                      className="group rounded-md border border-[#141b30] bg-[#080a12] p-5 transition-all duration-150 hover:border-[color:var(--accent)] hover:shadow-[0_0_0_1px_var(--accent),0_8px_24px_-16px_var(--accent)]"
                      style={{ ["--accent" as string]: accent }}
                    >
                      <span className="text-sm font-medium text-[#dce3f5] group-hover:text-white">
                        {tool.name}
                      </span>
                      <p className="mt-1.5 text-xs leading-relaxed text-[#5b6b8c]">
                        {tool.description}
                      </p>
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
