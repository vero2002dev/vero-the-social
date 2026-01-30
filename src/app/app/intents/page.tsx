'use client';

import { useState } from "react";
import Link from 'next/link';

export default function IntentsPage() {
    const [selectedIntent, setSelectedIntent] = useState<string>("deep_connection");

    const intents = [
        {
            id: "deep_connection",
            title: "Conexão Profunda",
            description: "Conversas longas e vulnerabilidade.",
            icon: "favorite"
        },
        {
            id: "sensual_tension",
            title: "Tensão Sensual",
            description: "Química física e atração.",
            icon: "local_fire_department"
        },
        {
            id: "curious_exploration",
            title: "Exploração Curiosa",
            description: "Aberto a novas experiências.",
            icon: "explore"
        },
        {
            id: "light_company",
            title: "Companhia Leve",
            description: "Diversão sem pressão.",
            icon: "celebration"
        }
    ];

    return (
        <div className="relative flex h-full w-full flex-col max-w-md mx-auto bg-background-light dark:bg-black overflow-hidden pointer-events-auto">
            {/* TopAppBar */}
            <header className="flex items-center justify-between px-6 pt-12 pb-2 z-10 shrink-0">
                <Link href="/app/explore">
                    <button className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-neutral-200 dark:hover:bg-white/10 text-neutral-600 dark:text-white transition-colors cursor-pointer">
                        <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
                    </button>
                </Link>
                <div className="w-10"></div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
                {/* HeadlineText */}
                <div className="mb-8 mt-2 animate-fade-in-up">
                    <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-neutral-900 dark:text-white mb-2">
                        Qual é a tua <br />
                        <span className="text-primary">intenção</span> agora?
                    </h1>
                    <p className="text-neutral-500 dark:text-zinc-500 text-sm font-medium">Escolha o que melhor descreve o que procuras.</p>
                </div>

                {/* RadioList */}
                <div className="flex flex-col gap-4">
                    {intents.map((intent) => (
                        <label key={intent.id} className="group relative cursor-pointer" onClick={() => setSelectedIntent(intent.id)}>
                            <input
                                className="peer sr-only"
                                name="intent"
                                type="radio"
                                checked={selectedIntent === intent.id}
                                onChange={() => setSelectedIntent(intent.id)}
                            />
                            <div className="relative flex items-center p-4 rounded-xl border border-neutral-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 backdrop-blur-sm transition-all duration-300 ease-out hover:border-neutral-300 dark:hover:border-zinc-700 peer-checked:border-primary dark:peer-checked:border-primary peer-checked:bg-primary/5 dark:peer-checked:bg-primary/5 peer-checked:shadow-[0_4px_20px_-12px_rgba(83,157,141,0.5)] [&_.icon-box]:peer-checked:bg-primary [&_.icon-box]:peer-checked:text-white [&_.check-circle]:peer-checked:border-primary [&_.check-circle]:peer-checked:bg-primary [&_.check-circle]:peer-checked:text-white [&_.check-icon]:peer-checked:opacity-100">
                                {/* Icon */}
                                <div className={`icon-box flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-neutral-100 dark:bg-zinc-800 text-neutral-400 dark:text-zinc-400 transition-colors duration-300 ${selectedIntent === intent.id ? 'bg-primary text-white' : ''}`}>
                                    <span className="material-symbols-outlined text-[28px]">{intent.icon}</span>
                                </div>
                                {/* Text */}
                                <div className="ml-4 flex-1">
                                    <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-0.5">{intent.title}</h3>
                                    <p className="text-xs text-neutral-500 dark:text-zinc-400 font-medium leading-relaxed">{intent.description}</p>
                                </div>
                                {/* Check Indicator */}
                                <div className={`check-circle ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 dark:border-zinc-700 bg-transparent transition-all duration-300 text-transparent ${selectedIntent === intent.id ? 'border-primary bg-primary text-white' : ''}`}>
                                    <span className={`check-icon material-symbols-outlined text-[16px] font-bold transition-opacity duration-200 ${selectedIntent === intent.id ? 'opacity-100' : 'opacity-0'}`}>check</span>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background-light via-background-light dark:from-black dark:via-black to-transparent pt-12 z-20 pointer-events-none">
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary h-14 px-5 text-white text-[17px] font-bold tracking-tight shadow-lg shadow-primary/20 hover:bg-[#468c7c] transition-all transform active:scale-[0.98] cursor-pointer pointer-events-auto">
                    Confirmar Intenção
                </button>
            </div>
        </div>
    );
}
