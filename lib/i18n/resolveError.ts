export function resolveI18nError(
  t: (key: string, vars?: Record<string, string>) => string,
  err: unknown,
  fallback: string
) {
  const msg =
    typeof (err as any)?.message === "string" ? String((err as any).message) : null;
  if (msg && msg.includes(".")) {
    const translated = t(msg);
    if (translated !== msg) return translated;
  }
  return msg ?? fallback;
}
