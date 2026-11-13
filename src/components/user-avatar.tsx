import Image from "next/image";

export function UserAvatar({ src, name, className = "" }: { src?: string | null; name: string; className?: string }) {
  const initial = name.trim().charAt(0).toLocaleUpperCase() || "?";

  return (
    <span className={`user-avatar ${className}`} aria-hidden="true">
      {src ? <Image src={src} alt="" width={100} height={100} unoptimized /> : <span>{initial}</span>}
    </span>
  );
}
