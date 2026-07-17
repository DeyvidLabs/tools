const tools = [
  "Password Generator",
  "Webhook Tester",
  "WebSocket Tester",
  "Discord Embed Builder",
  "JWT Debugger",
  "Cron Expression Builder",
  "Pastebin",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center px-6 py-24">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Tools
        </h1>
        <p className="mt-2 text-muted-foreground">
          Placeholder — nessun tool è ancora implementato.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {tools.map((tool) => (
            <div
              key={tool}
              className="group rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_8px_24px_-12px_var(--primary)]"
            >
              <span className="font-medium text-card-foreground transition-colors group-hover:text-primary">
                {tool}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
