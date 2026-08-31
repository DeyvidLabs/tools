import {
  ShieldIcon,
  NetworkIcon,
  DatabaseIcon,
  FileTextIcon,
  PaletteIcon,
  WrenchIcon,
} from "@/components/icons";

export type Tool = {
  name: string;
  href: string;
  description: string;
};

export type Category = {
  name: string;
  icon: React.ReactNode;
  color: string;
  tools: Tool[];
};

export const categories: Category[] = [
  {
    name: "Security & Identity",
    icon: <ShieldIcon />,
    color: "var(--primary)",
    tools: [
      {
        name: "Password Generator",
        href: "/password-generator",
        description: "Cryptographically secure passwords via the Web Crypto API.",
      },
      {
        name: "Hash Generator",
        href: "/hash-generator",
        description: "MD5, SHA-1, SHA-256, or SHA-512 for text or files.",
      },
      {
        name: "JWT Debugger",
        href: "/jwt-debugger",
        description: "Decode a token's header and payload, check its expiration.",
      },
      {
        name: "ID Generator",
        href: "/id-generator",
        description: "Batches of UUID v4/v7, ULID, or nanoid, exported as CSV/JSON.",
      },
    ],
  },
  {
    name: "Network & API",
    icon: <NetworkIcon />,
    color: "var(--accent-purple)",
    tools: [
      {
        name: "Webhook Tester",
        href: "/webhook-tester",
        description: "A unique URL that shows incoming requests in real time.",
      },
      {
        name: "WebSocket Tester",
        href: "/websocket-tester",
        description: "Connect to an echo/relay socket, solo or in a shared room.",
      },
      {
        name: "HTTP Request Builder",
        href: "/http-request-builder",
        description: "Build a request, get curl / fetch() / HTTPie, live.",
      },
      {
        name: "API Mock / Sandbox Endpoint",
        href: "/mock-endpoint",
        description: "A URL that returns a configurable status, body, and delay.",
      },
      {
        name: "Subnet / CIDR Calculator",
        href: "/subnet-cidr-calculator",
        description: "Network/broadcast address, masks, and usable host range.",
      },
    ],
  },
  {
    name: "Data & Formats",
    icon: <DatabaseIcon />,
    color: "var(--accent-amber)",
    tools: [
      {
        name: "JSON Formatter / Validator / Diff",
        href: "/json-formatter-diff",
        description: "Pretty-print, validate, and diff JSON or plain text.",
      },
      {
        name: "JSON to TypeScript / Zod Schema Generator",
        href: "/json-to-ts-zod",
        description: "Sample JSON into a TS interface or Zod schema.",
      },
      {
        name: "CSV / JSON / YAML Converter",
        href: "/csv-json-yaml-converter",
        description: "Convert between formats with delimiter/header options.",
      },
      {
        name: "SQL Formatter / Minifier",
        href: "/sql-formatter",
        description: "Pretty-print or minify SQL across common dialects.",
      },
      {
        name: ".env Linter",
        href: "/dotenv-linter",
        description: "Catch duplicate keys, empty values, and mixed quoting.",
      },
    ],
  },
  {
    name: "Text, Docs & Sharing",
    icon: <FileTextIcon />,
    color: "var(--accent-rose)",
    tools: [
      {
        name: "Pastebin",
        href: "/pastebin",
        description: "Share a snippet via a link that expires automatically.",
      },
      {
        name: "URL Shortener",
        href: "/url-shortener",
        description: "Turn a long URL into a short, self-hosted link.",
      },
      {
        name: "Markdown Live Previewer",
        href: "/markdown-previewer",
        description: "A formatting toolbar with live rendered HTML output.",
      },
      {
        name: "Regex Tester",
        href: "/regex-tester",
        description: "Highlighted matches, capture groups, and an explanation.",
      },
      {
        name: "Encoder/Decoder",
        href: "/encoder-decoder",
        description: "Base64, URL, or HTML entity encoding and decoding.",
      },
    ],
  },
  {
    name: "Design & Visual",
    icon: <PaletteIcon />,
    color: "var(--accent-orange)",
    tools: [
      {
        name: "Color Converter",
        href: "/color-converter",
        description: "HEX, RGB, HSL, OKLCH, plus derived palettes.",
      },
      {
        name: "CSS Gradient / Box-Shadow / Clip-Path Generator",
        href: "/css-shape-generator",
        description: "Build shapes and effects with a live preview.",
      },
      {
        name: "ANSI / Terminal Color Previewer",
        href: "/ansi-color-previewer",
        description: "Render raw ANSI escape codes as real terminal output.",
      },
      {
        name: "QR Code Generator / Reader",
        href: "/qr-code-generator-reader",
        description: "Generate codes for text, URLs, WiFi, or contacts — or decode one.",
      },
    ],
  },
  {
    name: "Dev Utilities",
    icon: <WrenchIcon />,
    color: "var(--accent-teal)",
    tools: [
      {
        name: "Cron Expression Builder",
        href: "/cron-expression-builder",
        description: "Plain-English cron descriptions with next run times.",
      },
      {
        name: "Timestamp / Timezone Converter",
        href: "/timestamp-timezone-converter",
        description: "Unix, ISO 8601, and human-readable dates in any timezone.",
      },
      {
        name: "Discord Embed Builder",
        href: "/discord-embed-builder",
        description: "Build an embed, preview it, and send it to a webhook.",
      },
      {
        name: "Fake Data Generator",
        href: "/fake-data-generator",
        description: "Batches of fake names, emails, addresses, and lorem ipsum.",
      },
    ],
  },
];

export const toolCount = categories.reduce((sum, c) => sum + c.tools.length, 0);
