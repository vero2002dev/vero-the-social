'use client';

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VerificationRequiredPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        router.push('/auth/login');
        router.refresh();
    };

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark px-6 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-[32px]">mail</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verifica o teu email</h1>
            <p className="text-slate-500 max-w-sm mb-8">
                Enviámos um link de confirmação para o teu email.<br />
                Por favor, clica no link para ativar a tua conta.
            </p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
                <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white hover:bg-[#488a7c] transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                    {isLoading ? "A sair..." : "Sair e Tentar Novamente"}
                </button>
                <p className="text-xs text-gray-500 mt-4">
                    Já confirmou? <button onClick={handleLogout} className="text-primary hover:underline">Faça login novamente</button>
                </p>
            </div>
        </div>
    );
}
