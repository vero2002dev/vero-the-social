'use client';

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

// Mock fallbacks for visuals until DB is populated
const MOCK_PROFILE = {
    id: 'mock',
    display_name: 'Novo Usuário',
    bio: 'Carregando...',
    avatar_url: null
};

export default function ExplorePage() {
    const [profiles, setProfiles] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

    const supabase = createClient();

    // Fetch Candidates
    useEffect(() => {
        const fetchCandidates = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get IDs I already interacted with
            const { data: interactions } = await supabase
                .from('profile_interactions')
                .select('target_id')
                .eq('actor_id', user.id);

            const seenIds = interactions?.map(i => i.target_id) || [];
            if (user?.id) seenIds.push(user.id); // Add self to ignore list

            // 2. Fetch profiles NOT in seen list
            let query = supabase.from('profiles').select('*').limit(10);

            if (seenIds.length > 0) {
                // Note: .not('id', 'in', ...) expects format :(id1,id2) or array?
                // Supabase JS client handles array in .in(), but .not() "in" filter syntax:
                // .not('id', 'in', `(${seenIds.join(',')})`)
                // Safer: manual filter client side for MVP if array is small, 
                // but let's try strict filter.
                query = query.not('id', 'in', `(${seenIds.join(',')})`);
            }

            const { data, error } = await query;

            if (data) {
                setProfiles(data);
            } else {
                console.error("Error fetching profiles:", error);
            }
            setLoading(false);
        };

        fetchCandidates();
    }, [supabase]);

    const handleSwipe = async (direction: 'left' | 'right') => {
        if (profiles.length === 0 || currentIndex >= profiles.length) return;

        const target = profiles[currentIndex];
        const action = direction === 'right' ? 'like' : 'pass';
        setSwipeDirection(direction);

        // Optimistic UI update: Wait small delay for animation then move next
        setTimeout(async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Persist interaction
                // @ts-ignore
                await supabase.from('profile_interactions').insert({
                    actor_id: user.id,
                    target_id: target.id,
                    interaction_type: action
                });
            }

            setSwipeDirection(null);
            setCurrentIndex(prev => prev + 1);
        }, 300); // 300ms animation duration
    };

    // Current card to display
    const currentProfile = profiles[currentIndex];

    // Fallback if no more profiles
    if (!loading && (!currentProfile)) {
        return (
            <div className="flex h-full flex-col items-center justify-center bg-background-light dark:bg-black text-center px-6">
                <div className="w-20 h-20 bg-surface-accent/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <span className="material-symbols-outlined text-primary text-4xl">radar</span>
                </div>
                <h2 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Não há mais ninguém por perto.</h2>
                <p className="text-gray-500 mb-8">Volte mais tarde para ver novas pessoas.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 rounded-full bg-surface-accent/10 text-primary font-bold hover:bg-surface-accent/20 transition-colors"
                >
                    Atualizar Radar
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-black">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            {/* Header */}
            <header className="flex items-center justify-between px-4 pt-12 pb-4 z-20">
                <button className="flex size-10 items-center justify-center rounded-full bg-surface-accent/50 backdrop-blur-sm text-white hover:bg-surface-accent transition-colors">
                    <span className="material-symbols-outlined text-xl">tune</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    <h1 className="text-lg font-bold tracking-wide text-white">VERO</h1>
                </div>
                <button className="relative flex size-10 items-center justify-center rounded-full bg-surface-accent/50 backdrop-blur-sm text-white hover:bg-surface-accent transition-colors">
                    <span className="material-symbols-outlined text-xl">notifications</span>
                </button>
            </header>

            {/* Main Content (Swipe Card) */}
            <main className="flex-1 relative flex flex-col justify-center px-4 pb-24 pt-2 w-full overflow-hidden">
                <div
                    className={`relative w-full h-full flex flex-col rounded-xl overflow-hidden shadow-2xl bg-surface-dark group transition-transform duration-300 ease-out ${swipeDirection === 'left' ? '-translate-x-[150%] rotate-[-10deg]' : swipeDirection === 'right' ? 'translate-x-[150%] rotate-[10deg]' : ''}`}
                >

                    {/* Background Image */}
                    <div className="absolute inset-0 w-full h-full bg-gray-800">
                        {currentProfile.avatar_url ? (
                            <div
                                className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                                style={{ backgroundImage: `url('${currentProfile.avatar_url}')` }}
                            ></div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                                <span className="material-symbols-outlined text-white/20 text-6xl">person</span>
                            </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark/95 via-background-dark/40 to-transparent opacity-80"></div>
                    </div>

                    {/* Card Content Overlay */}
                    <div className="relative z-10 flex h-full flex-col justify-end p-6 select-none">

                        {/* Tags (Optional - hardcoded style for now) */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {currentProfile.profile_type === 'couple' && (
                                <div className="flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/30 px-3 py-1.5 backdrop-blur-md">
                                    <span className="material-symbols-outlined text-primary text-[16px]">group</span>
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Couple</span>
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="mb-4">
                            <div className="flex items-end gap-2 mb-1">
                                <h2 className="text-3xl font-bold text-white leading-tight">
                                    {currentProfile.profile_type === 'couple' ? currentProfile.couple_name : currentProfile.display_name}
                                    {/* Age could be calculated from birthdate if added later */}
                                </h2>
                                {currentProfile.verification_status === 'verified' && (
                                    <span className="material-symbols-outlined text-primary mb-1.5" style={{ fontVariationSettings: "'FILL' 1" }} title="Verified">verified</span>
                                )}
                            </div>

                            <p className="text-gray-200 text-base font-medium leading-relaxed line-clamp-3">
                                {currentProfile.bio || "Sem biografia."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute bottom-6 left-0 right-0 px-6 flex items-center justify-center gap-6 z-30">
                    <button
                        onClick={() => handleSwipe('left')}
                        className="flex size-16 items-center justify-center rounded-full bg-surface-accent/80 border border-white/10 text-white shadow-lg backdrop-blur-md transition-transform active:scale-95 hover:bg-surface-accent hover:text-red-400"
                    >
                        <span className="material-symbols-outlined text-3xl">close</span>
                        <span className="sr-only">Passar</span>
                    </button>

                    <button
                        onClick={() => handleSwipe('right')}
                        className="flex h-16 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-white shadow-[0_0_20px_rgba(84,155,140,0.4)] transition-transform active:scale-95 hover:bg-[#468275]"
                    >
                        {swipeDirection === 'right' ? (
                            <span className="material-symbols-outlined text-3xl animate-bounce">favorite</span>
                        ) : (
                            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                        )}
                        <span className="text-lg font-bold tracking-wide">CONECTAR</span>
                    </button>

                    <button className="flex size-12 items-center justify-center rounded-full bg-surface-accent/40 border border-white/5 text-gray-300 backdrop-blur-md transition-transform active:scale-95 hover:text-primary">
                        <span className="material-symbols-outlined text-2xl">bookmark</span>
                    </button>
                </div>
            </main>
        </>
    );
}
