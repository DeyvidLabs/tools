"use client";

import { ChevronDownIcon, ChevronUpIcon } from "./icons";

interface NumberStepperInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

// Native <input type="number"> spinner arrows can't be recolored reliably
// across browsers (Firefox in particular ignores attempts to restyle them),
// so this hides them and draws themed chevron buttons instead.
export function NumberStepperInput({ value, onChange, min = -Infinity, max = Infinity, className = "" }: NumberStepperInputProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  return (
    <div className="relative inline-flex">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value) || min))}
        className={`rounded-md border border-border bg-secondary py-1.5 pl-2 pr-6 text-sm text-secondary-foreground [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${className}`}
      />
      <div className="absolute inset-y-0 right-1 flex flex-col justify-center">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Increment"
          onClick={() => onChange(clamp(value + 1))}
          className="text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronUpIcon />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Decrement"
          onClick={() => onChange(clamp(value - 1))}
          className="text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronDownIcon />
        </button>
      </div>
    </div>
  );
}
