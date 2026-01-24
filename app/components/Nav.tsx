"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useI18n } from "@/components/I18nProvider";
import { isBootstrapAdmin } from "@/lib/admin";
import { setAdminCookie, setUnlockedCookie, setVerificationCookies } from "@/lib/verificationCookies";

export default function Nav() {
  const [isAuthed, setIsAuthed] = useState(false);
  const { t } = useI18n();
  const [isAdmin, setIsAdmin] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "unverified" | "pending" | "verified" | "failed"
  >("loading");

  useEffect(() => {
    async function loadStatus() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setIsAuthed(!!user);

      if (!user) {
        setVerificationStatus("unverified");
        setVerificationCookies(null, false);
        setUnlockedCookie(false);
        setIsAdmin(false);
        setAdminCookie(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("verification_status, is_admin, unlocked")
        .eq("id", user.id)
        .maybeSingle();

      const nextStatus = (profile?.verification_status as any) ?? "unverified";
      let nextAdmin = !!profile?.is_admin || isBootstrapAdmin(user.email);
      if (!nextAdmin) {
        const { data: adminCheck } = await supabase.rpc("rpc_is_admin");
        nextAdmin = !!adminCheck;
      }
      setVerificationStatus(nextStatus);
      setIsAdmin(nextAdmin);
      setVerificationCookies(nextStatus, true);
      setAdminCookie(nextAdmin);
      setUnlockedCookie(!!profile?.unlocked);
    }

    loadStatus().catch(() => {});

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
      if (!session) {
        setVerificationStatus("unverified");
        setVerificationCookies(null, false);
        setUnlockedCookie(false);
        setIsAdmin(false);
        setAdminCookie(false);
      }
      else loadStatus().catch(() => {});
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <nav className="flex gap-4 text-sm">
      <Link className="hover:underline" href="/">
        {t("nav.home")}
      </Link>
      {!isAuthed ? (
        <Link className="hover:underline" href="/login">
          {t("nav.login")}
        </Link>
      ) : (
        <>
          <Link className="hover:underline" href="/intent">
            {t("nav.intent")}
          </Link>
          <Link className="hover:underline" href="/discover">
            {t("nav.discover")}
          </Link>
          <Link className="hover:underline" href="/dm">
            {t("nav.private")}
          </Link>
          <Link className="hover:underline" href="/inbox">
            {t("nav.inbox")}
          </Link>
          <Link className="hover:underline" href="/chats">
            {t("nav.chats")}
          </Link>
          <Link className="hover:underline" href="/invite">
            {t("nav.invite")}
          </Link>
          <Link className="hover:underline" href="/premium">
            {t("nav.premium")}
          </Link>
          <Link className="hover:underline" href="/profile">
            {t("nav.profile")}
          </Link>
          {isAdmin ? (
            <>
              <Link className="hover:underline" href="/admin">
                Admin
              </Link>
              <Link className="hover:underline" href="/admin/metrics">
                Metrics
              </Link>
            </>
          ) : null}
        </>
      )}
    </nav>
  );
}
