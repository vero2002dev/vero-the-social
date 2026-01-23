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

type ProfileRow = {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  avatar_path: string | null;
  city: string | null;
  verification_status: string | null;
  show_followers: boolean;
  show_following: boolean;
  show_likes: boolean;
  show_comments: boolean;
  dm_privacy: "all" | "matches";
};

type MediaItem = {
  id: number;
  media_type: "image" | "video";
  storage_path: string;
  signed_url?: string | null;
  moderation_status?: "pending" | "safe" | "sensual" | "explicit" | "pending_manual" | null;
};

export default function ProfilePage() {
  const router = useRouter();
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
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement | null>(null);
  const [revealedMedia, setRevealedMedia] = useState<Set<number>>(new Set());
  const [hasShowComments, setHasShowComments] = useState(true);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const avatarBucketReady = useRef<boolean | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);

  async function ensureAvatarBucket() {
    if (avatarBucketReady.current === true) return true;
    try {
      const res = await fetch("/api/ensure-avatars-bucket", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = body?.error ? `: ${body.error}` : "";
        setMsg(`Erro a criar bucket${detail}`);
        avatarBucketReady.current = false;
        return false;
      }
      avatarBucketReady.current = true;
      return true;
    } catch (err: any) {
      setMsg(`Erro a criar bucket: ${err?.message ?? "falha de rede"}`);
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
        "id, username, bio, avatar_url, avatar_path, city, verification_status, show_followers, show_following, show_likes, show_comments, dm_privacy"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      const missingShowComments = String(error.message).includes("show_comments");
      const missingDmPrivacy = String(error.message).includes("dm_privacy");
      if (missingShowComments || missingDmPrivacy) {
        const { data: fallback, error: fbErr } = await supabase
          .from("profiles")
          .select("id, username, bio, avatar_url, avatar_path, city, verification_status, show_followers, show_following, show_likes")
          .eq("id", user.id)
          .maybeSingle();
        if (fbErr) {
          setMsg("Erro a carregar perfil: " + fbErr.message);
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
        await loadMedia(user.id);
        return;
      }
      setMsg("Erro a carregar perfil: " + error.message);
      return;
    }

    setProfile(data as ProfileRow);
    setUsername((data as any).username ?? "");
    setBio((data as any).bio ?? "");
    setAvatarPath((data as any).avatar_path ?? null);
    await resolveAvatarUrl((data as any).avatar_path, (data as any).avatar_url);
    setCity((data as any).city ?? "");
    setHasShowComments(true);
    await loadMedia(user.id);
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

      const status = (data?.verification_status as any) ?? "pending";
      const nextAdmin = !!data?.is_admin || isBootstrapAdmin(user.email);
      setVerificationCookies(status, true);
      setAdminCookie(nextAdmin);
      setIsAdminUser(nextAdmin);

      if (error || status !== "approved") {
        router.replace("/verify");
        return;
      }

      await load();
    })().catch((e) => setMsg(e.message));
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

    if (error) return setMsg("Erro a guardar: " + error.message);

    setMsg("Guardado ✅");
    load().catch(() => {});
  }

  async function loadMedia(userId: string) {
    const { data, error } = await supabase
      .from("profile_media")
      .select("id, media_type, storage_path, moderation_status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setMsg("Erro a carregar media: " + error.message);
      return;
    }

    const visible = (data ?? []).filter(
      (row: any) => row.moderation_status !== "explicit"
    );

    const withUrls = await Promise.all(
      visible.map(async (row: any) => {
        const { data: signed, error: sErr } = await supabase.storage
          .from("profile_media")
          .createSignedUrl(row.storage_path, 60 * 10);
        if (sErr) return { ...row, signed_url: null };
        return { ...row, signed_url: signed?.signedUrl ?? null };
      })
    );

    setMedia(withUrls as MediaItem[]);
  }


  async function onPickMedia(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    setMsg(null);
    setMediaLoading(true);

    try {
      const user = await requireUser();

      for (const file of selected) {
        const mediaType = file.type.startsWith("video/") ? "video" : "image";
        const path = `${user.id}/${Date.now()}_${file.name}`;

        const { error: upErr } = await supabase.storage
          .from("profile_media")
          .upload(path, file, { upsert: true });

        if (upErr) {
          setMsg("Erro upload media: " + upErr.message);
          continue;
        }

        const { data: inserted, error: insErr } = await supabase
          .from("profile_media")
          .insert({
            user_id: user.id,
            media_type: mediaType,
            storage_path: path,
            moderation_status: "pending",
          })
          .select("id")
          .maybeSingle();

        if (insErr) {
          setMsg("Erro guardar media: " + insErr.message);
        } else if (inserted?.id) {
          await supabase.functions.invoke("moderate-media", {
            body: { media_id: inserted.id },
          });
        }
      }

      await loadMedia(user.id);
    } finally {
      setMediaLoading(false);
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
      const ready = await ensureAvatarBucket();
      if (!ready) return;
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `user/${user.id}/avatar.${ext}`;
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
          setMsg("Erro upload avatar: " + upErr.message);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_path: path })
        .eq("id", user.id);

      if (error) {
        setMsg("Erro a guardar avatar: " + error.message);
        return;
      }

      setAvatarPath(path);
      await resolveAvatarUrl(path, null);
      setMsg("Foto de perfil atualizada ✅");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  async function toggle(
    field: "show_followers" | "show_following" | "show_likes" | "show_comments"
  ) {
    if (field === "show_comments" && !hasShowComments) {
      setMsg("A coluna show_comments ainda nao existe. Aplica a migracao para ativar.");
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
      setMsg("Erro: " + error.message);
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
      setMsg("Erro: " + error.message);
      setProfile({ ...profile, dm_privacy: prev });
    }
  }

  const displayName = profile?.username ?? "Sem username";
  const initials = (profile?.username ?? "?").slice(0, 1).toUpperCase();
  const isVerified = profile?.verification_status === "approved";

  return (
    <AppShell title="Eu">
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Link
            href="/invite"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
          >
            Convites
          </Link>
          <Link
            href="/premium"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
          >
            Premium
          </Link>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-left"
          >
            Settings
          </button>
          {isAdminUser ? (
            <Link
              href="/admin/metrics"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              Admin · Metricas
            </Link>
          ) : null}
        </div>

        <Card className="border-border bg-card/70">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Perfil</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="group h-20 w-20 overflow-hidden rounded-full border border-border bg-muted text-lg font-semibold"
                aria-label="Alterar foto de perfil"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">{initials}</span>
                )}
                <span className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs opacity-0 transition-opacity group-hover:opacity-100">
                  Alterar
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
              <div className="text-sm opacity-70">{profile?.city ?? "Sem cidade"}</div>
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={onPickAvatar}
            className="hidden"
          />

          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4">
              <Label>Sobre</Label>
              <textarea
                className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Escreve a tua bio (emojis ok ✨)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={saveProfile} disabled={loading}>
                  {loading ? "A guardar..." : "Guardar bio"}
                </Button>
              </div>
            </div>

          </div>

          <div className="grid gap-2">
            <Label>Relacoes</Label>
            <div className="text-sm opacity-70">Privado. Sem contagens publicas.</div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Fotos e videos</Label>
              <div>
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={onPickMedia}
                  className="hidden"
                />
                <Button type="button" variant="outline" onClick={() => mediaInputRef.current?.click()}>
                  Adicionar
                </Button>
              </div>
            </div>
            {mediaLoading ? <div className="text-sm opacity-70">A enviar...</div> : null}
            {media.length === 0 ? (
              <div className="text-sm opacity-70">Ainda sem media.</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {media.map((item) => {
                  const isSensitive =
                    item.moderation_status === "sensual" ||
                    item.moderation_status === "pending_manual" ||
                    item.moderation_status === "pending";
                  const isRevealed = revealedMedia.has(item.id);
                  const blurClass = isSensitive && !isRevealed ? "blur-md" : "";
                  return (
                    <div key={item.id} className="relative">
                      {item.media_type === "video" ? (
                        <video
                          src={item.signed_url ?? ""}
                          className={`h-36 w-full rounded-md object-cover ${blurClass}`}
                          controls
                        />
                      ) : (
                        <img
                          src={item.signed_url ?? ""}
                          alt="media"
                          className={`h-36 w-full rounded-md object-cover ${blurClass}`}
                        />
                      )}
                      {isSensitive && !isRevealed ? (
                        <button
                          className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white bg-black/40 rounded-md"
                          onClick={() =>
                            setRevealedMedia((prev) => new Set(prev).add(item.id))
                          }
                        >
                          Revelar
                        </button>
                      ) : null}
                    </div>
                  );
                })}
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
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label>Username</Label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ex: jorge"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Cidade</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="ex: Lisboa" />
                </div>

                <div className="grid gap-2 pt-2">
                  <Label>Private Space</Label>
                  <div className="text-sm opacity-70">Quem te pode contactar em privado.</div>
                  <div className="flex gap-2">
                    <Button
                      variant={profile?.dm_privacy === "all" ? "secondary" : "outline"}
                      onClick={() => updateDmPrivacy("all")}
                    >
                      Todos
                    </Button>
                    <Button
                      variant={profile?.dm_privacy === "matches" ? "secondary" : "outline"}
                      onClick={() => updateDmPrivacy("matches")}
                    >
                      Apenas matches
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 pt-2">
                  {hasShowComments ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Mostrar comentarios</div>
                        <div className="text-sm opacity-70">
                          Se desligar, ninguém vê comentarios nos teus posts.
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => toggle("show_comments")}>
                        {profile?.show_comments ? "ON" : "OFF"}
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveProfile} disabled={loading}>
                    {loading ? "A guardar..." : "Guardar"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => supabase.auth.signOut().then(() => (location.href = "/login"))}
                  >
                    Logout
                  </Button>
                  <Button variant="ghost" onClick={() => setSettingsOpen(false)}>
                    Fechar
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
