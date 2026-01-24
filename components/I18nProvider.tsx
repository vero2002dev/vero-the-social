"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DICTS, type Locale } from "@/lib/i18n/dictionaries";
import { supabase } from "@/lib/supabaseClient";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => Promise<void>;
  t: (key: string, vars?: Record<string, string>) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

function pickBrowserLocale(): Locale {
  const l =
    typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "pt-PT";
  if (l.startsWith("pt")) return "pt-PT";
  if (l.startsWith("es")) return "es";
  if (l.startsWith("fr")) return "fr";
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt-PT");

  useEffect(() => {
    (async () => {
      const ls =
        typeof window !== "undefined"
          ? (localStorage.getItem("vero_locale") as Locale | null)
          : null;
      if (ls) setLocaleState(ls);
      else setLocaleState(pickBrowserLocale());

      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) return;

        const { data } = await supabase
          .from("profiles")
          .select("locale")
          .eq("id", uid)
          .single();
        const profLoc = (data?.locale as Locale | undefined) || null;
        if (profLoc) {
          setLocaleState(profLoc);
          localStorage.setItem("vero_locale", profLoc);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  async function setLocale(l: Locale) {
    setLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem("vero_locale", l);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (uid) {
        await supabase.from("profiles").update({ locale: l }).eq("id", uid);
      }
    } catch {
      // ignore
    }
  }

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string>) => {
      const dict = DICTS[locale] || DICTS["pt-PT"];
      let s = dict[key] ?? DICTS.en[key] ?? key;

      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replaceAll(`{${k}}`, v);
        }
      }
      return s;
    };
  }, [locale]);

  const value: Ctx = { locale, setLocale, t };

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("I18nProvider missing");
  return ctx;
}
