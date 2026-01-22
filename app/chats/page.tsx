"use client";

import { useEffect, useState } from "react";
import { fetchActiveChats, type ChatListItem as Item } from "@/lib/chats";
import ChatListItem from "@/components/ChatListItem";
import { useRouter } from "next/navigation";
import { rpcUsage } from "@/lib/invites";
import { setUnlockedCookie } from "@/lib/verificationCookies";

export default function ChatsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const usage = await rpcUsage();
      setUnlockedCookie(!!usage.unlocked);
      if (!usage.unlocked) {
        router.push("/unlock");
        return;
      }
      const data = await fetchActiveChats();
      setItems(data);
    } catch (e: any) {
      setErr(e?.message ?? "Erro a carregar chats.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-xl mx-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Chats</h1>
            <p className="mt-2 text-sm text-neutral-400">
              Conversas ativas. Sem ruido.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20"
              onClick={() => router.push("/discover")}
            >
              Descobrir
            </button>
            <button
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm hover:border-white/20"
              onClick={load}
            >
              Atualizar
            </button>
          </div>
        </div>

        {err && <div className="mt-4 text-sm text-red-400">{err}</div>}

        <div className="mt-6">
          {loading ? (
            <div className="text-sm text-neutral-400">A carregar...</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="font-medium">Ainda sem chats.</div>
              <div className="mt-1 text-sm text-neutral-400">
                Faz match e abre uma conversa.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {items.map((it) => (
                <ChatListItem key={it.conversation_id} item={it} />
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-neutral-500">
          Algumas coisas expiram. E intencional.
        </p>
      </div>
    </main>
  );
}
