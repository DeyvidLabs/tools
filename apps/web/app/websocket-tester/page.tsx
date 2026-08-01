import type { Metadata } from "next";
import { WebSocketTester } from "./websocket-tester";

export const metadata: Metadata = {
  title: "WebSocket Tester — Tools",
  description:
    "Connect to a raw WebSocket echo/relay, send messages, and watch them come back — solo or shared with another device via a room id.",
};

export default function WebSocketTesterPage() {
  return <WebSocketTester />;
}
