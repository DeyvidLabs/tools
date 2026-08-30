import Link from "next/link";

const variants = [
  {
    slug: "deyvid-bento",
    name: "Deyvid Bento",
    pitch: "Same DNA as deyvid.dev: warm near-black, mesh-gradient blobs, glass bento cards, huge italic headline.",
    swatches: ["#1b1815", "#c99a5b", "#b6552f"],
  },
  {
    slug: "midnight-slate",
    name: "Midnight Slate",
    pitch: "The unused 'Slate' theme from your portfolio CSS, activated: deep blue-black, calm indigo accent.",
    swatches: ["#0e1120", "#171a29", "#6f8dfb"],
  },
  {
    slug: "electric-blue",
    name: "Electric Blue",
    pitch: "Near-black navy with a dimmed electric blue used only for glow and accents — not a neon blast.",
    swatches: ["#05070d", "#0d1220", "#2f6fed"],
  },
  {
    slug: "warm-editorial",
    name: "Warm Editorial",
    pitch: "Cream paper, serif headline, hairline rules — a print catalog, not a SaaS landing page.",
    swatches: ["#faf6f0", "#241f1a", "#b03a2e"],
  },
  {
    slug: "terminal-amber",
    name: "Terminal Amber",
    pitch: "A fake terminal window, phosphor-amber text on black — CRT nostalgia without the lime-green cliché.",
    swatches: ["#0a0a0a", "#ffb000", "#3a2a10"],
  },
  {
    slug: "swiss-minimal",
    name: "Swiss Minimal",
    pitch: "Black on white, one red accent, thin rules, numbered sections — an international-style poster.",
    swatches: ["#ffffff", "#111111", "#d7263d"],
  },
  {
    slug: "glass-aurora",
    name: "Glass Aurora",
    pitch: "Light mode, soft pastel aurora mesh, frosted glass cards — friendly and airy.",
    swatches: ["#f4f2ff", "#ffffff", "#8b6cf1"],
  },
  {
    slug: "sidebar-shell",
    name: "Sidebar Shell",
    pitch: "Treats the homepage like a real app: fixed category sidebar, content pane on the right.",
    swatches: ["#101114", "#1a1c22", "#e15b47"],
  },
  {
    slug: "deep-violet",
    name: "Deep Violet",
    pitch: "The bento formula in a restrained violet-indigo hue instead of warm bronze.",
    swatches: ["#120f1e", "#1b1730", "#8b6cf1"],
  },
  {
    slug: "mono-blueprint",
    name: "Mono Blueprint",
    pitch: "Technical blueprint aesthetic: navy grid, cyan accent, outlined cards with HUD corner marks.",
    swatches: ["#0b1524", "#132338", "#4fd1ff"],
  },
];

export default function LabIndex() {
  return (
    <div className="min-h-screen bg-[#0b0b0d] px-6 py-16 text-[#e8e6e3]">
      <div className="mx-auto max-w-5xl">
        <span className="text-xs uppercase tracking-widest text-[#8a8783]">
          Design lab · not linked from the site
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Homepage style exploration
        </h1>
        <p className="mt-3 max-w-xl text-[#a3a09b]">
          Ten takes on the same tool grid — same 27 tools, same six categories,
          different palette / type / layout each time. Pick one (or mix) and
          I&apos;ll apply it to the real homepage.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {variants.map((v, i) => (
            <Link
              key={v.slug}
              href={`/lab/${v.slug}`}
              className="group rounded-xl border border-[#232326] bg-[#141416] p-5 transition-all hover:-translate-y-0.5 hover:border-[#3a3a3f]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[#6a6764]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex overflow-hidden rounded-full ring-1 ring-[#232326]">
                  {v.swatches.map((c, j) => (
                    <span key={j} className="h-3 w-5" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <h2 className="mt-3 text-lg font-semibold tracking-tight text-white group-hover:text-[#e8e6e3]">
                {v.name}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-[#a3a09b]">
                {v.pitch}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
