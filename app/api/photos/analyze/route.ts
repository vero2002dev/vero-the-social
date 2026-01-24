import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeDHash } from "@/lib/photos/hash";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceRole) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, serviceRole);
    const { photo_id } = await req.json().catch(() => ({}));

    if (!photo_id) {
      return NextResponse.json({ error: "Missing photo_id" }, { status: 400 });
    }

    const { data: photo, error: pe } = await admin
      .from("profile_photos")
      .select("id,user_id,kind,storage_path,meta,status")
      .eq("id", photo_id)
      .single();

    if (pe || !photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    if (photo.status === "deleted") {
      return NextResponse.json({ ok: true });
    }

    const bucket = (photo.meta as any)?.bucket ?? "private_media";
    const { data: blob, error: de } = await admin.storage
      .from(bucket)
      .download(photo.storage_path);

    if (de || !blob) {
      return NextResponse.json({ error: "Download failed" }, { status: 500 });
    }

    const buf = Buffer.from(await blob.arrayBuffer());
    const dhash = await computeDHash(buf);

    let risk = 0;
    const source = (photo.meta as any)?.source;
    if (source && source !== "camera") risk += 25;

    const { data: dup } = await admin
      .from("profile_photos")
      .select("id,user_id")
      .eq("dhash", dhash)
      .neq("user_id", photo.user_id)
      .limit(1);

    if (dup && dup.length > 0) risk += 80;

    const { data: prof } = await admin
      .from("profiles")
      .select("baseline_photo_id")
      .eq("id", photo.user_id)
      .single();

    if (prof?.baseline_photo_id) {
      const { data: base } = await admin
        .from("profile_photos")
        .select("dhash")
        .eq("id", prof.baseline_photo_id)
        .single();

      if (base?.dhash) {
        const dist = hamming(base.dhash, dhash);
        if (dist > 36) risk += 30;
      }
    }

    const needsReview = risk >= 70;
    const publicVisible = !needsReview;

    await admin
      .from("profile_photos")
      .update({
        dhash,
        risk_score: Math.min(100, risk),
        review_status: needsReview ? "needs_review" : "none",
        public_visible: publicVisible,
      })
      .eq("id", photo_id);

    return NextResponse.json({ ok: true, risk, needsReview, publicVisible });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}

function hamming(a: string, b: string) {
  let d = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    if (a[i] !== b[i]) d += 1;
  }
  return d + Math.abs(a.length - b.length);
}
