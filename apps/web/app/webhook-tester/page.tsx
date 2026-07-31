import type { Metadata } from "next";
import { WebhookTester } from "./webhook-tester";

export const metadata: Metadata = {
  title: "Webhook Tester — Tools",
  description:
    "Get a unique URL, send it any HTTP request, and watch method/headers/body show up in real time.",
};

export default function WebhookTesterPage() {
  return <WebhookTester />;
}
