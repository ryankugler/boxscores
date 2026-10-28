import type { CSSProperties, SyntheticEvent } from "react";

import { getTeamLogo } from "../data/constants";
import type { TeamCode } from "../types";

interface TeamLogoProps {
  abbr: TeamCode;
  logoUrl?: string;
  size?: number;
  style?: CSSProperties;
  className?: string;
}

export function TeamLogo({ abbr, logoUrl, size = 28, style, className }: TeamLogoProps) {
  const fallbackLogo = getTeamLogo(abbr);
  const src = getTeamLogo(abbr, logoUrl);

  if (!src) {
    return (
      <span
        className={className}
        style={{
          width: size,
          height: size,
          display: "inline-block",
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  const handleError = (event: SyntheticEvent<HTMLImageElement>) => {
    if (
      logoUrl &&
      fallbackLogo &&
      event.currentTarget.dataset.fallbackApplied !== "true"
    ) {
      event.currentTarget.dataset.fallbackApplied = "true";
      event.currentTarget.src = fallbackLogo;
      return;
    }

    event.currentTarget.style.visibility = "hidden";
  };

  return (
    <img
      src={src}
      alt={abbr}
      className={className}
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block", flexShrink: 0, ...style }}
      onError={handleError}
    />
  );
}
