"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  verification_status?: string | null;
};

export default function DiscoverPage() {
  const [me, setMe] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [idx, setIdx] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);

  const current = useMemo(() => profiles[idx] ?? null, [profiles, idx]);

  useEffect(() => {
    (async () => {
      setMsg(null);
      const { data: sess } = await supabase.auth.getSession();
      const user = sess.session?.user;
      if (!user) {
        setMsg("Faz login para usar o Discover.");
        return;
      }
      setMe(user.id);

      // buscar perfis (MVP): todos menos eu
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, verification_status")
        .neq("id", user.id)
        .limit(50);

      if (error) return setMsg("Erro a carregar perfis: " + error.message);
      setProfiles((data as Profile[]) ?? []);
      setIdx(0);
    })();
  }, []);

  function nextCard() {
    setMsg(null);
    setIdx((prev) => Math.min(prev + 1, profiles.length)); // se passar do fim, current fica null
  }

  async function like() {
    setMsg(null);
    if (!me || !current) return;

    const { error } = await supabase.from("likes").insert({
      liker_id: me,
      liked_id: current.id,
    });

    // se for duplicate like, ignoramos
    if (error && !String(error.message).toLowerCase().includes("duplicate")) {
      setMsg("Erro no like: " + error.message);
      return;
    }

    setMsg("✅ Like enviado");
    nextCard();
  }

  if (!me) {
    return (
      <main className="space-y-3">
        <h1 className="text-2xl font-semibold">Discover</h1>
        {msg && <p className="text-sm opacity-80">{msg}</p>}
        <Link className="underline" href="/login">
          Ir para Login
        </Link>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card/70 p-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Explorar</div>
          <h1 className="text-2xl font-semibold">Discover</h1>
        </div>
        <Link className="text-xs uppercase tracking-[0.2em] text-muted-foreground" href="/dating/matches">
          Matches
        </Link>
      </div>

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

      {!current ? (
        <div className="border rounded-2xl p-6 bg-card/70">
          <p>Sem mais perfis por agora.</p>
        </div>
      ) : (
        <div className="border rounded-3xl p-6 space-y-5 max-w-2xl bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full border overflow-hidden flex items-center justify-center bg-muted/30">
              {current.avatar_url ? (
                <img src={current.avatar_url} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm opacity-70">sem foto</span>
              )}
            </div>
            <div>
              <div className="font-semibold text-lg">{current.display_name ?? "Sem nome"}</div>
              <div className="text-xs opacity-70">{current.verification_status ?? "pending"}</div>
            </div>
          </div>

          {current.bio && <p className="text-sm leading-relaxed">{current.bio}</p>}

          <div className="flex gap-3">
            <button onClick={nextCard} className="px-5 py-2 rounded-full border bg-transparent">
              Passar
            </button>
            <button onClick={like} className="px-5 py-2 rounded-full border bg-white text-black">
              Like
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
