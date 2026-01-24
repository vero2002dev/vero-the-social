import { Suspense } from "react";
import SignupClient from "./signup-client";
import SignupFallback from "./signup-fallback";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense
      fallback={<SignupFallback />}
    >
      <SignupClient />
    </Suspense>
  );
}
