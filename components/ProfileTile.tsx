"use client";

import Link from "next/link";

export default function ProfileTile({
  title,
  subtitle,
  href,
  onClick,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  onClick?: () => void;
}) {
  const content = (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-white/20 transition">
      <div className="font-medium">{title}</div>
      {subtitle ? <div className="mt-1 text-sm text-neutral-400">{subtitle}</div> : null}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return (
    <button type="button" onClick={onClick} className="text-left">
      {content}
    </button>
  );
}
