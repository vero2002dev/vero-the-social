"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { requireUser } from "@/lib/auth";
import { isBootstrapAdmin } from "@/lib/admin";
import { setAdminCookie, setVerificationCookies } from "@/lib/verificationCookies";
import AppShell from "@/components/AppShell";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/I18nProvider";
import { resolveI18nError } from "@/lib/i18n/resolveError";

type ProfileRow = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  city: string | null;
  verification_status: string | null;
  visibility_status?: string | null;
  strikes?: number | null;
  banned_at?: string | null;
  show_followers: boolean;
  show_following: boolean;
  show_likes: boolean;
  show_comments: boolean;
  dm_privacy: "all" | "matches";
};

type ExtraPhoto = {
  id: string;
  storage_path: string;
  signed_url?: string | null;
  review_status?: "none" | "needs_review" | "reviewed_ok" | "reviewed_bad";
  public_visible?: boolean;
  status?: "pending" | "approved" | "rejected" | "deleted";
  created_at?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const [extraPhotos, setExtraPhotos] = useState<ExtraPhoto[]>([]);
  const [extraLoading, setExtraLoading] = useState(false);
  const extraInputRef = useRef<HTMLInputElement | null>(null);
  const [hasShowComments, setHasShowComments] = useState(true);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const avatarBucketReady = useRef<boolean | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [pendingReq, setPendingReq] = useState<{
    id: string;
    type: "initial" | "profile_change";
    challenge_code: string;
  } | null>(null);

  async function ensureAvatarBucket() {
    if (avatarBucketReady.current === true) return true;
    try {
      const res = await fetch("/api/ensure-avatars-bucket", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body?.error ? `: ${body.error}` : "";
        setMsg(`${t("profile.error.bucket")}${detail}`);
        avatarBucketReady.current = false;
        return false;
      }
      avatarBucketReady.current = true;
      return true;
    } catch (err: any) {
      setMsg(`${t("profile.error.bucket")}: ${err?.message ?? t("common.error_generic")}`);
      avatarBucketReady.current = false;
      return false;
    }
  }

  async function load() {
    setMsg(null);
    const user = await requireUser();

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, username, bio, avatar_url, avatar_path, city, verification_status, visibility_status, strikes, banned_at, show_followers, show_following, show_likes, show_comments, dm_privacy"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      const missingShowComments = String(error.message).includes("show_comments");
      const missingDmPrivacy = String(error.message).includes("dm_privacy");
      if (missingShowComments || missingDmPrivacy) {
        const { data: fallback, error: fbErr } = await supabase
          .from("profiles")
          .select("id, username, bio, avatar_url, avatar_path, city, verification_status, visibility_status, strikes, banned_at, show_followers, show_following, show_likes")
          .eq("id", user.id)
          .maybeSingle();
        if (fbErr) {
          setMsg(`${t("profile.error.profile_load")}: ${fbErr.message}`);
          return;
        }
        setHasShowComments(!missingShowComments);
        const withDefault = { ...(fallback as any), show_comments: true, dm_privacy: "matches" };
        setProfile(withDefault as ProfileRow);
        setUsername((withDefault as any).username ?? "");
        setBio((withDefault as any).bio ?? "");
        setAvatarPath((withDefault as any).avatar_path ?? null);
        await resolveAvatarUrl((withDefault as any).avatar_path, (withDefault as any).avatar_url);
        setCity((withDefault as any).city ?? "");
        await loadExtraPhotos(user.id);
        return;
      }
      setMsg(`${t("profile.error.profile_load")}: ${error.message}`);
      return;
    }

    setProfile(data as ProfileRow);
    setUsername((data as any).username ?? "");
    setBio((data as any).bio ?? "");
    setAvatarPath((data as any).avatar_path ?? null);
    await resolveAvatarUrl((data as any).avatar_path, (data as any).avatar_url);
    setCity((data as any).city ?? "");
    setHasShowComments(true);
    await loadExtraPhotos(user.id);
    const { data: pr, error: pre } = await supabase
      .from("verification_requests")
      .select("id,type,challenge_code,created_at")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);
    if (!pre) {
      setPendingReq((pr?.[0] as any) ?? null);
    }
  }

  async function resolveAvatarUrl(path?: string | null, fallbackUrl?: string | null) {
    if (path) {
      const { data: signed, error } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60);
      if (!error) {
        setAvatarUrl(signed?.signedUrl ?? null);
        return;
      }
    }
    setAvatarUrl(fallbackUrl ?? null);
  }

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setVerificationCookies(null, false);
        setAdminCookie(false);
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("verification_status, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      const status = (data?.verification_status as any) ?? "unverified";
      const nextAdmin = !!data?.is_admin || isBootstrapAdmin(user.email);
      setVerificationCookies(status, true);
      setAdminCookie(nextAdmin);
      setIsAdminUser(nextAdmin);

      if (error || status !== "verified") {
        router.replace("/verify");
        return;
      }

      await load();
    })().catch((e) => setMsg(resolveI18nError(t, e, t("profile.error.generic"))));
  }, [router]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!settingsOpen) return;
      const target = e.target as Node | null;
      if (settingsRef.current && target && !settingsRef.current.contains(target)) {
        setSettingsOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [settingsOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!settingsOpen) return;
      if (e.key === "Escape") setSettingsOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [settingsOpen]);

  async function saveProfile() {
    if (!profile) return;
    setLoading(true);
    setMsg(null);

    const user = await requireUser();

    const { error } = await supabase
      .from("profiles")
      .update({
        username: username.trim() || null,
        bio: bio.trim() || null,
        city: city.trim() || null,
      })
      .eq("id", user.id);
      

    setLoading(false);

    if (error) return setMsg(`${t("profile.error.save")}: ${error.message}`);

    setMsg(t("profile.saved"));
    load().catch(() => {});
  }

  async function loadExtraPhotos(userId: string) {
    const { data, error } = await supabase
      .from("profile_photos")
      .select("id, storage_path, review_status, public_visible, status, created_at")
      .eq("user_id", userId)
      .eq("kind", "extra")
      .neq("status", "deleted")
      .order("created_at", { ascending: false });

    if (error) {
      setMsg(`${t("profile.error.media_load")}: ${error.message}`);
      return;
    }

    const withUrls = await Promise.all(
      (data ?? []).map(async (row: any) => {
        const { data: signed, error: sErr } = await supabase.storage
          .from("private_media")
          .createSignedUrl(row.storage_path, 60 * 10);
        if (sErr) return { ...row, signed_url: null };
        return { ...row, signed_url: signed?.signedUrl ?? null };
      })
    );

    setExtraPhotos(withUrls as ExtraPhoto[]);
  }

  async function onPickExtras(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    setMsg(null);
    setExtraLoading(true);

    try {
      const user = await requireUser();

      for (const file of selected) {
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const photoId = crypto.randomUUID();
        const path = `user/${user.id}/extras/${photoId}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("private_media")
          .upload(path, file, { upsert: false, contentType: file.type });

        if (upErr) {
          setMsg(`${t("profile.error.media_upload")}: ${upErr.message}`);
          continue;
        }

        const { error: insErr } = await supabase
          .from("profile_photos")
          .insert({
            id: photoId,
            user_id: user.id,
            kind: "extra",
            storage_path: path,
            status: "approved",
            meta: { source: "camera", bucket: "private_media" },
          });

        if (insErr) {
          setMsg(`${t("profile.error.media_save")}: ${insErr.message}`);
        } else {
          await fetch("/api/photos/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photo_id: photoId }),
          });
        }
      }

      await loadExtraPhotos(user.id);
    } finally {
      setExtraLoading(false);
      e.target.value = "";
    }
  }

  async function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    setMsg(null);
    setLoading(true);

    try {
      const user = await requireUser();
      const currentStatus = (profile?.verification_status as string | null) ?? "unverified";
      if (currentStatus === "verified") {
        const ok = confirm(t("profile.avatar_reverify_confirm"));
        if (!ok) return;
      }

      let requestId: string | null = pendingReq?.id ?? null;
      if (!requestId) {
        const type = currentStatus === "verified" ? "profile_change" : "initial";
        const { data: rid, error: startErr } = await supabase.rpc("rpc_start_verification", {
          p_type: type,
        });
        if (startErr) {
          setMsg(`${t("profile.error.avatar_save")}: ${startErr.message}`);
          return;
        }
        requestId = (rid as string) ?? null;
        if (requestId) {
          setPendingReq({ id: requestId, type, challenge_code: "" });
        }
      }

      const ready = await ensureAvatarBucket();
      if (!ready) return;
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const photoId = crypto.randomUUID();
      const path = `user/${user.id}/profile/${photoId}.${ext}`;
      let upErr: { message: string } | null = null;
      const upload = async () =>
        supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });

      const firstTry = await upload();
      upErr = firstTry.error;

      if (upErr) {
        if (upErr.message.toLowerCase().includes("bucket not found")) {
          const apiRes = await fetch("/api/ensure-avatars-bucket", { method: "POST" });
          if (apiRes.ok) {
            const retry = await upload();
            upErr = retry.error;
          }
        }
        if (upErr) {
          setMsg(`${t("profile.error.avatar_upload")}: ${upErr.message}`);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_path: path })
        .eq("id", user.id);

      if (error) {
        setMsg(`${t("profile.error.avatar_save")}: ${error.message}`);
        return;
      }

      await supabase.from("profile_photos").insert({
        id: photoId,
        user_id: user.id,
        kind: "profile",
        storage_path: path,
        status: "pending",
        public_visible: false,
        meta: { request_id: requestId, bucket: "avatars", source: "camera" },
      });

      await fetch("/api/photos/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_id: photoId }),
      });

      setAvatarPath(path);
      await resolveAvatarUrl(path, null);
      setMsg(t("profile.avatar_updated"));
      router.push("/verify");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function toggle(
    field: "show_followers" | "show_following" | "show_likes" | "show_comments"
  ) {
    if (field === "show_comments" && !hasShowComments) {
      setMsg(t("profile.error.show_comments_missing"));
      return;
    }
    if (!profile) return;
    const next = { ...profile, [field]: !profile[field] };

    setProfile(next);
    const user = await requireUser();

    const { error } = await supabase
      .from("profiles")
      .update({ [field]: next[field] })
      .eq("id", user.id);

    if (error) {
      setMsg(`${t("common.error_prefix")}${error.message}`);
      // reverter UI se falhar
      setProfile(profile);
    }
  }

  async function updateDmPrivacy(next: "all" | "matches") {
    if (!profile) return;
    if (profile.dm_privacy === next) return;
    const prev = profile.dm_privacy;
    setProfile({ ...profile, dm_privacy: next });
    const user = await requireUser();
    const { error } = await supabase.from("profiles").update({ dm_privacy: next }).eq("id", user.id);
    if (error) {
      setMsg(`${t("common.error_prefix")}${error.message}`);
      setProfile({ ...profile, dm_privacy: prev });
    }
  }

  const displayName = profile?.username ?? t("profile.no_username");
  const initials = (profile?.username ?? "?").slice(0, 1).toUpperCase();
  const isVerified = profile?.verification_status === "verified";
  const isPending = profile?.verification_status === "pending";

  async function startVerificationInitial() {
    if (!profile) return;
    setLoading(true);
    setMsg(null);
    try {
      const { data: rid, error } = await supabase.rpc("rpc_start_verification", {
        p_type: "initial",
      });
      if (error) throw error;
      const requestId = (rid as string) ?? null;
      if (requestId) {
        setPendingReq({ id: requestId, type: "initial", challenge_code: "" });
      }
      await load();
      setMsg(t("profile.verify_hint"));
    } catch (e: any) {
      setMsg(e?.message ?? t("common.error_generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title={t("nav.me")}>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Link
            href="/invite"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
          >
            {t("profile.invites")}
          </Link>
          <Link
            href="/premium"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
          >
            {t("profile.premium")}
          </Link>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-left"
          >
            {t("profile.settings")}
          </button>
          {isAdminUser ? (
            <Link
              href="/admin/metrics"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              {t("profile.admin_metrics")}
            </Link>
          ) : null}
          {isAdminUser ? (
            <Link
              href="/admin/review"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              {t("profile.admin_review")}
            </Link>
          ) : null}
        </div>

      <Card className="border-border bg-card/70">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>{t("profile.title")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="group h-20 w-20 overflow-hidden rounded-full border border-border bg-muted text-lg font-semibold"
                aria-label={t("profile.change_avatar")}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">{initials}</span>
                )}
                <span className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs opacity-0 transition-opacity group-hover:opacity-100">
                  {t("profile.change")}
                </span>
              </button>
              {isVerified && (
                <span className="absolute -bottom-1 -right-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white ring-2 ring-background">
                  <svg
                    viewBox="0 0 16 16"
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                    fill="currentColor"
                  >
                    <path d="M6.2 11.4 2.9 8.1l1.1-1.1 2.2 2.2 5-5 1.1 1.1z" />
                  </svg>
                </span>
              )}
            </div>
            <div className="grid gap-1">
              <div className="text-lg font-semibold">@{displayName}</div>
              <div className="text-sm opacity-70">{profile?.city ?? t("profile.no_city")}</div>
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={onPickAvatar}
            className="hidden"
          />
          {!isVerified && !isPending ? (
            <button
              type="button"
              onClick={startVerificationInitial}
              className="w-full rounded-2xl bg-white text-black py-3 text-sm font-medium"
              disabled={loading}
            >
              {t("profile.verify_cta")}
            </button>
          ) : null}
          {isPending ? (
            <button
              type="button"
              onClick={() => router.push("/verify")}
              className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 text-sm text-neutral-200 disabled:opacity-60"
              disabled={loading}
            >
              {t("verify.go_to_selfie")}
            </button>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4">
              <Label>{t("profile.about")}</Label>
              <textarea
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder={t("profile.about_placeholder")}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={saveProfile} disabled={loading}>
                  {loading ? t("common.creating") : t("profile.save_bio")}
                </Button>
              </div>
            </div>

          </div>

          <div className="grid gap-2">
            <Label>{t("profile.relations")}</Label>
            <div className="text-sm opacity-70">{t("profile.relations_hint")}</div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>{t("profile.media")}</Label>
              <div>
                <input
                  ref={extraInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onPickExtras}
                  className="hidden"
                />
                <Button type="button" variant="outline" onClick={() => extraInputRef.current?.click()}>
                  {t("profile.add_media")}
                </Button>
              </div>
            </div>
            {extraLoading ? <div className="text-sm opacity-70">{t("profile.uploading")}</div> : null}
            {extraPhotos.length === 0 ? (
              <div className="text-sm opacity-70">{t("profile.no_media")}</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {extraPhotos.map((item) => (
                  <div key={item.id} className="relative">
                    {item.signed_url ? (
                      <img
                        src={item.signed_url}
                        alt="media"
                        className="h-36 w-full rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-36 w-full rounded-md bg-muted/30" />
                    )}
                    {item.review_status === "needs_review" || item.public_visible === false ? (
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white bg-black/40 rounded-md">
                        {t("profile.photo_review")}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2" />
        </CardContent>
      </Card>

      {settingsOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4 animate-in fade-in-0">
          <div ref={settingsRef} className="w-full max-w-lg">
            <Card className="animate-in fade-in-0 zoom-in-95">
              <CardHeader>
                <CardTitle>{t("profile.settings_modal")}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label>{t("profile.username")}</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t("profile.username_placeholder")}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>{t("profile.city")}</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("profile.city_placeholder")} />
                </div>

                <div className="grid gap-2 pt-2">
                  <Label>{t("profile.private_space")}</Label>
                  <div className="text-sm opacity-70">{t("profile.private_space_hint")}</div>
                  <div className="flex gap-2">
                    <Button
                      variant={profile?.dm_privacy === "all" ? "secondary" : "outline"}
                      onClick={() => updateDmPrivacy("all")}
                    >
                      {t("profile.all")}
                    </Button>
                    <Button
                      variant={profile?.dm_privacy === "matches" ? "secondary" : "outline"}
                      onClick={() => updateDmPrivacy("matches")}
                    >
                      {t("profile.matches_only")}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2 pt-2">
                  <Label>{t("profile.blocks")}</Label>
                  <div className="text-sm opacity-70">{t("profile.blocks_hint")}</div>
                  <Button variant="outline" onClick={() => router.push("/settings/blocks")}>
                    {t("profile.view_blocks")}
                  </Button>
                </div>

                <div className="grid gap-3 pt-2">
                  {hasShowComments ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t("profile.show_comments")}</div>
                        <div className="text-sm opacity-70">
                          {t("profile.show_comments_hint")}
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => toggle("show_comments")}>
                        {profile?.show_comments ? t("common.on") : t("common.off")}
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveProfile} disabled={loading}>
                    {loading ? t("common.creating") : t("profile.save")}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => supabase.auth.signOut().then(() => (location.href = "/login"))}
                  >
                    {t("profile.logout")}
                  </Button>
                  <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
                    {t("profile.close")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {msg && <div className="text-sm">{msg}</div>}
      </div>
    </AppShell>
  );
}
