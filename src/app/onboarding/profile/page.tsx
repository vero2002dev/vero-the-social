'use client';

import Link from "next/link";
import { useState } from "react";

export default function ProfileSetupPage() {
    const [displayName, setDisplayName] = useState("Alex D.");

    return (
        <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto shadow-2xl overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white antialiased selection:bg-primary selection:text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-background-light/90 dark:bg-background-dark/90 px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-white/5">
                <Link href="/onboarding/choose-profile-type">
                    <button className="flex items-center justify-center p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-gray-900 dark:text-white" style={{ fontSize: '24px' }}>arrow_back</span>
                    </button>
                </Link>
                <h1 className="text-lg font-bold tracking-tight">Create Profile</h1>
                <div className="w-10"></div> {/* Spacer for alignment */}
            </header>

            <main className="flex-1 flex flex-col pb-8">
                {/* Avatar Section */}
                <section className="flex flex-col items-center pt-8 pb-6 px-6">
                    <div className="relative group cursor-pointer">
                        <div className="absolute -inset-1 bg-gradient-to-br from-primary via-cyan-700 to-blue-800 rounded-full opacity-75 blur-sm group-hover:opacity-100 transition duration-500"></div>
                        <div
                            className="relative h-32 w-32 rounded-full bg-cover bg-center border-4 border-background-light dark:border-background-dark shadow-xl flex items-center justify-center bg-surface-dark"
                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCbj1ZDru3zTbbTqAsmk0sFmJz_wQMu6vImb1cZdYrH4js66LJHxdL36M7k4A_bs_bREN3RyhWRj5b-Dm_1hlZ1uaROP3sOi1K1e2FmWIGzN5AL8RJbpUwka6ghJOiCBMNgE422n3Ln8Uic1EhZdyJmdZZwgap6kE52RHvbmOWCpE9R77ba3VpOqtJKTvYLJwZi0iW7hlprSfybH3VZ_pGIDzotavyeNFHHZWXY-reT9QcM1TcTm8gA9oQ-gcJBJQd7892wm68lfHaf')" }}
                        >
                            {/* Overlay for upload hint */}
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="material-symbols-outlined text-white">camera_alt</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 w-full max-w-xs text-center">
                        <label htmlFor="displayName" className="sr-only">Display Name</label>
                        <input
                            type="text"
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="block w-full text-center bg-transparent border-0 border-b-2 border-gray-200 dark:border-white/10 focus:border-primary focus:ring-0 text-2xl font-bold text-gray-900 dark:text-white placeholder-gray-500 leading-tight py-2 transition-colors"
                            placeholder="Your Name"
                        />
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            This is how you'll appear to matches
                        </p>
                    </div>
                </section>

                {/* Dynamics Preview (Static/Disabled for now) */}
                <section className="mt-2 opacity-60">
                    <div className="px-6 py-2 flex items-end justify-between">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Dynamics</h3>
                    </div>
                    <div className="bg-white dark:bg-surface-dark border-y border-gray-200 dark:border-white/5 px-6 py-4">
                        <p className="text-sm text-gray-500">You'll set this next.</p>
                    </div>
                </section>

                {/* Continue Button */}
                <div className="mt-auto px-6 pb-6 pt-8">
                    <Link href="/onboarding/dynamics" className="w-full">
                        <button className="relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 bg-primary text-white text-lg font-bold tracking-wide shadow-glow transition-transform active:scale-95 hover:brightness-110">
                            <span className="z-10">Continue</span>
                        </button>
                    </Link>
                </div>

            </main>
        </div>
    );
}
