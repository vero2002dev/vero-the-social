"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/discover", label: "Descobrir" },
  { href: "/inbox", label: "Inbox" },
  { href: "/chats", label: "Chats" },
  { href: "/profile", label: "Eu" },
];

export default function AppShell({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const path = usePathname();

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-white/10">
        <div className="max-w-xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <div>{right}</div>
        </div>
      </header>

      <section className="max-w-xl mx-auto px-5 py-5 pb-24">{children}</section>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/90 backdrop-blur">
        <div className="max-w-xl mx-auto px-5 py-3 grid grid-cols-4 gap-2 text-xs">
          {tabs.map((t) => {
            const active = path?.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`rounded-2xl py-2 text-center border ${
                  active
                    ? "bg-white text-black border-white"
                    : "border-white/10 text-neutral-300"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
