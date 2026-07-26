import { useEffect, useMemo, useState } from "react";

export default function UserAvatar({
  avatarUrl,
  name,
  size = 38,
  className = "",
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl]);

  const initials = useMemo(() => {
    const parts = String(name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return "U";
    return parts
      .slice(-2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();
  }, [name]);

  return (
    <span
      className={`user-avatar ${className}`.trim()}
      style={{ "--avatar-size": `${size}px` }}
      aria-label={name ? `Avatar của ${name}` : "Avatar người dùng"}
    >
      {avatarUrl && !imageFailed ? (
        <img
          src={avatarUrl}
          alt={name || "Avatar người dùng"}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
