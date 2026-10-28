import { useState } from "react";

import styles from "./AnimatedScore.module.css";

interface AnimatedScoreProps {
  value: number | string;
  className?: string;
}

// Re-triggers a short "flip" animation whenever the score changes after mount,
// so live score updates catch the eye without animating on first render.
export function AnimatedScore({ value, className }: AnimatedScoreProps) {
  const [tracked, setTracked] = useState({ value, flips: 0 });

  if (tracked.value !== value) {
    setTracked({ value, flips: tracked.flips + 1 });
  }

  return (
    <span
      key={tracked.flips}
      className={[className, "tabular", tracked.flips > 0 ? styles.flip : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {value}
    </span>
  );
}
