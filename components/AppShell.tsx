"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { supabase } from "@/lib/supabaseClient";

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
  const router = useRouter();
  const { t } = useI18n();

  const tabs = [
    { href: "/discover", label: t("nav.discover") },
    { href: "/inbox", label: t("nav.inbox") },
    { href: "/chats", label: t("nav.chats") },
    { href: "/profile", label: t("nav.me") },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-white/10">
        <div className="max-w-xl mx-auto px-5 py-4 flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <div className="flex items-center gap-3">
            {right}
            <button
              className="text-xs text-neutral-300 hover:text-white"
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/login");
              }}
            >
              {t("profile.logout")}
            </button>
          </div>
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
