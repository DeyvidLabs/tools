"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { calculateSubnet, parseCidr, splitIntoSubnets, type SubnetInfo } from "./lib";

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2 text-sm last:border-b-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-mono text-secondary-foreground">{value}</dd>
    </div>
  );
}

export function SubnetCidrCalculator() {
  const [input, setInput] = useState("192.168.1.10/24");
  const [splitCount, setSplitCount] = useState("4");

  const parsed = useMemo(() => parseCidr(input), [input]);
  const info: SubnetInfo | null = useMemo(
    () => (parsed ? calculateSubnet(parsed.ip, parsed.prefix) : null),
    [parsed],
  );

  const splitN = Number(splitCount);
  const splitResult = useMemo(() => {
    if (!parsed || !Number.isInteger(splitN) || splitN < 1) return null;
    return splitIntoSubnets(parsed.ip, parsed.prefix, splitN);
  }, [parsed, splitN]);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-10">
      <div className="w-full max-w-2xl">
        <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
          ← Tools
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
          Subnet / CIDR Calculator
        </h1>
        <p className="mt-2 text-muted-foreground">
          Network/broadcast address, masks, and usable host range from a CIDR block — entirely in
          your browser.
        </p>

        <div className="mt-8 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-sm">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder="192.168.1.10/24"
            className="w-full rounded-md border border-border bg-secondary px-3 py-2 font-mono text-sm text-secondary-foreground placeholder:text-muted-foreground"
          />
          {!parsed && input.trim() !== "" && (
            <p className="mt-2 text-sm text-accent-rose">
              Enter a valid CIDR block, e.g. 192.168.1.10/24.
            </p>
          )}
        </div>

        {info && (
          <div className="mt-6 rounded-lg border border-border bg-card/70 p-5">
            <h2 className="text-sm font-semibold text-card-foreground">Subnet details</h2>
            <dl className="mt-1">
              <InfoRow label="Network address" value={info.networkAddress} />
              <InfoRow label="Broadcast address" value={info.broadcastAddress} />
              <InfoRow label="Subnet mask" value={info.subnetMask} />
              <InfoRow label="Wildcard mask" value={info.wildcardMask} />
              <InfoRow
                label="Usable host range"
                value={`${info.firstUsableHost} – ${info.lastUsableHost}`}
              />
              <InfoRow label="Usable hosts" value={info.usableHostCount.toLocaleString()} />
              <InfoRow label="Total addresses" value={info.totalAddresses.toLocaleString()} />
            </dl>
          </div>
        )}

        {info && (
          <div className="mt-6 rounded-lg border border-border bg-card/70 p-5">
            <h2 className="text-sm font-semibold text-card-foreground">Split into N subnets</h2>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Split into</span>
              <input
                type="number"
                min={1}
                value={splitCount}
                onChange={(e) => setSplitCount(e.target.value)}
                className="w-20 rounded-md border border-border bg-secondary px-2 py-1 text-sm text-secondary-foreground"
              />
              <span className="text-sm text-muted-foreground">equal subnets</span>
            </div>

            {splitCount.trim() !== "" && !splitResult && (
              <p className="mt-2 text-sm text-accent-rose">
                Can&apos;t split /{info.prefix} into that many pieces — not enough address space.
              </p>
            )}

            {splitResult && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Subnet</th>
                      <th className="pb-2 font-medium">Usable range</th>
                      <th className="pb-2 font-medium">Hosts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {splitResult.subnets.map((s) => (
                      <tr key={s.cidr} className="border-b border-border/60 last:border-b-0">
                        <td className="py-2 font-mono text-secondary-foreground">{s.cidr}</td>
                        <td className="py-2 font-mono text-xs text-secondary-foreground">
                          {s.firstUsableHost} – {s.lastUsableHost}
                        </td>
                        <td className="py-2 font-mono text-secondary-foreground">
                          {s.usableHostCount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
