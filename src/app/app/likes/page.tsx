'use client';

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function LikesPage() {
    const [likes, setLikes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchLikes = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch interactions where target_id == me AND type == 'like'
            const { data: interactions } = await supabase
                .from('profile_interactions')
                .select('actor_id, created_at')
                .eq('target_id', user.id)
                .eq('interaction_type', 'like')
                .order('created_at', { ascending: false });

            if (!interactions || interactions.length === 0) {
                setLoading(false);
                return;
            }

            const actorIds = interactions.map(i => i.actor_id);

            // 2. Fetch profiles of these actors
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url, bio, profile_type')
                .in('id', actorIds);

            if (profiles) {
                setLikes(profiles);
            }
            setLoading(false);
        };

        fetchLikes();
    }, [supabase]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-background-light dark:bg-black">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-black text-slate-900 dark:text-white px-4 pt-12 pb-24 overflow-y-auto">
            <h1 className="text-2xl font-bold mb-2">Likes You</h1>
            <p className="text-gray-500 mb-6 text-sm">{likes.length} people like you</p>

            {likes.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 mt-12">
                    <div className="w-20 h-20 bg-surface-accent/10 rounded-full flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-primary text-4xl">favorite_border</span>
                    </div>
                    <h3 className="text-lg font-bold mb-2">No likes yet</h3>
                    <p className="text-sm max-w-[200px] leading-relaxed text-gray-400">
                        Optimize your profile to get more visibility.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {likes.map((profile) => (
                        <div key={profile.id} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-800 shadow-md group">
                            <img
                                src={profile.avatar_url || "https://placehold.co/400x600"}
                                alt={profile.display_name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />

                            {/* Simple "Gold" Blur Effect Simulation */}
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-100 group-hover:opacity-0 transition-opacity duration-300 flex flex-col items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-amber-500/20 backdrop-blur-md flex items-center justify-center mb-2">
                                    <span className="material-symbols-outlined text-amber-500 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                                </div>
                                <span className="text-xs font-bold text-white uppercase tracking-wider">Tap to reveal</span>
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                <h4 className="text-white font-bold text-sm">{profile.display_name}</h4>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upsell Teaser */}
            <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                    <h4 className="font-bold text-amber-500 text-sm">See who likes you</h4>
                    <p className="text-xs text-amber-500/80">Upgrade to Gold for instant access</p>
                </div>
                <button className="px-4 py-2 rounded-full bg-amber-500 text-black text-xs font-bold uppercase tracking-wider">
                    Upgrade
                </button>
            </div>
        </div>
    );
}
