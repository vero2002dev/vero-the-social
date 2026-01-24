import { createClient } from "@supabase/supabase-js";

export async function requireAdminFromBearer(bearer: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!url || !anon || !service) {
    throw new Error("Server misconfigured");
  }

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: bearer } },
  });
  const admin = createClient(url, service);

  const { data: u, error: uErr } = await userClient.auth.getUser();
  if (uErr || !u?.user?.id) {
    throw new Error("Unauthorized");
  }

  const uid = u.user.id;
  const { data: prof } = await admin.from("profiles").select("is_admin").eq("id", uid).single();
  if (!prof?.is_admin) {
    throw new Error("Forbidden");
  }

  return { admin, uid };
}
