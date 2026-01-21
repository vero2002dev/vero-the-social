const ADMIN_EMAILS = ["jorge.pinto.correia1@gmail.com"];

export function isBootstrapAdmin(email?: string | null) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
