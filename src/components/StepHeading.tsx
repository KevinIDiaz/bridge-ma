"use client";

import { useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
}

/**
 * The single <h1> for a step. It is focusable (tabIndex={-1}) and focuses itself
 * on mount, so after each client navigation the keyboard and screen-reader focus
 * lands on the new step's heading (Req 15.8). Each step mounts a fresh instance.
 */
export function StepHeading({ children }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <h1 tabIndex={-1} ref={ref}>
      {children}
    </h1>
  );
}
