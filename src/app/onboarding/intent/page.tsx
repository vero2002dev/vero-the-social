'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function IntentPage() {
    const [selectedIntent, setSelectedIntent] = useState<string>("1:1");
    const router = useRouter();

    const intents = [
        {
            id: "1:1",
            title: "1:1",
            subtitle: "Monogamous",
            icon: "favorite_border"
        },
        {
            id: "2:1",
            title: "2:1",
            subtitle: "Couple + 1",
            icon: "diversity_1"
        },
        {
            id: "triad",
            title: "Triad",
            subtitle: "Throuple",
            icon: "change_history"
        },
        {
            id: "open",
            title: "Open",
            subtitle: "Casual / ENM",
            icon: "all_inclusive"
        },
        {
            id: "chat",
            title: "Chat",
            subtitle: "Platonic",
            icon: "chat_bubble_outline"
        },
        {
            id: "poly",
            title: "Poly",
            subtitle: "Polyamorous",
            icon: "hub"
        }
    ];

    const handleConfirm = () => {
        // In a real app, save selection here
        router.push('/app/explore');
    };

    return (
        <div className="relative flex min-h-screen flex-col w-full max-w-md mx-auto bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden font-display">
            {/* Top App Bar */}
            <div className="flex items-center justify-between px-4 py-4 sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-transparent dark:border-white/5">
                <Link href="/onboarding/dynamics">
                    <button className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-900 dark:text-white">
                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>arrow_back</span>
                    </button>
                </Link>
                <div className="flex-1"></div>
                <button className="flex size-10 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-900 dark:text-white">
                    <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>more_horiz</span>
                </button>
            </div>

            {/* Headline & Body */}
            <div className="px-6 pt-2 pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">Define a tua presença</h1>
                <p className="text-slate-500 dark:text-slate-400 text-base font-normal leading-relaxed">Select your dating intention to find better matches aligned with you.</p>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 px-4 pb-32 overflow-y-auto no-scrollbar">
                {/* Grid Layout */}
                <div className="grid grid-cols-2 gap-4">
                    {intents.map((intent) => (
                        <div
                            key={intent.id}
                            onClick={() => setSelectedIntent(intent.id)}
                            className={`group relative aspect-square flex flex-col items-center justify-center gap-3 rounded-2xl border p-4 cursor-pointer transition-all duration-300 ${selectedIntent === intent.id
                                    ? 'border-primary bg-gradient-to-br from-primary/20 to-surface-dark shadow-[0_0_20px_-5px_rgba(84,156,140,0.3)]'
                                    : 'border-transparent bg-white dark:bg-surface-dark hover:bg-gray-100 dark:hover:bg-[#2c3332]'
                                }`}
                        >
                            {selectedIntent === intent.id && (
                                <div className="absolute top-3 right-3 size-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-white" style={{ fontSize: '16px', fontWeight: 700 }}>check</span>
                                </div>
                            )}

                            <div className={`size-16 flex items-center justify-center rounded-full mb-1 transition-colors duration-300 ${selectedIntent === intent.id
                                    ? 'bg-primary/20 text-primary scale-110'
                                    : 'bg-gray-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 group-hover:text-primary group-hover:bg-primary/10'
                                }`}>
                                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>{intent.icon}</span>
                            </div>

                            <div className="text-center">
                                <p className={`text-lg font-bold leading-tight ${selectedIntent === intent.id ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                                    {intent.title}
                                </p>
                                <p className={`text-xs font-medium uppercase tracking-wide mt-1 ${selectedIntent === intent.id ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                                    {intent.subtitle}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Action Area */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center">
                <div className="w-full max-w-md px-4 pb-8 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent pt-10">
                    <Link href="/app/explore" className="w-full block">
                        <button className="w-full flex cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 bg-primary hover:bg-primary/90 transition-colors text-white text-base font-bold tracking-wide shadow-lg shadow-primary/20">
                            Confirm Selection
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
