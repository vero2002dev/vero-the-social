"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") === "signup") {
      setMsg(t("auth.signup.created_check_email_detail"));
    }
  }, [t]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) return setMsg(`${t("common.error_prefix")}${error.message}`);

    try {
      await supabase.rpc("rpc_accept_legal", {
        p_locale: navigator.language,
        p_ip: null,
        p_user_agent: navigator.userAgent,
      });
    } catch (e: any) {
      return setMsg(e?.message ?? t("legal.accept.error_terms"));
    }

    router.push("/");
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="brand-card">
          <span className="brand-pill">VERO</span>
          <h1>{t("auth.login.welcome")}</h1>
          <p className="lead">
            {t("auth.login.lead")}
          </p>
          <div className="brand-grid">
            <div>
              <p className="label">{t("auth.login.secure_title")}</p>
              <p className="detail">{t("auth.login.secure_detail")}</p>
            </div>
            <div>
              <p className="label">{t("auth.login.real_title")}</p>
              <p className="detail">{t("auth.login.real_detail")}</p>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="card-header">
            <h2>{t("auth.login")}</h2>
            <p className="muted">{t("auth.login.subtitle")}</p>
          </div>

          <form onSubmit={onLogin} className="form">
            <label className="field">
              <span>{t("auth.email")}</span>
              <input
                placeholder={t("auth.email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </label>
            <label className="field">
              <span>{t("auth.password")}</span>
              <input
                placeholder={t("auth.password_placeholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </label>

            <button type="submit" disabled={loading} className="primary">
              {loading ? t("common.logging_in") : t("auth.login.cta")}
            </button>
          </form>

          {msg && (
            <div className="message" role="status" aria-live="polite">
              {msg}
            </div>
          )}

          <p className="footer">
            {t("auth.login.no_account")}{" "}
            <a href="/signup">{t("auth.login.signup_link")}</a>
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
