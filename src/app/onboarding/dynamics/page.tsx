'use client';

import Link from "next/link";
import { useState } from "react";

export default function DynamicsPage() {
    const [selectedDynamic, setSelectedDynamic] = useState<string>("1-1");

    const dynamics = [
        {
            id: "1-1",
            title: "1 → 1 (Clássico)",
            description: "Conexão tradicional entre duas pessoas",
            icon: (
                <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="12" r="3.5"></circle>
                    <circle cx="16" cy="12" r="3.5"></circle>
                </svg>
            )
        },
        {
            id: "2-1",
            title: "2 → 1 (Par procura)",
            description: "Casal buscando uma terceira pessoa",
            icon: (
                <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="6" cy="10" r="2.5"></circle>
                    <circle cx="9" cy="14" r="2.5"></circle>
                    <path d="M12 12H15" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"></path>
                    <circle cx="18" cy="12" r="3"></circle>
                </svg>
            )
        },
        {
            id: "1-2",
            title: "1 → 2 (Busca par)",
            description: "Pessoa solteira buscando um casal",
            icon: (
                <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="6" cy="12" r="3"></circle>
                    <path d="M10 12H13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"></path>
                    <circle cx="16" cy="10" r="2.5"></circle>
                    <circle cx="19" cy="14" r="2.5"></circle>
                </svg>
            )
        },
        {
            id: "group",
            title: "Triad / Grupo",
            description: "Conexões múltiplas e poliamor",
            icon: (
                <svg fill="currentColor" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="7" r="2.5"></circle>
                    <circle cx="7" cy="16" r="2.5"></circle>
                    <circle cx="17" cy="16" r="2.5"></circle>
                    <path d="M12 9.5L8.5 14.5M12 9.5L15.5 14.5M9.5 16H14.5" stroke="currentColor" strokeLinecap="round" strokeOpacity="0.5" strokeWidth="1"></path>
                </svg>
            )
        }
    ];

    return (
        <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto overflow-hidden bg-background-light dark:bg-black font-display antialiased text-slate-900 dark:text-white selection:bg-primary selection:text-black">
            {/* TopAppBar */}
            <header className="flex items-center justify-between px-6 py-4 z-10">
                <Link href="/onboarding/profile">
                    <button aria-label="Go back" className="text-white/80 hover:text-primary transition-colors flex items-center justify-center size-10 rounded-full hover:bg-white/5">
                        <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
                    </button>
                </Link>
                <Link href="/onboarding/intent">
                    <button className="text-[#9db9b3] hover:text-white text-sm font-bold tracking-wide transition-colors px-2 py-1">
                        Pular
                    </button>
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col px-6 pt-2 pb-24">
                {/* HeadlineText */}
                <div className="mb-6 animate-fade-in-up">
                    <h1 className="text-white text-[32px] font-bold leading-[1.1] tracking-tight mb-3">
                        Define as tuas <br /><span className="text-primary">dinâmicas</span>
                    </h1>
                    {/* BodyText */}
                    <p className="text-[#9db9b3] text-base font-light leading-relaxed">
                        Selecione como você deseja se conectar. Mostraremos apenas perfis compatíveis com sua escolha.
                    </p>
                </div>

                {/* RadioList (Cards) */}
                <div className="flex flex-col gap-4">
                    {dynamics.map((option) => (
                        <label key={option.id} className="group relative cursor-pointer" onClick={() => setSelectedDynamic(option.id)}>
                            <input
                                className="peer sr-only"
                                name="dynamic"
                                type="radio"
                                value={option.id}
                                checked={selectedDynamic === option.id}
                                onChange={() => setSelectedDynamic(option.id)}
                            />
                            <div className="relative flex items-center gap-5 p-5 rounded-[2rem] bg-surface-dark border border-white/5 transition-all duration-300 ease-out peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:shadow-glow group-hover:border-white/20">
                                {/* Icon */}
                                <div className="flex items-center justify-center size-12 rounded-full bg-white/5 text-white/50 transition-colors peer-checked:text-primary peer-checked:bg-primary/10 shrink-0">
                                    {option.icon}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white text-lg font-bold leading-tight mb-1 group-hover:text-primary transition-colors">{option.title}</span>
                                    <span className="text-[#9db9b3] text-sm font-medium leading-snug">{option.description}</span>
                                </div>
                                {/* Checkmark Indicator */}
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 transition-opacity text-primary">
                                    <span className="material-symbols-outlined">check_circle</span>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </main>

            {/* Footer / Continue Button */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent max-w-md mx-auto pointer-events-none">
                <div className="pointer-events-auto">
                    <Link href="/onboarding/intent" className="w-full block">
                        <button className="w-full flex items-center justify-center h-14 rounded-full bg-primary text-black text-[17px] font-bold tracking-wide hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(19,236,189,0.4)]">
                            Continuar
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
