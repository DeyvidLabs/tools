import Link from "next/link";
import { JetBrains_Mono } from "next/font/google";
import { categories } from "@/lib/tools-data";

const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

function Corners() {
  return (
    <>
      <span className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l border-t border-[#4fd1ff]/50" />
      <span className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r border-t border-[#4fd1ff]/50" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b border-l border-[#4fd1ff]/50" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b border-r border-[#4fd1ff]/50" />
    </>
  );
}

export default function MonoBlueprintVariant() {
  return (
    <div className={`${mono.className} relative min-h-screen bg-[#0b1524] text-[#bcd4e6]`}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(to right, #16324a 1px, transparent 1px), linear-gradient(to bottom, #16324a 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <header className="relative z-10 flex items-center justify-between border-b border-[#16324a] px-8 py-5 text-xs uppercase tracking-widest">
        <span className="text-[#4fd1ff]">{"// tools.sys"}</span>
        <a href="https://github.com/DeyvidLabs/tools" className="text-[#5c7d94] hover:text-[#bcd4e6]">
          view-source
        </a>
      </header>

      <section className="relative z-10 mx-auto max-w-3xl px-6 pt-16 pb-14 text-center">
        <p className="text-xs uppercase tracking-widest text-[#4fd1ff]">
          spec — 06 categories · 27 modules
        </p>
        <h1 className="mt-4 text-3xl font-bold uppercase tracking-tight text-[#eaf6ff] sm:text-4xl">
          Dev tool schematics
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#5c7d94]">
          A self-hosted set of formatters, generators, and testers. No
          signup — most modules run entirely client-side.
        </p>
      </section>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="flex flex-col gap-12">
          {categories.map((category, ci) => (
            <div key={category.name}>
              <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
                <span className="text-[#4fd1ff]">[{String(ci + 1).padStart(2, "0")}]</span>
                <span className="text-[#eaf6ff]">{category.name}</span>
                <span className="text-[#3d5a72]">/{category.tools.length} modules</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {category.tools.map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    prefetch={false}
                    className="group relative border border-[#16324a] bg-[#0e1b2c]/60 p-5 transition-colors hover:border-[#4fd1ff]/60"
                  >
                    <Corners />
                    <span className="text-sm font-medium text-[#eaf6ff]">{tool.name}</span>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#5c7d94]">
                      {tool.description}
                    </p>
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
