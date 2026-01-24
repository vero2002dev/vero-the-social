"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { resolveI18nError } from "@/lib/i18n/resolveError";
import { useI18n } from "@/components/I18nProvider";
import { requireUser } from "@/lib/auth";
import { isBootstrapAdmin } from "@/lib/admin";
import { setAdminCookie, setVerificationCookies } from "@/lib/verificationCookies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FeedPost = {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { username: string | null } | null;
  like_count?: number;
  i_liked?: boolean;
};

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();
  const [mediaOpen, setMediaOpen] = useState(false);
  const mediaMenuRef = useRef<HTMLDivElement | null>(null);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles(selected);

    const urls = selected.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  async function load() {
    setMsg(null);
    let user;
    try {
      user = await requireUser();
    } catch (e: any) {
      setMsg(resolveI18nError(t, e, t("common.session_invalid")));
      return;
    }

    // Buscar posts
    const { data: rawPosts, error } = await supabase
      .from("posts")
      .select("id, user_id, content, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return setMsg(t("feed.error.load", { msg: error.message }));

    const postIds = (rawPosts ?? []).map((p) => p.id);

    // Buscar perfis dos autores (username)
    const userIds = Array.from(new Set((rawPosts ?? []).map((p) => p.user_id)));
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);

    if (pErr) return setMsg(t("feed.error.profiles", { msg: pErr.message }));

    // Buscar likes (contagem) e se eu dei like
    const { data: likes, error: lErr } = await supabase
      .from("likes")
      .select("post_id, liker_id")
      .in("post_id", postIds)
      .is("liked_id", null);

    if (lErr) return setMsg(t("feed.error.likes", { msg: lErr.message }));

    const profileMap = new Map<string, any>();
    (profiles ?? []).forEach((pr) => profileMap.set(pr.id, pr));

    const likeCount = new Map<number, number>();
    (likes ?? []).forEach((lk) => {
      likeCount.set(lk.post_id, (likeCount.get(lk.post_id) ?? 0) + 1);
    });

    const iLikedSet = new Set<number>();
    (likes ?? []).forEach((lk) => {
      if (lk.liker_id === user.id) iLikedSet.add(lk.post_id);
    });

    const merged: FeedPost[] = (rawPosts ?? []).map((p: any) => {
      const pr = profileMap.get(p.user_id) ?? null;
      return {
        ...p,
        profiles: pr,
        like_count: likeCount.get(p.id) ?? 0,
        i_liked: iLikedSet.has(p.id),
      };
    });

    setPosts(merged);
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
      setVerificationCookies(status, true);
      setAdminCookie(!!data?.is_admin || isBootstrapAdmin(user.email));

      if (error || status !== "verified") {
        router.replace("/verify");
        return;
      }

      await load();
    })().catch((e) => setMsg(e.message));
  }, [router]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!mediaOpen) return;
      const target = e.target as Node | null;
      if (mediaMenuRef.current && target && !mediaMenuRef.current.contains(target)) {
        setMediaOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [mediaOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!mediaOpen) return;
      if (e.key === "Escape") setMediaOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mediaOpen]);

  async function createPost() {
    setMsg(null);
    setLoading(true);

    try {
      const user = await requireUser();
      const content = text.trim();
      if (!content) {
        setLoading(false);
        return setMsg(t("feed.error.empty"));
      }

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content,
      });

      if (error) throw error;

      setText("");
      await load();
    } catch (e: any) {
      setMsg(resolveI18nError(t, e, t("feed.error.create")));
    } finally {
      setLoading(false);
    }
  }

  async function toggleLike(post: FeedPost) {
    setMsg(null);
    let user;
    try {
      user = await requireUser();
    } catch (e: any) {
      setMsg(resolveI18nError(t, e, t("common.session_invalid")));
      return;
    }

    if (post.i_liked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("liker_id", user.id);
      if (error) return setMsg(resolveI18nError(t, error, t("feed.error.unlike", { msg: error.message })));
    } else {
      const { error } = await supabase.from("likes").insert({
        post_id: post.id,
        liker_id: user.id,
      });
      if (error) return setMsg(resolveI18nError(t, error, t("feed.error.like", { msg: error.message })));
    }

    await load();
  }

  return (
    <div className="grid gap-6 max-w-3xl">
      <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("feed.kicker")}</div>
            <div className="text-2xl font-semibold">{t("feed.title")}</div>
          </div>
          <div className="text-xs text-muted-foreground">VERO</div>
        </div>
        <div className="mt-4 grid gap-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("feed.placeholder")}
            className="h-11"
          />
          <div className="flex items-center gap-2">
            <Button onClick={createPost} disabled={loading} className="min-w-28">
              {loading ? t("feed.publishing") : t("feed.publish")}
            </Button>
            <div className="relative" ref={mediaMenuRef}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMediaOpen((open) => !open)}
              >
                +
              </Button>
              {mediaOpen && (
                <div className="absolute right-0 z-10 mt-2 w-48 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                  <label className="block">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        onPickFiles(e);
                        setMediaOpen(false);
                      }}
                      className="hidden"
                    />
                    <Button type="button" variant="ghost" className="w-full justify-start">
                      {t("feed.upload_photo")}
                    </Button>
                  </label>
                  <label className="block">
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      onChange={(e) => {
                        onPickFiles(e);
                        setMediaOpen(false);
                      }}
                      className="hidden"
                    />
                    <Button type="button" variant="ghost" className="w-full justify-start">
                      {t("feed.upload_video")}
                    </Button>
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setMediaOpen(false)}
                  >
                    {t("feed.close")}
                  </Button>
                </div>
              )}
            </div>
            <div className="ml-auto text-xs text-muted-foreground">{t("feed.cta_hint")}</div>
          </div>
        </div>
      </div>

      {previews.length > 0 && (
        <div className="grid gap-2 rounded-2xl border border-border bg-card/60 p-4">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("feed.previews")}</div>
          <div className="flex flex-wrap gap-3">
            {previews.map((url, idx) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt={t("feed.preview_alt")}
                  className="h-28 w-28 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {msg && <div className="text-sm text-muted-foreground">{msg}</div>}

      <div className="grid gap-4">
        {posts.map((p) => {
          const username = p.profiles?.username ?? "user";
          return (
            <Card key={p.id} className="border-border bg-card/70">
              <CardContent className="py-5 grid gap-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>@{username}</span>
                  <span>{new Date(p.created_at).toLocaleString()}</span>
                </div>

                <div className="text-base leading-relaxed">{p.content}</div>

                <div className="flex items-center gap-3 pt-2">
                  <Button variant={p.i_liked ? "default" : "outline"} onClick={() => toggleLike(p)}>
                    {p.i_liked ? t("feed.revealed") : t("feed.reveal")}
                  </Button>
                  <div className="text-sm text-muted-foreground">{t("feed.reveals_private")}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
