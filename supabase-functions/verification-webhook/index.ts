import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Payload = {
  user_id: string;
  status: "approved" | "rejected" | "pending";
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const webhookSecret = Deno.env.get("VERO_WEBHOOK_SECRET") ?? "";

const supabase = createClient(supabaseUrl, serviceKey);

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (webhookSecret) {
    const secret = req.headers.get("x-vero-secret");
    if (secret !== webhookSecret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  let body: Payload | null = null;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!body?.user_id || !body?.status) {
    return new Response("Missing fields", { status: 400 });
  }

  if (!["approved", "rejected", "pending"].includes(body.status)) {
    return new Response("Invalid status", { status: 400 });
  }

  const payload: Record<string, string | null> = {
    verification_status: body.status,
  };
  if (body.status === "approved") {
    payload.verified_at = new Date().toISOString();
  } else {
    payload.verified_at = null;
  }

  const { error } = await supabase.from("profiles").update(payload).eq("id", body.user_id);
  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
