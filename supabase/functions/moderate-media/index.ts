import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  RekognitionClient,
  DetectModerationLabelsCommand,
} from "npm:@aws-sdk/client-rekognition";

type Payload = {
  media_id: number;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const awsRegion = Deno.env.get("AWS_REGION") ?? "eu-west-1";
const awsKey = Deno.env.get("AWS_ACCESS_KEY_ID") ?? "";
const awsSecret = Deno.env.get("AWS_SECRET_ACCESS_KEY") ?? "";

const supabase = createClient(supabaseUrl, serviceKey);
const rekognition = new RekognitionClient({
  region: awsRegion,
  credentials: {
    accessKeyId: awsKey,
    secretAccessKey: awsSecret,
  },
});

function classify(labels: { Name?: string; ParentName?: string; Confidence?: number }[]) {
  const names = new Set(labels.map((l) => l.Name).filter(Boolean) as string[]);
  const parents = new Set(labels.map((l) => l.ParentName).filter(Boolean) as string[]);
  const confidence = Math.max(...labels.map((l) => l.Confidence ?? 0), 0);

  const explicitNames = [
    "Explicit Nudity",
    "Sexual Activity",
    "Explicit Sexual Activity",
    "Nudity",
  ];
  const sensualNames = [
    "Suggestive",
    "Female Swimwear Or Underwear",
    "Male Swimwear Or Underwear",
    "Revealing Clothes",
    "Partial Nudity",
  ];

  if (
    explicitNames.some((n) => names.has(n)) ||
    parents.has("Explicit Nudity")
  ) {
    return { status: "explicit", confidence };
  }

  if (sensualNames.some((n) => names.has(n)) || parents.has("Suggestive")) {
    return { status: "sensual", confidence };
  }

  return { status: "safe", confidence };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: Payload | null = null;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!body?.media_id) {
    return new Response("Missing media_id", { status: 400 });
  }

  const { data: media, error } = await supabase
    .from("profile_media")
    .select("id, media_type, storage_path")
    .eq("id", body.media_id)
    .maybeSingle();

  if (error || !media) {
    return new Response("Media not found", { status: 404 });
  }

  if (media.media_type === "video") {
    await supabase
      .from("profile_media")
      .update({
        moderation_status: "pending_manual",
        moderated_at: new Date().toISOString(),
      })
      .eq("id", media.id);
    return new Response(JSON.stringify({ status: "pending_manual" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: signed, error: sErr } = await supabase.storage
    .from("profile_media")
    .createSignedUrl(media.storage_path, 60 * 10);

  if (sErr || !signed?.signedUrl) {
    return new Response("Failed to sign url", { status: 500 });
  }

  const fileRes = await fetch(signed.signedUrl);
  if (!fileRes.ok) {
    return new Response("Failed to fetch media", { status: 500 });
  }

  const bytes = new Uint8Array(await fileRes.arrayBuffer());
  const command = new DetectModerationLabelsCommand({
    Image: { Bytes: bytes },
    MinConfidence: 70,
  });

  const result = await rekognition.send(command);
  const labels = result.ModerationLabels ?? [];
  const { status, confidence } = classify(labels);

  const { error: updErr } = await supabase
    .from("profile_media")
    .update({
      moderation_status: status,
      moderation_labels: labels,
      moderation_score: confidence,
      moderated_at: new Date().toISOString(),
    })
    .eq("id", media.id);

  if (updErr) {
    return new Response("Failed to update media", { status: 500 });
  }

  return new Response(JSON.stringify({ status }), {
    headers: { "Content-Type": "application/json" },
  });
});
