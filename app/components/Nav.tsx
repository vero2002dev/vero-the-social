"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { isBootstrapAdmin } from "@/lib/admin";
import { setAdminCookie, setVerificationCookies } from "@/lib/verificationCookies";

export default function Nav() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "approved" | "pending" | "rejected">(
    "loading"
  );

  useEffect(() => {
    async function loadStatus() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      setIsAuthed(!!user);

      if (!user) {
        setVerificationStatus("pending");
        setVerificationCookies(null, false);
        setIsAdmin(false);
        setAdminCookie(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("verification_status, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      const nextStatus = (profile?.verification_status as any) ?? "pending";
      const nextAdmin = !!profile?.is_admin || isBootstrapAdmin(user.email);
      setVerificationStatus(nextStatus);
      setIsAdmin(nextAdmin);
      setVerificationCookies(nextStatus, true);
      setAdminCookie(nextAdmin);
    }

    loadStatus().catch(() => {});

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session);
      if (!session) {
        setVerificationStatus("pending");
        setVerificationCookies(null, false);
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
        Home
      </Link>
      <Link className="hover:underline" href="/feed">
        Feed
      </Link>
      {isAuthed ? (
        <Link className="hover:underline" href="/dating/discover">
          Dating
        </Link>
      ) : null}
      {!isAuthed ? (
        <Link className="hover:underline" href="/login">
          Login
        </Link>
      ) : (
        <>
          <Link className="hover:underline" href="/profile">
            Perfil
          </Link>
          <Link className="hover:underline" href="/dm">
            DM
          </Link>
          <Link className="hover:underline" href="/promocoes">
            Promocoes
          </Link>
          <Link className="hover:underline" href="/subscricao">
            Boosts
          </Link>
          {isAdmin ? (
            <Link className="hover:underline" href="/admin">
              Admin
            </Link>
          ) : null}
        </>
      )}
    </nav>
  );
}
