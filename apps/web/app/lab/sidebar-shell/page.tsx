import Link from "next/link";
import { categories } from "@/lib/tools-data";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function SidebarShellVariant() {
  return (
    <div className="flex min-h-screen bg-[#101114] text-[#e6e6e8]">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#232429] bg-[#0d0e11] px-5 py-6 lg:flex">
        <span className="text-sm font-bold tracking-tight text-white">Tools</span>
        <span className="mt-1 text-xs text-[#6e7079]">27 self-hosted utilities</span>

        <nav className="mt-8 flex flex-col gap-1">
          {categories.map((category) => (
            <a
              key={category.name}
              href={`#${slugify(category.name)}`}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-[#a9abb3] transition-colors hover:bg-[#191a1f] hover:text-white"
            >
              <span className="flex items-center gap-2">
                <span style={{ color: "#e15b47" }}>{category.icon}</span>
                {category.name}
              </span>
              <span className="text-xs text-[#5a5c66]">{category.tools.length}</span>
            </a>
          ))}
        </nav>

        <a
          href="https://github.com/DeyvidLabs/tools"
          className="mt-auto text-xs text-[#6e7079] hover:text-white"
        >
          View source →
        </a>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-[#232429] px-8 py-5">
          <div className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-[#232429] bg-[#17181c] px-3 py-2 text-sm text-[#5a5c66]">
            <span>Search tools…</span>
          </div>
          <a href="https://github.com/DeyvidLabs/tools" className="text-sm text-[#a9abb3] hover:text-white lg:hidden">
            Source
          </a>
        </header>

        <section className="px-8 py-10">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Everything you need, one sidebar away.
          </h1>
          <p className="mt-2 max-w-xl text-[#a9abb3]">
            Formatters, generators, and testers — self-hosted, no signup,
            most of it never leaves your browser.
          </p>

          <div className="mt-10 flex flex-col gap-14">
            {categories.map((category) => (
              <div key={category.name} id={slugify(category.name)} className="scroll-mt-6">
                <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">
                  {category.name}
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {category.tools.map((tool) => (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      prefetch={false}
                      className="rounded-lg border border-[#232429] bg-[#17181c] p-4 transition-colors hover:border-[#e15b47]/50"
                    >
                      <span className="text-sm font-medium text-white">{tool.name}</span>
                      <p className="mt-1 text-xs text-[#7d7f89]">{tool.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
