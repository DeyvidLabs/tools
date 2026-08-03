import { describe, expect, it } from "vitest";
import {
  calculateSubnet,
  intToIp,
  ipToInt,
  parseCidr,
  prefixToMask,
  splitIntoSubnets,
} from "./lib";

describe("ipToInt / intToIp", () => {
  it("round-trips valid addresses", () => {
    expect(ipToInt("192.168.1.10")).toBe(3232235786);
    expect(intToIp(3232235786)).toBe("192.168.1.10");
    expect(intToIp(ipToInt("255.255.255.255")!)).toBe("255.255.255.255");
    expect(intToIp(ipToInt("0.0.0.0")!)).toBe("0.0.0.0");
  });

  it("rejects malformed or out-of-range addresses", () => {
    expect(ipToInt("256.0.0.1")).toBeNull();
    expect(ipToInt("192.168.1")).toBeNull();
    expect(ipToInt("192.168.1.1.1")).toBeNull();
    expect(ipToInt("abc.def.1.1")).toBeNull();
    expect(ipToInt("")).toBeNull();
  });
});

describe("prefixToMask", () => {
  it("computes masks for boundary and typical prefixes", () => {
    expect(intToIp(prefixToMask(0))).toBe("0.0.0.0");
    expect(intToIp(prefixToMask(24))).toBe("255.255.255.0");
    expect(intToIp(prefixToMask(32))).toBe("255.255.255.255");
  });
});

describe("parseCidr", () => {
  it("parses a valid CIDR string", () => {
    expect(parseCidr("192.168.1.10/24")).toEqual({ ip: ipToInt("192.168.1.10"), prefix: 24 });
  });

  it("rejects invalid input", () => {
    expect(parseCidr("192.168.1.10")).toBeNull();
    expect(parseCidr("192.168.1.10/33")).toBeNull();
    expect(parseCidr("192.168.1.10/-1")).toBeNull();
    expect(parseCidr("not-an-ip/24")).toBeNull();
  });
});

describe("calculateSubnet", () => {
  it("computes a standard /24 subnet", () => {
    const info = calculateSubnet(ipToInt("192.168.1.10")!, 24);
    expect(info).toMatchObject({
      networkAddress: "192.168.1.0",
      broadcastAddress: "192.168.1.255",
      subnetMask: "255.255.255.0",
      wildcardMask: "0.0.0.255",
      firstUsableHost: "192.168.1.1",
      lastUsableHost: "192.168.1.254",
      usableHostCount: 254,
      totalAddresses: 256,
    });
  });

  it("handles the /31 point-to-point edge case (RFC 3021)", () => {
    const info = calculateSubnet(ipToInt("10.0.0.0")!, 31);
    expect(info).toMatchObject({
      networkAddress: "10.0.0.0",
      broadcastAddress: "10.0.0.1",
      firstUsableHost: "10.0.0.0",
      lastUsableHost: "10.0.0.1",
      usableHostCount: 2,
      totalAddresses: 2,
    });
  });

  it("handles the /32 single-host edge case", () => {
    const info = calculateSubnet(ipToInt("10.0.0.5")!, 32);
    expect(info).toMatchObject({
      networkAddress: "10.0.0.5",
      broadcastAddress: "10.0.0.5",
      firstUsableHost: "10.0.0.5",
      lastUsableHost: "10.0.0.5",
      usableHostCount: 1,
      totalAddresses: 1,
    });
  });

  it("handles the /0 whole-internet edge case", () => {
    const info = calculateSubnet(ipToInt("10.0.0.5")!, 0);
    expect(info.networkAddress).toBe("0.0.0.0");
    expect(info.broadcastAddress).toBe("255.255.255.255");
    expect(info.subnetMask).toBe("0.0.0.0");
    expect(info.totalAddresses).toBe(4294967296);
  });
});

describe("splitIntoSubnets", () => {
  it("splits a /24 into 4 equal /26 subnets", () => {
    const result = splitIntoSubnets(ipToInt("192.168.1.0")!, 24, 4);
    expect(result).not.toBeNull();
    expect(result!.newPrefix).toBe(26);
    expect(result!.subnets.map((s) => s.cidr)).toEqual([
      "192.168.1.0/26",
      "192.168.1.64/26",
      "192.168.1.128/26",
      "192.168.1.192/26",
    ]);
  });

  it("rounds the new prefix up to the nearest power of two of pieces", () => {
    // 3 pieces still needs 2 extra bits (4 slots), same as splitting into 4.
    const result = splitIntoSubnets(ipToInt("10.0.0.0")!, 24, 3);
    expect(result!.newPrefix).toBe(26);
    expect(result!.subnets).toHaveLength(3);
  });

  it("aligns the split to the original network base, not the host address", () => {
    const result = splitIntoSubnets(ipToInt("192.168.1.10")!, 24, 2);
    expect(result!.subnets[0].cidr).toBe("192.168.1.0/25");
    expect(result!.subnets[1].cidr).toBe("192.168.1.128/25");
  });

  it("returns null when the split would need more bits than are available", () => {
    expect(splitIntoSubnets(ipToInt("10.0.0.0")!, 30, 8)).toBeNull();
  });

  it("returns null for a non-positive count", () => {
    expect(splitIntoSubnets(ipToInt("10.0.0.0")!, 24, 0)).toBeNull();
  });
});
