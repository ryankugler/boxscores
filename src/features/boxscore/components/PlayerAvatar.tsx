import { useState } from "react";

import styles from "./PlayerAvatar.module.css";

interface PlayerAvatarProps {
  name: string;
  photoUrl?: string;
  size?: number;
  className?: string;
}

export function PlayerAvatar({ name, photoUrl, size = 34, className }: PlayerAvatarProps) {
  const [photoState, setPhotoState] = useState<"loading" | "loaded" | "failed">("loading");
  const showPhoto = Boolean(photoUrl) && photoState !== "failed";

  return (
    <span
      className={[styles.avatar, className].filter(Boolean).join(" ")}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.32) }}
    >
      {photoState !== "loaded" && <span className={styles.initials}>{getInitials(name)}</span>}
      {showPhoto && (
        <img
          src={photoUrl}
          alt=""
          loading="lazy"
          onLoad={() => setPhotoState("loaded")}
          onError={() => setPhotoState("failed")}
        />
      )}
    </span>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("");
  return initials || "NA";
}
