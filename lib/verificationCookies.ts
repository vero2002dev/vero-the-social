export type VerificationStatus = "pending" | "approved" | "rejected";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function setVerificationCookies(status: VerificationStatus | null, authed: boolean) {
  if (typeof document === "undefined") return;

  if (!authed) {
    document.cookie = "vero_authed=; Max-Age=0; path=/";
    document.cookie = "vero_verification=; Max-Age=0; path=/";
    document.cookie = "vero_admin=; Max-Age=0; path=/";
    return;
  }

  document.cookie = `vero_authed=1; Max-Age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
  if (status) {
    document.cookie = `vero_verification=${status}; Max-Age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
  }
}

export function setAdminCookie(isAdmin: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = `vero_admin=${isAdmin ? "1" : "0"}; Max-Age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}
