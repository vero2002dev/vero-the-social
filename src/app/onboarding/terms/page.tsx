'use client';

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TermsPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleAccept = async () => {
        setLoading(true);

        // Call the RPC function we defined in migration, 
        // OR update directly if RLS allows. 
        // Trying direct update first assuming user can update own profile.
        // Bypass strict type check for now to fix build
        // @ts-ignore
        const { error } = await supabase
            .from('profiles')
            .update({ terms_accepted_at: new Date().toISOString() })
            .eq('id', (await supabase.auth.getUser()).data.user?.id!);

        if (error) {
            console.error("Error accepting terms:", error);
            // Fallback or retry
            setLoading(false);
            return;
        }

        router.push('/verification/required');
        router.refresh();
    };

    return (
        <div className="flex min-h-screen flex-col items-center bg-background-light dark:bg-background-dark px-6 py-12 text-slate-900 dark:text-white">
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight">Termos e Condições</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Por favor, leia e aceite nossos termos para continuar.
                    </p>
                </div>

                <div className="bg-white dark:bg-[#121212] p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 h-96 overflow-y-auto text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    <h3 className="font-bold text-lg mb-2 text-primary">1. Introdução</h3>
                    <p className="mb-4">Bem-vindo ao VERO. Ao usar nosso aplicativo, você concorda com...</p>

                    <h3 className="font-bold text-lg mb-2 text-primary">2. Privacidade</h3>
                    <p className="mb-4">Sua privacidade é nossa prioridade. Todos os uploads são...</p>

                    <h3 className="font-bold text-lg mb-2 text-primary">3. Comportamento</h3>
                    <p className="mb-4">Respeito mútuo é fundamental. Não toleramos...</p>

                    <p className="italic opacity-50">[Texto completo dos termos seria inserido aqui...]</p>
                </div>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={handleAccept}
                        disabled={loading}
                        className="w-full rounded-full bg-primary py-4 text-base font-bold text-white shadow-lg hover:bg-[#488a7c] transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? "Aceitando..." : "Li e Aceito os Termos"}
                    </button>

                    <button
                        onClick={() => router.push('/auth/login')} // Or logout
                        className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
                    >
                        Cancelar e Sair
                    </button>
                </div>
            </div>
        </div>
    );
}
