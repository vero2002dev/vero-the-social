"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useI18n } from "@/components/I18nProvider";

type MatchRow = {
  id: number;
  user1: string;
  user2: string;
  created_at: string;
  expires_at?: string | null;
};

export default function MatchesPage() {
  const [me, setMe] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    (async () => {
      setMsg(null);
      const { data: sess } = await supabase.auth.getSession();
      const user = sess.session?.user;
      if (!user) {
        setMsg(t("dating.matches.login_required"));
        return;
      }
      setMe(user.id);

    const { data, error } = await supabase
      .from("matches")
      .select("id, user1, user2, created_at, expires_at")
      .order("created_at", { ascending: false })
      .limit(100);

      if (error) return setMsg(t("dating.matches.error", { msg: error.message }));
      setMatches((data as MatchRow[]) ?? []);
    })();
  }, []);

  function otherUser(m: MatchRow) {
    if (!me) return "";
    return m.user1 === me ? m.user2 : m.user1;
  }

  const now = Date.now();
  const visibleMatches = matches.filter((m: any) => {
    const exp = m.expires_at ? new Date(m.expires_at).getTime() : new Date(m.created_at).getTime() + 48 * 3600 * 1000;
    return exp > now;
  });

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card/70 p-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {t("dating.matches.connections")}
          </div>
          <h1 className="text-2xl font-semibold">{t("dating.matches.title")}</h1>
        </div>
        <Link className="text-xs uppercase tracking-[0.2em] text-muted-foreground" href="/dating/discover">
          {t("dating.matches.back_discover")}
        </Link>
      </div>

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

      <div className="space-y-3">
        {visibleMatches.map((m) => (
          <div
            key={m.id}
            className="border rounded-2xl p-4 flex items-center justify-between bg-card/70"
          >
            <div className="text-sm">
              {t("dating.matches.accepted_with")}:{" "}
              <span className="font-mono text-xs">{otherUser(m)}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(m.created_at).toLocaleString()}
            </span>
          </div>
        ))}
        {visibleMatches.length === 0 && (
          <div className="border rounded-2xl p-4 bg-card/70">
            {t("dating.matches.empty")}
          </div>
        )}
      </div>
    </main>
  );
}
