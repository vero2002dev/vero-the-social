"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isBootstrapAdmin } from "@/lib/admin";
import { setAdminCookie, setVerificationCookies } from "@/lib/verificationCookies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AdminProfile = {
  id: string;
  username: string | null;
  city: string | null;
  verification_status: "pending" | "approved" | "rejected" | null;
  id_doc_path: string | null;
  selfie_path: string | null;
  is_admin: boolean | null;
  verified_at?: string | null;
};

export default function AdminPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [previews, setPreviews] = useState<Record<string, { idUrl?: string; selfieUrl?: string }>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setVerificationCookies(null, false);
      setAdminCookie(false);
      router.replace("/login");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("verification_status, is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      setMsg("Erro: " + error.message);
      return;
    }

    const isAdmin = !!profile?.is_admin || isBootstrapAdmin(user.email);
    setAdminCookie(isAdmin);
    setVerificationCookies((profile?.verification_status as any) ?? "pending", true);

    if (!isAdmin) {
      router.replace("/feed");
      return;
    }

    const { data: pending, error: listErr } = await supabase
      .from("profiles")
      .select("id, username, city, verification_status, id_doc_path, selfie_path, is_admin, verified_at")
      .neq("verification_status", "approved");

    if (listErr) {
      setMsg("Erro ao carregar pedidos: " + listErr.message);
      return;
    }

    setProfiles((pending as AdminProfile[]) ?? []);
  }

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e) => setMsg(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(userId: string, status: "approved" | "rejected") {
    setMsg(null);

    const payload: Record<string, any> = {
      verification_status: status,
    };
    if (status === "approved") payload.verified_at = new Date().toISOString();

    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    if (error) {
      setMsg("Erro a atualizar: " + error.message);
      return;
    }

    await load();
  }

  async function loadPreviews(profile: AdminProfile) {
    setMsg(null);
    const next: { idUrl?: string; selfieUrl?: string } = {};

    if (profile.id_doc_path) {
      const { data, error } = await supabase.storage
        .from("verification_ids")
        .createSignedUrl(profile.id_doc_path, 60 * 10);
      if (error) {
        setMsg("Erro a gerar link ID: " + error.message);
      } else {
        next.idUrl = data?.signedUrl;
      }
    }

    if (profile.selfie_path) {
      const { data, error } = await supabase.storage
        .from("verification_selfies")
        .createSignedUrl(profile.selfie_path, 60 * 10);
      if (error) {
        setMsg("Erro a gerar link selfie: " + error.message);
      } else {
        next.selfieUrl = data?.signedUrl;
      }
    }

    setPreviews((prev) => ({ ...prev, [profile.id]: next }));
  }

  if (loading) return <main style={{ padding: 24 }}>A carregar...</main>;

  return (
    <main style={{ padding: 24 }}>
      <Card>
        <CardHeader>
          <CardTitle>Admin · Verificacoes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {profiles.length === 0 ? (
            <div className="text-sm opacity-70">Sem pedidos pendentes.</div>
          ) : (
            profiles.map((p) => (
              <div key={p.id} className="rounded-md border border-border p-3 grid gap-2">
                <div className="font-medium">@{p.username ?? "sem username"}</div>
                <div className="text-sm opacity-70">{p.city ?? "Sem cidade"}</div>
                <div className="text-xs opacity-60">Status: {p.verification_status ?? "pending"}</div>
                <div className="text-xs">
                  <div>ID: {p.id_doc_path ?? "sem ficheiro"}</div>
                  <div>Selfie: {p.selfie_path ?? "sem ficheiro"}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => loadPreviews(p)}>
                    Gerar links
                  </Button>
                  {previews[p.id]?.idUrl ? (
                    <a className="text-sm underline" href={previews[p.id]?.idUrl} target="_blank">
                      Ver ID
                    </a>
                  ) : null}
                  {previews[p.id]?.selfieUrl ? (
                    <a className="text-sm underline" href={previews[p.id]?.selfieUrl} target="_blank">
                      Ver selfie
                    </a>
                  ) : null}
                </div>
                {(previews[p.id]?.idUrl || previews[p.id]?.selfieUrl) && (
                  <div className="grid gap-2 pt-2">
                    {previews[p.id]?.idUrl ? (
                      <img
                        src={previews[p.id]?.idUrl}
                        alt="ID"
                        className="h-40 w-full rounded-md object-cover"
                      />
                    ) : null}
                    {previews[p.id]?.selfieUrl ? (
                      <img
                        src={previews[p.id]?.selfieUrl}
                        alt="Selfie"
                        className="h-40 w-full rounded-md object-cover"
                      />
                    ) : null}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={() => updateStatus(p.id, "approved")}>Aprovar</Button>
                  <Button variant="secondary" onClick={() => updateStatus(p.id, "rejected")}>
                    Rejeitar
                  </Button>
                </div>
              </div>
            ))
          )}

          {msg && <div className="text-sm">{msg}</div>}
        </CardContent>
      </Card>
    </main>
  );
}
