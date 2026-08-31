import Link from "next/link";
import { categories, toolCount } from "@/lib/tools-data";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10 sm:py-14">
      <div className="w-full max-w-5xl">
        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {toolCount} tools · runs entirely in your browser
          </span>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Dev tools, without the tab hoarding.
          </h1>
          <p className="mt-4 max-w-xl text-balance text-muted-foreground">
            A self-hosted collection of everyday developer utilities — formatters,
            generators, and testers. No signup, no tracking, most of it never
            leaves your browser.
          </p>
        </div>

        <div className="mt-14 flex flex-col gap-12">
          {categories.map((category) => (
            <section key={category.name}>
              <div className="mb-4 flex items-center gap-2.5">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-md"
                  style={{
                    color: category.color,
                    backgroundColor: `color-mix(in srgb, ${category.color} 15%, transparent)`,
                  }}
                >
                  {category.icon}
                </span>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  {category.name}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {category.tools.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {category.tools.map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    // prefetch={false}: by default next/link prefetches a route's
                    // RSC payload + JS chunk as soon as the link scrolls into
                    // view. With ~two dozen links on this page, that fires a
                    // burst of fetches/parsing on every scroll, competing with
                    // the main thread and causing dropped frames — not worth it
                    // for a browse page where only one link actually gets clicked.
                    prefetch={false}
                    // No backdrop-blur here (see webhook-tester's RequestRow for the
                    // same fix): this renders once per tool card, and backdrop-filter
                    // forces a per-frame repaint on scroll — fine for a single static
                    // card, not for a couple dozen of them in a grid.
                    className="group rounded-lg border border-border bg-card/70 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_8px_24px_-12px_var(--primary)]"
                  >
                    <span className="font-medium text-card-foreground transition-colors group-hover:text-primary">
                      {tool.name}
                    </span>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
