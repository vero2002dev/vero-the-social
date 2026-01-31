'use client';

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ChatsPage() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchMatches = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Find my connections
            // Query complexa: precisamos saber em quais conexões estamos
            // e quem é a OUTRA pessoa.

            // Simplificação para MVP: Buscar conexões onde sou member
            const { data: myConnectionsIds } = await supabase
                .from('connection_members')
                .select('connection_id')
                .eq('profile_id', user.id);

            if (!myConnectionsIds || myConnectionsIds.length === 0) {
                setLoading(false);
                return;
            }

            const connIds = myConnectionsIds.map(c => c.connection_id);

            // 2. Buscar detalhes da conexão e o OUTRO membro
            const { data: connectionsData } = await supabase
                .from('connection_members')
                .select(`
                    connection_id,
                    profile:profiles (
                        id,
                        display_name,
                        avatar_url,
                        profile_type,
                        couple_name
                    )
                `)
                .in('connection_id', connIds)
                .neq('profile_id', user.id); // Exclude myself

            if (connectionsData) {
                setMatches(connectionsData);
            }
            setLoading(false);
        };

        fetchMatches();
    }, [supabase]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading your matches...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-black text-slate-900 dark:text-white pt-12">
            <h1 className="text-2xl font-bold px-6 mb-6">Messages</h1>

            {/* MATCHES ROW (New Matches) */}
            <div className="px-6 pb-6 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-4">New Matches</h3>

                {matches.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No matches yet. Keep swiping!</p>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {matches.map((match) => (
                            <Link href={`/app/chats/${match.connection_id}`} key={match.connection_id} className="flex flex-col items-center gap-2 group min-w-[72px]">
                                <div className="w-18 h-18 rounded-full border-2 border-primary p-0.5 relative">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-800">
                                        <img
                                            src={match.profile.avatar_url || "https://placehold.co/100"}
                                            alt={match.profile.display_name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                                </div>
                                <span className="text-xs font-medium truncate w-full text-center group-hover:text-primary transition-colors">
                                    {match.profile.display_name}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* MESSAGES LIST */}
            <div className="flex-1 overflow-y-auto pt-4 pb-24">
                {matches.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 opacity-50 px-6 text-center">
                        <div className="w-16 h-16 bg-surface-accent/10 rounded-full flex items-center justify-center mb-3">
                            <span className="material-symbols-outlined text-3xl">sentiment_satisfied</span>
                        </div>
                        <p className="text-sm">When you match, you can chat here.</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {matches.map((match) => (
                            <Link
                                href={`/app/chats/${match.connection_id}`}
                                key={match.connection_id}
                                className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                            >
                                <div className="w-14 h-14 rounded-full bg-gray-800 overflow-hidden flex-shrink-0">
                                    <img
                                        src={match.profile.avatar_url || "https://placehold.co/100"}
                                        alt={match.profile.display_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-bold text-base truncate pr-2">
                                            {match.profile.display_name}
                                        </h4>
                                        <span className="text-[10px] text-gray-500 font-medium">NEW</span>
                                    </div>
                                    <p className="text-sm text-gray-400 truncate">
                                        You matched! Say hello 👋
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
