"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useI18n } from "@/components/I18nProvider";

type MatchRow = {
  id: number;
  user1: string;
  user2: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  avatar_url: string | null;
};

type ConsentRow = {
  id: number;
  requester_id: string;
  target_id: string;
  status: "pending" | "accepted" | "rejected" | "canceled";
  updated_at: string;
};

export default function DmPage() {
  const [me, setMe] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  const consentByTarget = useMemo(() => {
    const map = new Map<string, ConsentRow>();
    consents
      .filter((c) => c.requester_id === me)
      .forEach((c) => map.set(c.target_id, c));
    return map;
  }, [consents, me]);

  async function load() {
    setMsg(null);
    const { data: sess } = await supabase.auth.getSession();
    const user = sess.session?.user;
    if (!user) {
      setMsg(t("dm.login_required"));
      return;
    }
    setMe(user.id);

    const { data: matchData, error: matchErr } = await supabase
      .from("matches")
      .select("id, user1, user2, created_at")
      .or(`user1.eq.${user.id},user2.eq.${user.id}`);

    if (matchErr) return setMsg(t("dm.error.matches", { msg: matchErr.message }));
    const matchRows = (matchData as MatchRow[]) ?? [];
    setMatches(matchRows);

    const otherIds = Array.from(
      new Set(
        matchRows.map((m) => (m.user1 === user.id ? m.user2 : m.user1))
      )
    );

    if (otherIds.length) {
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", otherIds);

      if (profileErr) return setMsg(t("dm.error.profiles", { msg: profileErr.message }));
      const map: Record<string, ProfileRow> = {};
      (profileData as ProfileRow[]).forEach((p) => {
        map[p.id] = p;
      });
      setProfiles(map);
    } else {
      setProfiles({});
    }

    const { data: consentData, error: consentErr } = await supabase
      .from("dm_consent_requests")
      .select("id, requester_id, target_id, status, updated_at")
      .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`);

    if (consentErr) return setMsg(t("dm.error.consents", { msg: consentErr.message }));
    setConsents((consentData as ConsentRow[]) ?? []);
  }

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, []);

  function getProfile(id: string) {
    return profiles[id] ?? null;
  }

  async function requestConsent(targetId: string) {
    if (!me) return;
    setLoading(true);
    const now = new Date().toISOString();
    const { error } = await supabase.from("dm_consent_requests").upsert(
      {
        requester_id: me,
        target_id: targetId,
        status: "pending",
        updated_at: now,
      },
      { onConflict: "requester_id,target_id" }
    );
    setLoading(false);
    if (error) return setMsg(t("dm.error.request", { msg: error.message }));
    await load();
  }

  async function updateConsent(id: number, status: ConsentRow["status"]) {
    setLoading(true);
    const { error } = await supabase
      .from("dm_consent_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    setLoading(false);
    if (error) return setMsg(t("dm.error.generic", { msg: error.message }));
    await load();
  }

  if (!me) {
    return (
      <main className="space-y-3">
        <h1 className="text-2xl font-semibold">{t("dm.title")}</h1>
        {msg && <p className="text-sm opacity-80">{msg}</p>}
        <Link className="underline" href="/login">
          {t("dm.login_link")}
        </Link>
      </main>
    );
  }

  const incoming = consents.filter((c) => c.target_id === me && c.status === "pending");
  const outgoing = consents.filter((c) => c.requester_id === me);

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card/70 p-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("dm.private_label")}</div>
          <h1 className="text-2xl font-semibold">{t("dm.title")}</h1>
        </div>
        <Link className="text-xs uppercase tracking-[0.2em] text-muted-foreground" href="/settings">
          {t("dm.settings")}
        </Link>
      </div>

      {msg && <p className="text-sm text-muted-foreground">{msg}</p>}

      <div className="grid gap-4">
        <div className="rounded-2xl border border-border bg-card/70 p-4 text-sm text-muted-foreground">
          {t("dm.sensitive_note")}
        </div>
        <div className="rounded-2xl border border-border bg-card/70 p-4">
          <div className="font-semibold">{t("dm.received")}</div>
          {incoming.length === 0 ? (
            <div className="text-sm opacity-70 mt-2">{t("dm.none_received")}</div>
          ) : (
            <div className="mt-3 grid gap-3">
              {incoming.map((c) => {
                const p = getProfile(c.requester_id);
                return (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="text-sm">
                      @{p?.username ?? t("dm.user_fallback")}
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-full border px-3 py-1 text-xs"
                        onClick={() => updateConsent(c.id, "accepted")}
                        disabled={loading}
                      >
                        {t("dm.allow")}
                      </button>
                      <button
                        className="rounded-full border px-3 py-1 text-xs"
                        onClick={() => updateConsent(c.id, "rejected")}
                        disabled={loading}
                      >
                        {t("dm.deny")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-4">
          <div className="font-semibold">{t("dm.sent")}</div>
          {outgoing.length === 0 ? (
            <div className="text-sm opacity-70 mt-2">{t("dm.none_sent")}</div>
          ) : (
            <div className="mt-3 grid gap-3">
              {outgoing.map((c) => {
                const p = getProfile(c.target_id);
                return (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="text-sm">
                      @{p?.username ?? t("dm.user_fallback")} · {c.status}
                    </div>
                    {c.status === "pending" || c.status === "accepted" ? (
                      <button
                        className="rounded-full border px-3 py-1 text-xs"
                        onClick={() => updateConsent(c.id, "canceled")}
                        disabled={loading}
                      >
                        {t("dm.cancel_permission")}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card/70 p-4">
          <div className="font-semibold">{t("dm.connections")}</div>
          {matches.length === 0 ? (
            <div className="text-sm opacity-70 mt-2">{t("dm.none_connections")}</div>
          ) : (
            <div className="mt-3 grid gap-3">
              {matches.map((m) => {
                const otherId = m.user1 === me ? m.user2 : m.user1;
                const p = getProfile(otherId);
                const consent = consentByTarget.get(otherId);
                const canRequest =
                  !consent || consent.status === "rejected" || consent.status === "canceled";
                return (
                  <div key={m.id} className="flex items-center justify-between">
                    <div className="text-sm">
                      @{p?.username ?? t("dm.user_fallback")}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {consent?.status === "accepted" ? (
                        <span className="opacity-70">{t("dm.permission_active")}</span>
                      ) : consent?.status === "pending" ? (
                        <span className="opacity-70">{t("dm.pending")}</span>
                      ) : consent?.status === "rejected" ? (
                        <span className="opacity-70">{t("dm.rejected")}</span>
                      ) : null}
                      {canRequest ? (
                        <button
                          className="rounded-full border px-3 py-1"
                          onClick={() => requestConsent(otherId)}
                          disabled={loading}
                        >
                          {consent ? t("dm.request_again") : t("dm.request_permission")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
