"use client";

import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const params = useSearchParams();

  const token = useMemo(() => params.get("token") || "", [params]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!token) {
      setMsg("Convite inválido. Abre o link do email novamente.");
      return;
    }

    setLoading(true);

    // 1) Criar conta no Supabase Auth
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      return setMsg("Erro: " + error.message);
    }

    // 2) Marcar waitlist como registered
    const res = aw
