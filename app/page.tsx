"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { isBootstrapAdmin } from "@/lib/admin";
import { setAdminCookie, setVerificationCookies } from "@/lib/verificationCookies";

type Status = "pending" | "approved" | "rejected";

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | "loading">("loading");
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setIsAuthed(false);
        setVerificationCookies(null, false);
        setAdminCookie(false);
        return setStatus("pending");
      }
      setIsAuthed(true);

      await supabase
        .from("profiles")
        .upsert({ id: user.id }, { onConflict: "id" });

      const { data, error } = await supabase
        .from("profiles")
        .select("verification_status, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setStatus("pending");
        setVerificationCookies("pending", true);
        setAdminCookie(isBootstrapAdmin(user.email));
        return;
      }

      if (!data?.verification_status) {
        await supabase
          .from("profiles")
          .update({ verification_status: "pending" })
          .eq("id", user.id);
        setStatus("pending");
        setVerificationCookies("pending", true);
        setAdminCookie(!!data?.is_admin || isBootstrapAdmin(user.email));
        return;
      }

      const nextStatus = (data?.verification_status as Status) ?? "pending";
      setStatus(nextStatus);
      setVerificationCookies(nextStatus, true);
      const nextAdmin = !!data?.is_admin || isBootstrapAdmin(user.email);
      setAdminCookie(nextAdmin);
      setIsAdmin(nextAdmin);
    })();
  }, []);

  if (status === "loading") {
    return <main className="p-6 text-sm text-muted-foreground">A carregar...</main>;
  }

  if (status === "approved") {
    return (
      <main className="grid gap-6">
        <div className="rounded-3xl border border-border bg-card/70 p-6">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Inicio</div>
          <h1 className="mt-2 text-3xl font-semibold">Home</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Acesso rapido a todas as tabs.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/feed"
            className="rounded-2xl border border-border bg-card/70 p-5 transition hover:bg-card"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Social</div>
            <div className="mt-2 text-lg font-semibold">Feed</div>
          </Link>
          <Link
            href="/dating/discover"
            className="rounded-2xl border border-border bg-card/70 p-5 transition hover:bg-card"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dating</div>
            <div className="mt-2 text-lg font-semibold">Discover</div>
          </Link>
          <Link
            href="/dating/matches"
            className="rounded-2xl border border-border bg-card/70 p-5 transition hover:bg-card"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Dating</div>
            <div className="mt-2 text-lg font-semibold">Matches</div>
          </Link>
          <Link
            href="/dm"
            className="rounded-2xl border border-border bg-card/70 p-5 transition hover:bg-card"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Mensagens</div>
            <div className="mt-2 text-lg font-semibold">DM</div>
          </Link>
          <Link
            href="/profile"
            className="rounded-2xl border border-border bg-card/70 p-5 transition hover:bg-card"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Conta</div>
            <div className="mt-2 text-lg font-semibold">Perfil</div>
          </Link>
          <Link
            href="/settings"
            className="rounded-2xl border border-border bg-card/70 p-5 transition hover:bg-card"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Conta</div>
            <div className="mt-2 text-lg font-semibold">Settings</div>
          </Link>
          <Link
            href="/promocoes"
            className="rounded-2xl border border-border bg-card/70 p-5 transition hover:bg-card"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Promocoes</div>
            <div className="mt-2 text-lg font-semibold">Promo</div>
          </Link>
          <Link
            href="/subscricao"
            className="rounded-2xl border border-border bg-card/70 p-5 transition hover:bg-card"
          >
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Subscricao</div>
            <div className="mt-2 text-lg font-semibold">Boosts</div>
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              className="rounded-2xl border border-border bg-card/70 p-5 transition hover:bg-card"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin</div>
              <div className="mt-2 text-lg font-semibold">Painel</div>
            </Link>
          ) : null}
        </div>
      </main>
    );
  }

  const statusLabel = status === "pending" ? "pending verification" : status;

  return (
    <main className="grid gap-6">
      <div className="rounded-3xl border border-border bg-card/70 p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">VERO</div>
        <h1 className="mt-2 text-3xl font-semibold">Verificacao</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Estado: <span className="font-medium text-foreground">{statusLabel}</span>
        </p>

        {isAuthed ? (
          <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <p>Para usar o VERO precisas de verificação.</p>
            <p>Enquanto aguardas, o acesso é limitado.</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Faz login para iniciar a verificação.
          </p>
        )}
      </div>
    </main>
  );
}
