"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { isBootstrapAdmin } from "@/lib/admin";
import { setAdminCookie, setVerificationCookies } from "@/lib/verificationCookies";

type Status = "pending" | "approved" | "rejected";

export default function VerifyPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("pending");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const idInputRef = useRef<HTMLInputElement | null>(null);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);

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
        .select("verification_status, id_doc_path, selfie_path, is_admin")
        .eq("id", user.id)
        .single();

      if (error) {
        setMsg("Erro: " + error.message);
        setVerificationCookies("pending", true);
        setAdminCookie(isBootstrapAdmin(user.email));
      } else {
        const nextStatus = (data?.verification_status as Status) ?? "pending";
        setStatus(nextStatus);
        setVerificationCookies(nextStatus, true);
        const nextAdmin = !!data?.is_admin || isBootstrapAdmin(user.email);
        setAdminCookie(nextAdmin);
        setSubmitted(!!data?.id_doc_path && !!data?.selfie_path);
      }

      setLoading(false);
    })();
  }, [router]);

  useEffect(() => {
    if (status === "approved") router.replace("/feed");
  }, [router, status]);

  async function upload() {
    setMsg(null);

    if (!idFile || !selfieFile) {
      setMsg("Escolhe os 2 ficheiros (ID + selfie).");
      return;
    }

    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setMsg("Sem sessão.");
      setLoading(false);
      return;
    }

    const idPath = `${user.id}/${Date.now()}_id_${idFile.name}`;
    const selfiePath = `${user.id}/${Date.now()}_selfie_${selfieFile.name}`;

    const up1 = await supabase.storage
      .from("verification_ids")
      .upload(idPath, idFile, { upsert: true });

    if (up1.error) {
      setMsg("Erro upload ID: " + up1.error.message);
      setLoading(false);
      return;
    }

    const up2 = await supabase.storage
      .from("verification_selfies")
      .upload(selfiePath, selfieFile, { upsert: true });

    if (up2.error) {
      setMsg("Erro upload selfie: " + up2.error.message);
      setLoading(false);
      return;
    }

    const { error: updErr } = await supabase
      .from("profiles")
      .update({
        id_doc_path: idPath,
        selfie_path: selfiePath,
        verification_status: "pending",
      })
      .eq("id", user.id);

    if (updErr) setMsg("Erro atualizar perfil: " + updErr.message);
    else {
      setMsg("Enviado ✅ Agora aguardas aprovação.");
      setStatus("pending");
      setVerificationCookies("pending", true);
      setSubmitted(true);
    }

    setLoading(false);
  }

  if (loading) return <main style={{ padding: 24 }}>A carregar...</main>;

  if (status === "approved") return <main style={{ padding: 24 }}>A redirecionar...</main>;

  const statusLabel = status === "pending" ? "pending verification" : status;

  return (
    <main style={{ padding: 24, maxWidth: 520 }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Verificação</h1>
      <p>Status atual: <b>{statusLabel}</b></p>

      {status === "pending" && submitted ? (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: "1px solid #e5e7eb" }}>
          <p style={{ fontWeight: 600 }}>Pending approval</p>
          <p style={{ marginTop: 8 }}>
            Recebemos os teus documentos. Vamos analisar e avisar quando estiver aprovado.
          </p>
        </div>
      ) : (
        <>
          <p style={{ marginTop: 12 }}>
            Envia um documento de identificação + uma selfie. (V1 manual)
          </p>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <label>
              Documento (ID):
              <input
                ref={idInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setIdFile(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
              <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
                <button type="button" onClick={() => idInputRef.current?.click()}>
                  Escolher ficheiro
                </button>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  {idFile ? idFile.name : "Nenhum ficheiro"}
                </span>
              </div>
            </label>

            <label>
              Selfie:
              <input
                ref={selfieInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
              <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
                <button type="button" onClick={() => selfieInputRef.current?.click()}>
                  Escolher ficheiro
                </button>
                <span style={{ fontSize: 12, opacity: 0.7 }}>
                  {selfieFile ? selfieFile.name : "Nenhum ficheiro"}
                </span>
              </div>
            </label>

            <button onClick={upload} style={{ padding: 10, borderRadius: 10 }}>
              Enviar para verificação
            </button>
          </div>
        </>
      )}

      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </main>
  );
}
