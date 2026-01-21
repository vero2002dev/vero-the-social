"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type MatchRow = {
  id: number;
  user1: string;
  user2: string;
  created_at: string;
};

export default function MatchesPage() {
  const [me, setMe] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setMsg(null);
      const { data: sess } = await supabase.auth.getSession();
      const user = sess.session?.user;
      if (!user) {
        setMsg("Faz login para ver matches.");
        return;
      }
      setMe(user.id);

      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) return setMsg("Erro: " + error.message);
      setMatches((data as MatchRow[]) ?? []);
    })();
  }, []);

  function otherUser(m: MatchRow) {
    if (!me) return "";
    return m.user1 === me ? m.user2 : m.user1;
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card/70 p-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Conexoes</div>
          <h1 className="text-2xl font-semibold">Matches</h1>
        </div>
        <Link className="text-xs uppercase tracking-[0.2em] text-muted-foreground" href="/dating/discover">
          Discover
        </Link>
      </div>

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

      <div className="space-y-3">
        {matches.map((m) => (
          <div
            key={m.id}
            className="border rounded-2xl p-4 flex items-center justify-between bg-card/70"
          >
            <div className="text-sm">
              Match com: <span className="font-mono text-xs">{otherUser(m)}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(m.created_at).toLocaleString()}
            </span>
          </div>
        ))}
        {matches.length === 0 && (
          <div className="border rounded-2xl p-4 bg-card/70">
            Ainda não tens matches.
          </div>
        )}
      </div>
    </main>
  );
}
