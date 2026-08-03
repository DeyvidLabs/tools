export interface SubnetInfo {
  cidr: string;
  prefix: number;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstUsableHost: string;
  lastUsableHost: string;
  usableHostCount: number;
  totalAddresses: number;
}

export interface ParsedCidr {
  ip: number;
  prefix: number;
}

function isValidOctet(octet: string): boolean {
  if (!/^\d{1,3}$/.test(octet)) return false;
  const n = Number(octet);
  return n >= 0 && n <= 255;
}

export function ipToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4 || !parts.every(isValidOctet)) return null;
  return parts.reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

export function intToIp(n: number): string {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

export function prefixToMask(prefix: number): number {
  if (prefix <= 0) return 0;
  if (prefix >= 32) return 0xffffffff >>> 0;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

export function parseCidr(input: string): ParsedCidr | null {
  const match = /^(.+)\/(\d{1,2})$/.exec(input.trim());
  if (!match) return null;

  const prefix = Number(match[2]);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return null;

  const ip = ipToInt(match[1].trim());
  if (ip === null) return null;

  return { ip, prefix };
}

export function calculateSubnet(ip: number, prefix: number): SubnetInfo {
  const mask = prefixToMask(prefix);
  const wildcard = ~mask >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const totalAddresses = 2 ** (32 - prefix);

  let firstUsable: number;
  let lastUsable: number;
  let usableHostCount: number;

  if (prefix === 32) {
    // A /32 identifies a single host — no network/broadcast distinction.
    firstUsable = network;
    lastUsable = network;
    usableHostCount = 1;
  } else if (prefix === 31) {
    // RFC 3021 point-to-point link: both addresses are usable, no broadcast.
    firstUsable = network;
    lastUsable = broadcast;
    usableHostCount = 2;
  } else {
    firstUsable = network + 1;
    lastUsable = broadcast - 1;
    usableHostCount = totalAddresses - 2;
  }

  return {
    cidr: `${intToIp(network)}/${prefix}`,
    prefix,
    networkAddress: intToIp(network),
    broadcastAddress: intToIp(broadcast),
    subnetMask: intToIp(mask),
    wildcardMask: intToIp(wildcard),
    firstUsableHost: intToIp(firstUsable),
    lastUsableHost: intToIp(lastUsable),
    usableHostCount,
    totalAddresses,
  };
}

export interface SplitResult {
  newPrefix: number;
  subnets: SubnetInfo[];
}

// Splits the network containing `ip/prefix` into `count` equally-sized subnets,
// growing the prefix to the smallest power of two that covers `count` pieces.
export function splitIntoSubnets(ip: number, prefix: number, count: number): SplitResult | null {
  if (!Number.isInteger(count) || count < 1) return null;

  const extraBits = Math.ceil(Math.log2(count));
  const newPrefix = prefix + extraBits;
  if (newPrefix > 32) return null;

  const networkBase = (ip & prefixToMask(prefix)) >>> 0;
  const subnetSize = 2 ** (32 - newPrefix);

  const subnets = Array.from({ length: count }, (_, i) =>
    calculateSubnet((networkBase + i * subnetSize) >>> 0, newPrefix),
  );

  return { newPrefix, subnets };
}
