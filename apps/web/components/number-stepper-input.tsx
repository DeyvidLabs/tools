"use client";

import { useState } from "react";
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
//
// Typing is tracked as free text and only clamped on blur (or via the
// stepper buttons, which clamp immediately) — clamping on every keystroke
// corrupts entry whenever `min` has more digits than an intermediate value.
// E.g. with min=100, typing "500" passes through "5" first: clamping that
// mid-keystroke to 100 makes the next digit concatenate onto "100" instead
// of "5", so "500" never gets typed and the field snaps to max instead.
export function NumberStepperInput({ value, onChange, min = -Infinity, max = Infinity, className = "" }: NumberStepperInputProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const [text, setText] = useState(String(value));
  // Adjusting state during render (not an effect) when the `value` prop
  // changes externally — e.g. the stepper buttons or a parent-side reset —
  // without the extra render pass a useEffect would cost. See
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(String(value));
  }

  const commit = (v: number) => {
    const clamped = clamp(v);
    setText(String(clamped));
    onChange(clamped);
  };

  return (
    <div className="relative inline-flex">
      <input
        type="number"
        min={min}
        max={max}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const parsed = Number(e.target.value);
          if (e.target.value !== "" && !Number.isNaN(parsed)) {
            onChange(parsed);
          }
        }}
        onBlur={() => commit(Number(text) || min)}
        className={`rounded-md border border-border bg-secondary py-1.5 pl-2 pr-6 text-sm text-secondary-foreground [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${className}`}
      />
      <div className="absolute inset-y-0 right-1 flex flex-col justify-center">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Increment"
          onClick={() => commit(value + 1)}
          className="text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronUpIcon />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Decrement"
          onClick={() => commit(value - 1)}
          className="text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronDownIcon />
        </button>
      </div>
    </div>
  );
}
