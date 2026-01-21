import { Suspense } from "react";
import SignupClient from "./signup-client";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense
      fallback={<main className="auth-page"><div className="auth-shell">A carregar...</div></main>}
    >
      <SignupClient />
    </Suspense>
  );
}
