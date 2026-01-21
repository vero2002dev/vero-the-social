import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const { token, email } = await req.json().catch(() => ({}));

  if (!token || !email) {
    return NextResponse.json({ ok: false, error: "missing token/email" }, { status: 400 });
  }

  const sb = supabaseAdmin();

  // 1) validar token
  const { data, error } = await sb
    .from("waitlist")
    .select("id,status")
    .eq("invite_token", token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ ok: false, error: "invalid token" }, { status: 401 });
  }

  // 2) marcar como registered (não criamos user aqui; isso é feito pelo Auth)
  const { error: updErr } = await sb
    .from("waitlist")
    .update({
      status: "registered",
      registered_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (updErr) {
    return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
