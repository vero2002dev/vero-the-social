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
    const [matchModal, setMatchModal] = useState<any>(null); // { profile: ... }
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

            // Use server-side filtering for scalability
            const { data, error } = await supabase
                .rpc('get_candidates', { limit_count: 10 });

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

        // OPTIMISTIC UPDATE:
        // 1. Move to next card immediately (for UX speed)
        // 2. Process database in background
        const currentSwipeIndex = currentIndex;
        setCurrentIndex(prev => prev + 1);
        setSwipeDirection(null);

        // Background Processing
        setTimeout(async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Call server-side match logic
                const { data, error } = await supabase.rpc('handle_new_swipe', {
                    target_id: target.id,
                    interaction_type: action
                });

                // Check for MATCH!
                if (data && data.is_match) {
                    setMatchModal(target);
                }
            }
        }, 300); // Small delay to sync with animation if needed
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
            {/* MATCH OVERLAY MODAL */}
            {matchModal && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-500">
                    <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-green-400 mb-8 tracking-tighter animate-bounce">
                        IT'S A MATCH!
                    </h2>

                    <div className="flex items-center justify-center gap-4 mb-12">
                        {/* My Avatar (Placeholder current user) */}
                        <div className="w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden relative">
                            <div className="absolute inset-0 bg-gray-800 animate-pulse"></div>
                            {/* In real app, fetch my avatar here too */}
                        </div>

                        <div className="flex items-center justify-center text-primary text-3xl font-bold">
                            X
                        </div>

                        <div className="w-24 h-24 rounded-full border-4 border-primary overflow-hidden shadow-[0_0_30px_rgba(84,155,140,0.6)]">
                            <img src={matchModal.avatar_url} className="w-full h-full object-cover" />
                        </div>
                    </div>

                    <p className="text-white text-lg mb-8 text-center max-w-xs font-medium">
                        You and <span className="text-primary font-bold">{matchModal.display_name}</span> liked each other.
                    </p>

                    <button
                        onClick={() => {
                            setMatchModal(null);
                            // In future: Redirect to chat
                        }}
                        className="w-64 py-4 rounded-full bg-primary text-background-dark font-bold text-lg hover:bg-green-500 transition-all active:scale-95 shadow-xl shadow-primary/20"
                    >
                        SEND MESSAGE
                    </button>

                    <button
                        onClick={() => setMatchModal(null)}
                        className="mt-6 text-gray-500 font-medium hover:text-white uppercase tracking-widest text-xs"
                    >
                        Keep Swiping
                    </button>

                </div>
            )}

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
