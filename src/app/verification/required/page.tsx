'use client';

import Link from "next/link";

export default function VerificationRequiredPage() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark px-6 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-primary text-[32px]">mail</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verifica o teu email</h1>
            <p className="text-slate-500 max-w-sm mb-8">
                Enviámos um link de confirmação para o teu email. Por favor, clica no link para ativar a tua conta.
            </p>
            <div className="flex flex-col gap-4 w-full max-w-xs">
                <Link href="/auth/login">
                    <button className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white hover:bg-[#488a7c] transition-colors">
                        Voltar ao Login
                    </button>
                </Link>
            </div>
        </div>
    );
}
