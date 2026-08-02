import Link from "next/link";

const tools = [
  { name: "Password Generator", href: "/password-generator" },
  { name: "Webhook Tester", href: "/webhook-tester" },
  { name: "WebSocket Tester", href: "/websocket-tester" },
  { name: "Discord Embed Builder", href: "/discord-embed-builder" },
  { name: "JWT Debugger", href: "/jwt-debugger" },
  { name: "Cron Expression Builder", href: "/cron-expression-builder" },
  { name: "Pastebin", href: "/pastebin" },
  { name: "ID Generator", href: "/id-generator" },
  { name: "Timestamp / Timezone Converter", href: "/timestamp-timezone-converter" },
  { name: "Encoder/Decoder", href: "/encoder-decoder" },
  { name: ".env Linter", href: "/dotenv-linter" },
  { name: "Hash Generator", href: "/hash-generator" },
  { name: "JSON Formatter / Validator / Diff", href: "/json-formatter-diff" },
  { name: "Regex Tester", href: "/regex-tester" },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Tools
        </h1>
        <p className="mt-2 text-muted-foreground">
          A collection of self-contained dev tools. Most run entirely in your browser.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {tools.map((tool) =>
            tool.href ? (
              <Link
                key={tool.name}
                href={tool.href}
                className="group rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_8px_24px_-12px_var(--primary)]"
              >
                <span className="font-medium text-card-foreground transition-colors group-hover:text-primary">
                  {tool.name}
                </span>
              </Link>
            ) : (
              <div
                key={tool.name}
                aria-disabled="true"
                className="rounded-lg border border-border bg-card/70 p-5 opacity-50"
              >
                <span className="font-medium text-card-foreground">
                  {tool.name}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  soon
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
