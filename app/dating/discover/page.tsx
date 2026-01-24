"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useI18n } from "@/components/I18nProvider";

type Profile = {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  verification_status?: string | null;
  intent?: string | null;
};

export default function DiscoverPage() {
  const [me, setMe] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [idx, setIdx] = useState(0);
const [msg, setMsg] = useState<string | null>(null);
  const { t } = useI18n();

  function formatIntent(value?: string | null) {
    if (!value) return t("dating.intent.undefined");
    switch (value) {
      case "curiosidade":
        return t("dating.intent.curiosidade");
      case "conexao":
        return t("dating.intent.conexao");
      case "desejo":
        return t("dating.intent.desejo");
      case "conversa":
        return t("dating.intent.conversa");
      case "privado":
        return t("dating.intent.privado");
      case "passageiro":
        return t("dating.intent.passageiro");
      default:
        return t("dating.intent.undefined");
    }
  }

  const current = useMemo(() => profiles[idx] ?? null, [profiles, idx]);

  useEffect(() => {
    (async () => {
      setMsg(null);
      const { data: sess } = await supabase.auth.getSession();
      const user = sess.session?.user;
      if (!user) {
        setMsg(t("dating.login_required"));
        return;
      }
      setMe(user.id);

      // buscar perfis (MVP): todos menos eu
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, verification_status, intent")
        .neq("id", user.id)
        .limit(50);

      if (error) return setMsg(t("dating.discover.error.load", { msg: error.message }));
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

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { count, error: countErr } = await supabase
      .from("likes")
      .select("id", { count: "exact", head: true })
      .eq("liker_id", me)
      .gte("created_at", start.toISOString())
      .is("post_id", null);

    if (countErr && String(countErr.message).includes("created_at")) {
      // fallback: allow if schema doesn't have created_at
    } else if ((count ?? 0) >= 5) {
      setMsg(t("dating.discover.limit"));
      return;
    }

    const { error } = await supabase.from("likes").insert({
      liker_id: me,
      liked_id: current.id,
    });

    // se for duplicate like, ignoramos
    if (error && !String(error.message).toLowerCase().includes("duplicate")) {
      setMsg(t("dating.discover.error.like", { msg: error.message }));
      return;
    }

    setMsg(t("dating.reveal_sent"));
    nextCard();
  }

  if (!me) {
    return (
      <main className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("dating.title")}</h1>
        {msg && <p className="text-sm opacity-80">{msg}</p>}
        <Link className="underline" href="/login">
          {t("dating.login_link")}
        </Link>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card/70 p-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("dating.explore")}</div>
          <h1 className="text-2xl font-semibold">{t("dating.title")}</h1>
        </div>
        <Link className="text-xs uppercase tracking-[0.2em] text-muted-foreground" href="/dating/matches">
          {t("dating.accepted")}
        </Link>
      </div>

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

      {!current ? (
        <div className="border rounded-2xl p-6 bg-card/70">
          <p>{t("dating.discover.empty")}</p>
        </div>
      ) : (
        <div className="border rounded-3xl p-6 space-y-5 max-w-2xl bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_55%)]">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full border overflow-hidden flex items-center justify-center bg-muted/30">
              {current.avatar_url ? (
                <img src={current.avatar_url} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm opacity-70">{t("dating.no_photo")}</span>
              )}
            </div>
            <div>
              <div className="font-semibold text-lg">{current.display_name ?? t("dating.discover.no_name")}</div>
              <div className="text-xs opacity-70">
                {t("dating.intent_label")}: {formatIntent(current.intent)}
              </div>
            </div>
          </div>

          {current.bio && <p className="text-sm leading-relaxed">{current.bio}</p>}

          <div className="flex gap-3">
            <button onClick={nextCard} className="px-5 py-2 rounded-full border bg-transparent">
              {t("dating.not_now")}
            </button>
            <button onClick={like} className="px-5 py-2 rounded-full border bg-white text-black">
              {t("dating.reveal")}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
