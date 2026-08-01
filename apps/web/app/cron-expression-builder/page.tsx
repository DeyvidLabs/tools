import type { Metadata } from "next";
import { CronExpressionBuilder } from "./cron-expression-builder";

export const metadata: Metadata = {
  title: "Cron Expression Builder — Tools",
  description: "Describe a 5-field cron expression in plain English and preview its next run times.",
};

export default function CronExpressionBuilderPage() {
  return <CronExpressionBuilder />;
}
