"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { isBootstrapAdmin } from "@/lib/admin";
import { setAdminCookie, setUnlockedCookie, setVerificationCookies } from "@/lib/verificationCookies";

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

      const nextStatus = (profile?.verification_status as any) ?? "pending";
      const nextAdmin = !!profile?.is_admin || isBootstrapAdmin(user.email);
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
        setVerificationStatus("pending");
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
        Home
      </Link>
      {!isAuthed ? (
        <Link className="hover:underline" href="/login">
          Login
        </Link>
      ) : (
        <>
          <Link className="hover:underline" href="/intent">
            Intent
          </Link>
          <Link className="hover:underline" href="/discover">
            Discover
          </Link>
          <Link className="hover:underline" href="/dm">
            Private
          </Link>
          <Link className="hover:underline" href="/inbox">
            Inbox
          </Link>
          <Link className="hover:underline" href="/chats">
            Chats
          </Link>
          <Link className="hover:underline" href="/invite">
            Invite
          </Link>
          <Link className="hover:underline" href="/premium">
            Premium
          </Link>
          <Link className="hover:underline" href="/profile">
            Profile
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
