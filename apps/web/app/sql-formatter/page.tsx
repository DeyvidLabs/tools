import type { Metadata } from "next";
import { SqlFormatter } from "./sql-formatter";

export const metadata: Metadata = {
  title: "SQL Formatter / Minifier — Tools",
  description: "Pretty-print or minify SQL queries in your browser, with PostgreSQL, MySQL, and generic dialect options.",
};

export default function SqlFormatterPage() {
  return <SqlFormatter />;
}
