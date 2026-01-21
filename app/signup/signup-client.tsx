"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupClient() {
  const router = useRouter();
  const [token, setToken] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  async function onSignup(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!token) {
      setMsg("Convite invalido. Abre o link do email novamente.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      return setMsg("Erro: " + error.message);
    }

    const res = await fetch("/api/ensure-avatars-bucket/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setLoading(false);
      return setMsg(body?.error ?? "Erro ao validar convite.");
    }

    setLoading(false);
    setMsg("Conta criada. Verifica o email para confirmar.");
    router.push("/login");
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="brand-card">
          <span className="brand-pill">VERO</span>
          <h1>Cria a tua conta.</h1>
          <p className="lead">
            Entra com convite e completa o registo para comecar a usar o VERO.
          </p>
          <div className="brand-grid">
            <div>
              <p className="label">Convites</p>
              <p className="detail">Acesso controlado para manter qualidade.</p>
            </div>
            <div>
              <p className="label">Seguranca</p>
              <p className="detail">Confirmacao de email obrigatoria.</p>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="card-header">
            <h2>Signup</h2>
            <p className="muted">Cria a conta para continuar.</p>
          </div>

          <form onSubmit={onSignup} className="form">
            <label className="field">
              <span>Email</span>
              <input
                placeholder="tu@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                placeholder="Cria uma password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </label>

            <button type="submit" disabled={loading} className="primary">
              {loading ? "A criar..." : "Criar conta"}
            </button>
          </form>

          {msg && (
            <div className="message" role="status" aria-live="polite">
              {msg}
            </div>
          )}

          <p className="footer">
            Ja tens conta? <a href="/login">Entrar</a>
          </p>
        </section>
      </div>

      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Space+Grotesk:wght@400;500;600&display=swap");

        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 20px;
          background: radial-gradient(
              circle at top,
              rgba(255, 213, 161, 0.5),
              transparent 45%
            ),
            radial-gradient(circle at 80% 20%, rgba(89, 120, 255, 0.2), transparent 45%),
            #f7f4ef;
          color: #141414;
          font-family: "Space Grotesk", sans-serif;
        }

        .auth-shell {
          width: min(980px, 100%);
          display: grid;
          gap: 24px;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        }

        .brand-card {
          background: #101318;
          color: #f7f4ef;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 24px 60px rgba(15, 19, 24, 0.35);
          display: grid;
          gap: 16px;
          position: relative;
          overflow: hidden;
        }

        .brand-card::after {
          content: "";
          position: absolute;
          inset: -40% 20% auto -20%;
          height: 220px;
          background: radial-gradient(
            circle,
            rgba(255, 214, 158, 0.55),
            transparent 70%
          );
          opacity: 0.9;
        }

        .brand-pill {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
        }

        .brand-card h1 {
          font-family: "Fraunces", serif;
          font-size: clamp(28px, 3vw, 40px);
          margin: 0;
          z-index: 1;
        }

        .lead {
          margin: 0;
          font-size: 15px;
          max-width: 320px;
          z-index: 1;
        }

        .brand-grid {
          display: grid;
          gap: 12px;
          z-index: 1;
        }

        .label {
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.2em;
          opacity: 0.7;
          margin: 0 0 6px;
        }

        .detail {
          margin: 0;
          font-size: 14px;
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.9);
          border-radius: 24px;
          padding: 32px;
          border: 1px solid rgba(15, 19, 24, 0.08);
          box-shadow: 0 20px 50px rgba(15, 19, 24, 0.1);
          display: grid;
          gap: 20px;
          animation: lift 0.6s ease;
        }

        .card-header h2 {
          margin: 0 0 6px;
          font-size: 24px;
        }

        .muted {
          margin: 0;
          color: #5a5a5a;
          font-size: 14px;
        }

        .form {
          display: grid;
          gap: 14px;
        }

        .field {
          display: grid;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
        }

        .field input {
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid rgba(20, 20, 20, 0.15);
          background: #fff;
          font-size: 15px;
          transition: border 0.2s ease, box-shadow 0.2s ease;
        }

        .field input:focus {
          outline: none;
          border-color: #101318;
          box-shadow: 0 0 0 3px rgba(16, 19, 24, 0.15);
        }

        .primary {
          margin-top: 4px;
          padding: 12px 18px;
          border-radius: 14px;
          border: none;
          color: #fff;
          font-weight: 600;
          background: linear-gradient(130deg, #111318, #3b3f49);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .primary:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(15, 19, 24, 0.2);
        }

        .message {
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(255, 214, 158, 0.35);
          border: 1px solid rgba(255, 214, 158, 0.8);
          font-size: 14px;
        }

        .footer {
          margin: 0;
          font-size: 14px;
        }

        .footer a {
          color: #101318;
          font-weight: 600;
          text-decoration: none;
        }

        .footer a:hover {
          text-decoration: underline;
        }

        @keyframes lift {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 640px) {
          .auth-page {
            padding: 32px 16px;
          }

          .brand-card {
            order: 2;
          }
        }
      `}</style>
    </main>
  );
}
