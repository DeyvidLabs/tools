import Link from "next/link";
import { IBM_Plex_Mono } from "next/font/google";
import { categories } from "@/lib/tools-data";

const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

export default function TerminalAmberVariant() {
  return (
    <div className={`${plex.className} min-h-screen bg-[#0a0a0a] px-4 py-10 text-[#ffb000]`}>
      <div className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-[#3a2a10] bg-[#0d0d0a] shadow-[0_0_60px_-20px_rgba(255,176,0,0.15)]">
        <div className="flex items-center gap-1.5 border-b border-[#3a2a10] bg-[#141008] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#4a3a1a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#4a3a1a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#4a3a1a]" />
          <span className="ml-3 text-xs text-[#8a6a30]">tools@deyvid:~$</span>
        </div>

        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <p className="text-sm text-[#8a6a30]">$ cat welcome.txt</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
            27 tools, 0 signups.
            <span className="animate-pulse">_</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#c98a20]">
            A self-hosted collection of everyday dev utilities. Most run
            entirely client-side — nothing to log in to, nothing phoning home.
          </p>

          <div className="mt-10 flex flex-col gap-8">
            {categories.map((category, ci) => (
              <div key={category.name}>
                <p className="text-sm text-[#8a6a30]">
                  $ ls ./{category.name.toLowerCase().replace(/[^a-z]+/g, "-")}/
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 border-l-2 border-[#3a2a10] pl-4 sm:grid-cols-2">
                  {category.tools.map((tool) => (
                    <Link
                      key={tool.name}
                      href={tool.href}
                      prefetch={false}
                      className="group rounded border border-transparent px-2 py-1.5 transition-colors hover:border-[#3a2a10] hover:bg-[#141008]"
                    >
                      <span className="text-[#ffb000] group-hover:underline">
                        {tool.name}
                      </span>
                      <span className="block text-xs text-[#7a5a20]">
                        # {tool.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm text-[#8a6a30]">
            $ _<span className="animate-pulse">▮</span>
          </p>
        </div>
      </div>
    </div>
  );
}
