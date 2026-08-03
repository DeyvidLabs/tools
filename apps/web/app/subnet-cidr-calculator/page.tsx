import type { Metadata } from "next";
import { SubnetCidrCalculator } from "./subnet-cidr-calculator";

export const metadata: Metadata = {
  title: "Subnet / CIDR Calculator — Tools",
  description:
    "Network/broadcast address, masks, and usable host range from a CIDR block — entirely in your browser.",
};

export default function SubnetCidrCalculatorPage() {
  return <SubnetCidrCalculator />;
}
