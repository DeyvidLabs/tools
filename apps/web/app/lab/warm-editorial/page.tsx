import Link from "next/link";
import { Source_Serif_4 } from "next/font/google";
import { categories } from "@/lib/tools-data";

const serif = Source_Serif_4({ subsets: ["latin"], weight: ["400", "600", "700"] });

export default function WarmEditorialVariant() {
  return (
    <div className="min-h-screen bg-[#faf6f0] text-[#241f1a]">
      <header className="flex items-center justify-between border-b border-[#e3d9c9] px-8 py-5">
        <span className={`${serif.className} text-lg font-semibold`}>Tools</span>
        <a href="https://github.com/DeyvidLabs/tools" className="text-sm text-[#7a6f60] hover:text-[#241f1a]">
          Source
        </a>
      </header>

      <section className="mx-auto max-w-2xl px-6 pt-16 pb-14 text-center">
        <span className="text-xs uppercase tracking-[0.25em] text-[#b03a2e]">
          Vol. 01 — 27 Tools
        </span>
        <h1 className={`${serif.className} mt-4 text-4xl font-semibold leading-tight sm:text-5xl`}>
          A field guide to the tools you reach for daily.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[#7a6f60]">
          Formatters, generators, and testers — self-hosted, no signup, most
          of it never leaves your browser.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="flex flex-col">
          {categories.map((category, ci) => (
            <div key={category.name} className="border-t border-[#e3d9c9] py-8 first:border-t-0">
              <div className="flex items-baseline justify-between">
                <h2 className={`${serif.className} text-xl font-semibold`}>
                  {String(ci + 1).padStart(2, "0")}. {category.name}
                </h2>
                <span className="text-xs uppercase tracking-widest text-[#a89a86]">
                  {category.tools.length} tools
                </span>
              </div>
              <ul className="mt-4 flex flex-col">
                {category.tools.map((tool) => (
                  <li key={tool.name} className="border-t border-dotted border-[#e3d9c9] py-3 first:border-t-0">
                    <Link href={tool.href} prefetch={false} className="group flex flex-wrap items-baseline gap-x-3">
                      <span className="font-medium underline decoration-[#e3d9c9] decoration-1 underline-offset-4 group-hover:decoration-[#b03a2e]">
                        {tool.name}
                      </span>
                      <span className="text-sm text-[#8a7d6e]">— {tool.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
