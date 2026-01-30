import Link from "next/link";

export default function LandingPage() {
    return (
        <div className="relative flex min-h-screen w-full flex-col justify-between overflow-hidden bg-background-dark text-white selection:bg-primary selection:text-white">
            {/* Background Gradient */}
            <div
                className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen"
                style={{ background: 'radial-gradient(circle at 50% 0%, #549B8C22 0%, transparent 60%)' }}
            ></div>

            {/* Header */}
            <header className="relative z-10 flex w-full justify-center p-6 pt-12">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '28px' }}>diamond</span>
                    <span className="text-xl font-extrabold tracking-[0.2em] text-white">VERO</span>
                </div>
            </header>

            {/* Main Content (Image) */}
            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4">
                <div className="@container w-full max-w-sm">
                    <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl relative shadow-[0_0_40px_-10px_rgba(84,155,140,0.3)]">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background-dark z-10"></div>
                        {/* Note: Using the external URL from the reference HTML. In a real production app, this should be a local asset or optimized Next.js Image */}
                        <div
                            className="w-full h-full bg-center bg-cover opacity-80"
                            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCInopW8XXne9joBdzIJzzdxgugRXQvtFpvHsOiT109b1-jOfhkwxOSV1X0VjNVwBKWcgXQqUUrNExqwvd8tMn1C-IHw8gJ35KBZn10j6HxGvzY9Gm1hagGpsXjRVGH8lY7cm-0FW9dNDp6_jB9eaA2nmQmQ7OKG12VLuJw_fY2rVipqReUt0-cFcgMGVccevTnl68F24cHWp_2ONw0KdixLQ0CCPZC4BOWwCYUpkwPg5Mke963JQ52vsxg3bQ7oYLEViJcfRaEqW6d")' }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Footer / Actions */}
            <div className="relative z-20 flex w-full flex-col items-center pb-10 pt-6">
                <div className="mb-10 w-full px-6 text-center">
                    <h1 className="font-display text-[36px] font-bold leading-[1.1] tracking-tight text-white mb-3">
                        Duas presenças.<br />
                        <span className="text-primary drop-shadow-[0_0_15px_rgba(84,155,140,0.5)]">Uma ligação real.</span>
                    </h1>
                    <p className="font-body text-sm font-medium tracking-wide text-white/60 uppercase">
                        Real presence. Real dynamics.
                    </p>
                </div>

                <div className="flex w-full flex-col gap-3 px-6 max-w-[480px]">
                    <Link href="/auth/signup" className="w-full">
                        <button className="group relative flex h-14 w-full cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary text-white shadow-[0_0_20px_rgba(84,155,140,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(84,155,140,0.6)] active:scale-[0.98]">
                            <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity group-hover:opacity-100"></span>
                            <span className="font-display text-base font-bold tracking-[0.1em] uppercase z-10">Criar conta</span>
                        </button>
                    </Link>

                    <Link href="/auth/login" className="w-full">
                        <button className="flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-transparent text-white/80 transition-colors hover:text-white">
                            <span className="font-display text-sm font-semibold tracking-wide">Entrar</span>
                        </button>
                    </Link>
                </div>

                <div className="mt-6 px-6 text-center">
                    <p className="text-[10px] text-white/30">
                        Ao entrar, você concorda com nossos Termos e Política de Privacidade.
                    </p>
                </div>
            </div>
        </div>
    );
}
