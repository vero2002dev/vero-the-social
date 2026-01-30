'use client';

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError("Email ou palavra-passe incorretos.");
            } else {
                router.push("/app/explore");
                router.refresh();
            }
        } catch (err) {
            setError("Ocorreu um erro inesperado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark font-display antialiased text-slate-900 dark:text-white selection:bg-primary selection:text-white">
            <div className="relative flex h-full w-full flex-col overflow-y-auto justify-between no-scrollbar">
                {/* Background Texture/Gradient (Subtle) */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#1f2928] via-transparent to-transparent"></div>

                {/* Main Content Wrapper */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 w-full max-w-md mx-auto z-10">

                    {/* Logo Section */}
                    <div className="w-full flex flex-col items-center mb-12">
                        <h1 className="text-white tracking-tight text-[40px] font-bold leading-none text-center">VERO</h1>
                        <div className="w-8 h-1 bg-primary mt-2 rounded-full opacity-80"></div>
                    </div>

                    {/* Form Section */}
                    <form onSubmit={handleLogin} className="w-full space-y-5">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
                                {error}
                            </div>
                        )}
                        {/* Email Field */}
                        <div className="group relative">
                            <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1" htmlFor="email">Email</label>
                            <div className="relative flex items-center">
                                <input
                                    className="block w-full rounded-lg border border-transparent bg-[#121212] py-3.5 px-4 text-white placeholder-gray-600 focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 ease-out sm:text-sm sm:leading-6"
                                    id="email"
                                    placeholder="exemplo@email.com"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <span className="absolute right-3 text-gray-500 material-symbols-outlined text-[20px]">mail</span>
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="group relative">
                            <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1" htmlFor="password">Password</label>
                            <div className="relative flex items-center">
                                <input
                                    className="block w-full rounded-lg border border-transparent bg-[#121212] py-3.5 px-4 text-white placeholder-gray-600 focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200 ease-out sm:text-sm sm:leading-6 pr-10"
                                    id="password"
                                    placeholder="••••••••"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    className="absolute right-3 text-gray-500 hover:text-white transition-colors flex items-center justify-center focus:outline-none"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 flex items-center justify-center rounded-lg bg-primary py-3.5 px-4 text-sm font-bold text-white shadow-sm hover:bg-[#488a7c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-colors duration-200 tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                    Entrando...
                                </span>
                            ) : "Entrar"}
                        </button>
                    </form>

                    {/* Forgot Password */}
                    <div className="text-center pt-2">
                        <Link href="#" className="text-xs font-normal text-gray-500 hover:text-gray-300 transition-colors">
                            Esqueci-me da password
                        </Link>
                    </div>
                </div>

                {/* Footer / Create Account */}
                <div className="w-full p-6 text-center pb-10 z-10">
                    <p className="text-sm text-gray-500">
                        Não tens conta?
                        <Link href="/auth/signup" className="font-semibold text-white hover:text-primary hover:underline transition-colors ml-1">
                            Criar conta
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
