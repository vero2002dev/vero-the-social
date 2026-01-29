import { NextResponse } from "next/server";
import { requireAdminFromBearer } from "@/lib/security/admin";

export const runtime = "nodejs";

const BUCKET_FALLBACK = "private_media";
const STRIKE_THRESHOLD = 3;
const REQUEST_MAX_AGE_HOURS = 24;

type Action =
  | "approve_verification"
  | "reject_verification"
  | "approve_flagged_extra"
  | "reject_flagged_extra"
  | "approve_photo"
  | "reject_photo";

async function signedUrl(admin: any, path: string, bucket?: string | null) {
  const bucketId = bucket || BUCKET_FALLBACK;
  const { data } = await admin.storage.from(bucketId).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader : "";
    if (!bearer) {
      return NextResponse.json({ error: "Missing access token" }, { status: 401 });
    }

    const { admin } = await requireAdminFromBearer(bearer);

    // Pending verification requests
    const { data: vr, error: vre } = await admin
      .from("verification_requests")
      .select("id,user_id,type,status,challenge_code,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(50);

    if (vre) throw new Error(vre.message);

    const verifItems = [] as any[];
    for (const r of vr ?? []) {
      const { data: photos } = await admin
        .from("profile_photos")
        .select("id,kind,storage_path,status,created_at,meta")
        .eq("user_id", r.user_id)
        .in("kind", ["selfie_verify", "profile"])
        .contains("meta", { request_id: r.id })
        .order("created_at", { ascending: false });

      const selfie = (photos ?? []).find((p: any) => p.kind === "selfie_verify");
      const prof = (photos ?? []).find((p: any) => p.kind === "profile");

      verifItems.push({
        request: r,
        selfie_photo: selfie
          ? {
              ...selfie,
              signed_url: await signedUrl(admin, selfie.storage_path, selfie.meta?.bucket),
            }
          : null,
        profile_photo: prof
          ? {
              ...prof,
              signed_url: await signedUrl(admin, prof.storage_path, prof.meta?.bucket),
            }
          : null,
      });
    }

    // Flagged extra photos (needs_review)
    const { data: flagged, error: fe } = await admin
      .from("profile_photos")
      .select("id,user_id,kind,storage_path,status,review_status,risk_score,created_at,meta")
      .eq("kind", "extra")
      .eq("review_status", "needs_review")
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .limit(100);

    if (fe) throw new Error(fe.message);

    const flaggedItems = [] as any[];
    for (const p of flagged ?? []) {
      flaggedItems.push({
        photo: {
          ...p,
          signed_url: await signedUrl(admin, p.storage_path, p.meta?.bucket),
        },
      });
    }

    return NextResponse.json({ ok: true, verifications: verifItems, flagged_extras: flaggedItems });
  } catch (e: any) {
    const msg = e?.message ?? "Unknown error";
    const code = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") ?? "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader : "";

    if (!bearer) {
      return NextResponse.json({ error: "Missing access token" }, { status: 401 });
    }

    const { admin, uid } = await requireAdminFromBearer(bearer);
    const body = await req.json().catch(() => ({}));
    const action = body?.action as Action | undefined;

    if (!action) return NextResponse.json({ error: "Missing action" }, { status: 400 });

    if (action === "approve_verification") {
      const requestId = body?.request_id as string | undefined;
      if (!requestId) return NextResponse.json({ error: "Missing request_id" }, { status: 400 });

      const { data: r, error: re } = await admin
        .from("verification_requests")
        .select("id,user_id,type,status,created_at")
        .eq("id", requestId)
        .single();
      if (re || !r) return NextResponse.json({ error: "Request not found" }, { status: 404 });
      if (r.status !== "pending") return NextResponse.json({ error: "Not pending" }, { status: 400 });
      const createdAt = new Date((r as any).created_at ?? Date.now());
      const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
      if (ageHours > REQUEST_MAX_AGE_HOURS) {
        return NextResponse.json(
          { error: "Request expired (create a new one)" },
          { status: 400 }
        );
      }

      const { data: selfieRows, error: se } = await admin
        .from("profile_photos")
        .select("id,status,storage_path")
        .eq("user_id", r.user_id)
        .eq("kind", "selfie_verify")
        .contains("meta", { request_id: requestId })
        .order("created_at", { ascending: false })
        .limit(1);

      if (se) throw new Error(se.message);
      const selfieId = selfieRows?.[0]?.id ?? null;
      if (!selfieId) {
        return NextResponse.json(
          { error: "Missing selfie_verify for this request" },
          { status: 400 }
        );
      }
      const { data: profRows, error: ppe } = await admin
        .from("profile_photos")
        .select("id,status")
        .eq("user_id", r.user_id)
        .eq("kind", "profile")
        .contains("meta", { request_id: requestId })
        .order("created_at", { ascending: false })
        .limit(1);

      if (ppe) throw new Error(ppe.message);
      const profilePhotoId = profRows?.[0]?.id ?? null;

      if (!profilePhotoId) {
        return NextResponse.json(
          { error: "Missing profile photo tied to this request" },
          { status: 400 }
        );
      }

      const { data: selfieRow } = await admin
        .from("profile_photos")
        .select("status")
        .eq("id", selfieId)
        .single();
      if (!selfieRow || ["rejected", "deleted"].includes(selfieRow.status)) {
        return NextResponse.json({ error: "Invalid selfie status" }, { status: 400 });
      }

      const { data: profRow } = await admin
        .from("profile_photos")
        .select("status")
        .eq("id", profilePhotoId)
        .single();
      if (!profRow || ["rejected", "deleted"].includes(profRow.status)) {
        return NextResponse.json({ error: "Invalid profile photo status" }, { status: 400 });
      }

      await admin
        .from("verification_requests")
        .update({
          status: "approved",
          reviewed_at: new Date().toISOString(),
          reviewed_by: uid,
          review_reason: null,
        })
        .eq("id", requestId);

      await admin
        .from("profile_photos")
        .update({
          status: "approved",
          reason: null,
          review_status: "reviewed_ok",
          public_visible: false,
        })
        .eq("id", selfieId);

      await admin
        .from("profile_photos")
        .update({
          status: "approved",
          reason: null,
          review_status: "reviewed_ok",
          public_visible: true,
        })
        .eq("id", profilePhotoId);

      await admin
        .from("profiles")
        .update({
          verification_status: "verified",
          visibility_status: "visible",
          verified_at: new Date().toISOString(),
          baseline_photo_id: profilePhotoId,
        })
        .eq("id", r.user_id);

      return NextResponse.json({ ok: true });
    }

    if (action === "reject_verification") {
      const requestId = body?.request_id as string | undefined;
      const reason = (body?.reason as string | undefined) || "rejected";
      if (!requestId) return NextResponse.json({ error: "Missing request_id" }, { status: 400 });

      const { data: r } = await admin
        .from("verification_requests")
        .select("id,user_id,status")
        .eq("id", requestId)
        .single();
      if (!r) return NextResponse.json({ error: "Request not found" }, { status: 404 });
      if (r.status !== "pending") return NextResponse.json({ error: "Not pending" }, { status: 400 });

      await admin
        .from("verification_requests")
        .update({
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          reviewed_by: uid,
          review_reason: reason,
        })
        .eq("id", requestId);

      await admin
        .from("profile_photos")
        .update({
          status: "rejected",
          review_status: "reviewed_bad",
          public_visible: false,
          reason,
        })
        .eq("user_id", r.user_id)
        .eq("kind", "selfie_verify")
        .contains("meta", { request_id: requestId });

      await admin
        .from("profile_photos")
        .update({
          status: "rejected",
          review_status: "reviewed_bad",
          public_visible: false,
          reason,
        })
        .eq("user_id", r.user_id)
        .eq("kind", "profile")
        .contains("meta", { request_id: requestId });

      await admin
        .from("profiles")
        .update({
          verification_status: "failed",
          visibility_status: "hidden",
        })
        .eq("id", r.user_id);

      return NextResponse.json({ ok: true });
    }

    if (action === "approve_flagged_extra" || action === "approve_photo") {
      const photoId = body?.photo_id as string | undefined;
      if (!photoId) return NextResponse.json({ error: "Missing photo_id" }, { status: 400 });

      await admin
        .from("profile_photos")
        .update({
          review_status: "reviewed_ok",
          public_visible: true,
          reason: null,
        })
        .eq("id", photoId);

      return NextResponse.json({ ok: true });
    }

    if (action === "reject_flagged_extra" || action === "reject_photo") {
      const photoId = body?.photo_id as string | undefined;
      const reason = (body?.reason as string | undefined) || "mismatch";
      const strike = body?.strike === true;
      if (!photoId) return NextResponse.json({ error: "Missing photo_id" }, { status: 400 });

      const { data: p, error: pe } = await admin
        .from("profile_photos")
        .select("id,user_id,status")
        .eq("id", photoId)
        .single();

      if (pe || !p) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

      await admin
        .from("profile_photos")
        .update({
          status: "rejected",
          review_status: "reviewed_bad",
          public_visible: false,
          reason,
        })
        .eq("id", photoId);

      if (strike) {
        const { data: prof, error: pre } = await admin
          .from("profiles")
          .select("strikes,banned_at")
          .eq("id", p.user_id)
          .single();

        if (pre) throw new Error(pre.message);

        const newStrikes = (prof?.strikes ?? 0) + 1;
        const update: any = { strikes: newStrikes };
        if (newStrikes >= STRIKE_THRESHOLD) {
          update.banned_at = new Date().toISOString();
          update.visibility_status = "hidden";
        }

        await admin.from("profiles").update(update).eq("id", p.user_id);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    const msg = e?.message ?? "Unknown error";
    const code = msg === "Unauthorized" ? 401 : msg === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: msg }, { status: code });
  }
}
