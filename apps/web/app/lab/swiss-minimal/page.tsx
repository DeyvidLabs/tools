import Link from "next/link";
import { categories } from "@/lib/tools-data";

export default function SwissMinimalVariant() {
  return (
    <div className="min-h-screen bg-white text-[#111111]">
      <header className="flex items-center justify-between border-b-2 border-[#111111] px-8 py-5">
        <span className="text-sm font-bold uppercase tracking-[0.2em]">Tools</span>
        <a href="https://github.com/DeyvidLabs/tools" className="text-sm font-bold uppercase tracking-widest hover:text-[#d7263d]">
          Source
        </a>
      </header>

      <section className="border-b-2 border-[#111111] px-8 py-16">
        <span className="text-sm font-bold uppercase tracking-[0.3em] text-[#d7263d]">
          27 Tools — No Signup
        </span>
        <h1 className="mt-4 max-w-3xl text-6xl font-black uppercase leading-[0.95] tracking-tight sm:text-8xl">
          Dev Tools, Sorted.
        </h1>
      </section>

      <section>
        {categories.map((category, ci) => (
          <div key={category.name} className="border-b-2 border-[#111111]">
            <div className="flex flex-col gap-1 px-8 py-6 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="text-sm font-bold text-[#d7263d]">
                {String(ci + 1).padStart(2, "0")}
              </span>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                {category.name}
              </h2>
            </div>
            <div>
              {category.tools.map((tool) => (
                <Link
                  key={tool.name}
                  href={tool.href}
                  prefetch={false}
                  className="group flex flex-col gap-1 border-t border-[#e0e0e0] px-8 py-4 transition-colors hover:bg-[#111111] sm:flex-row sm:items-baseline sm:justify-between"
                >
                  <span className="font-bold group-hover:text-white">{tool.name}</span>
                  <span className="text-sm text-[#6b6b6b] group-hover:text-[#c9c9c9]">
                    {tool.description}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
