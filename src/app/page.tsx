import Link from "next/link";

export default function LandingPage() {
    return (
        <div className="relative flex min-h-screen w-full flex-col justify-between bg-black text-white selection:bg-[#549B8C] selection:text-white">
            {/* Centered Logo & Tagline */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 animate-fade-in">
                <div className="flex flex-col items-center gap-6 text-center">
                    <h1 className="text-6xl font-extrabold tracking-[0.25em] text-white drop-shadow-sm">
                        VERO
                    </h1>
                    <p className="font-display text-lg font-light tracking-widest text-white/80">
                        True Human Interactions
                    </p>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-20 flex w-full flex-col items-center pb-12 px-8">
                <div className="flex w-full flex-col gap-4 max-w-[420px]">
                    <Link href="/auth/signup" className="w-full">
                        <button className="group relative flex h-14 w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#549B8C] text-white transition-all hover:bg-[#4a8a7c] active:scale-[0.98]">
                            <span className="font-display text-base font-bold tracking-[0.05em]">Criar conta</span>
                        </button>
                    </Link>

                    <Link href="/auth/login" className="w-full">
                        <button className="flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-transparent text-white transition-colors hover:text-white/70">
                            <span className="font-display text-sm font-semibold tracking-wide">Entrar</span>
                        </button>
                    </Link>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] text-white/30">
                        Ao entrar, você concorda com nossos Termos e Política de Privacidade.
                    </p>
                </div>
            </div>
        </div>
    );
}
