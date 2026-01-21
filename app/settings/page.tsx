"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { requireUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type ProfileRow = {
  dm_privacy: "all" | "matches";
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setMsg(null);
    const user = await requireUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("dm_privacy")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      if (String(error.message).includes("dm_privacy")) {
        setProfile({ dm_privacy: "matches" });
        return;
      }
      setMsg("Erro a carregar settings: " + error.message);
      return;
    }

    setProfile((data as ProfileRow) ?? { dm_privacy: "matches" });
  }

  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, []);

  async function updateDmPrivacy(next: "all" | "matches") {
    if (!profile) return;
    if (profile.dm_privacy === next) return;
    const prev = profile.dm_privacy;
    setProfile({ ...profile, dm_privacy: next });
    setLoading(true);
    try {
      const user = await requireUser();
      const { error } = await supabase
        .from("profiles")
        .update({ dm_privacy: next })
        .eq("id", user.id);
      if (error) {
        setMsg("Erro: " + error.message);
        setProfile({ ...profile, dm_privacy: prev });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid gap-6 max-w-3xl">
      <Card className="border-border bg-card/70">
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>DMs</Label>
            <div className="text-sm opacity-70">Quem te pode enviar DM.</div>
            <div className="flex gap-2">
              <Button
                variant={profile?.dm_privacy === "all" ? "secondary" : "outline"}
                onClick={() => updateDmPrivacy("all")}
                disabled={loading}
              >
                Todos
              </Button>
              <Button
                variant={profile?.dm_privacy === "matches" ? "secondary" : "outline"}
                onClick={() => updateDmPrivacy("matches")}
                disabled={loading}
              >
                Apenas matches
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/profile" className="text-sm underline">
              Ir para Perfil
            </Link>
          </div>
        </CardContent>
      </Card>

      {msg && <div className="text-sm">{msg}</div>}
    </main>
  );
}
