'use client';

export default function LikesPage() {
    return (
        <>
            {/* Header */}
            <header className="flex items-center justify-between px-6 pt-12 pb-4 bg-background-light dark:bg-background-dark sticky top-0 z-50">
                <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Atividade</h1>
                <button className="rounded-full p-2 text-neutral-500 hover:text-primary transition-colors dark:text-neutral-400 dark:hover:text-primary">
                    <span className="material-symbols-outlined !text-[28px]">tune</span>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-24">

                {/* Section: Novas Ligações */}
                <section className="mb-8">
                    <div className="px-6 py-3 sticky top-[72px] bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm z-40">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-500">Novas Ligações</h3>
                    </div>
                    <div className="flex flex-col gap-1 px-4">

                        {/* Item 1 (Unread) */}
                        <div className="group relative flex items-center justify-between rounded-2xl bg-white dark:bg-surface-dark p-4 transition-all hover:bg-neutral-50 dark:hover:bg-surface-highlight border border-transparent dark:border-neutral-900">
                            <div className="flex items-center gap-4">
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(84,156,140,0.6)]"></div>
                                <div className="relative h-14 w-14 shrink-0">
                                    <div className="h-full w-full rounded-full bg-cover bg-center ring-2 ring-white dark:ring-surface-dark" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDxIIeg3NM_0dHP0A6Rvwi4Txr5EswgShJDRdw0HsSceNLs_8K7SqPWouSz0auMzyiptQWGn5hUhmuo_323wfTPox6evFM40rfndB9X69PtclGOYRy869aI2qLtg9jkIsizFyenRs3Mecex_iqKIe1CaQtgf9QwlCfV-WR0xVEaeei5M_g_SEYq1kZgCpvw6A0Tt2ECro4MhNBMTR70CzSGuKwE06-s77Hol6IWKh-qy42xubYYeASFCe47M72Csz3MEdzTKNO8YIZG")' }}></div>
                                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white ring-2 ring-white dark:ring-surface-dark">
                                        <span className="material-symbols-outlined !text-[14px]">favorite</span>
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-semibold text-neutral-900 dark:text-white leading-tight">Ana & You</span>
                                    <span className="text-sm font-medium text-primary">Matched today</span>
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Looking for a coffee partner</span>
                                </div>
                            </div>
                            <button className="flex h-9 min-w-[88px] items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-transform active:scale-95">
                                Ver Chat
                            </button>
                        </div>

                        {/* Item 2 (Unread) */}
                        <div className="group relative flex items-center justify-between rounded-2xl bg-white dark:bg-surface-dark p-4 transition-all hover:bg-neutral-50 dark:hover:bg-surface-highlight border border-transparent dark:border-neutral-900 mt-2">
                            <div className="flex items-center gap-4">
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(84,156,140,0.6)]"></div>
                                <div className="relative h-14 w-14 shrink-0">
                                    <div className="h-full w-full rounded-full bg-cover bg-center ring-2 ring-white dark:ring-surface-dark" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCIKwhgDHIQnsDmFt-kc31L8_dcw1lE50ouCi59t4vBcOiCZzPI3lkiiyCvtsCP_Mc_KRbWj4yh80jAlFbMPM3v_i0PEJtRGxPp-jRctgLWQGiv2xWf1XfvOI75Ai_mW6vcVFyBYItgjptxQ80LphqlMM5a4BHuowv0vIupznhFXQN8ZLoI39OpOx8ts0VMqM1jXHjsSPtk5Po1UxZZdkHHeT_SWjm696oTpYPG1VBuPUqcjd6vy2AbokpdWIgQnKr1KjvhD0uqqgE4")' }}></div>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-base font-semibold text-neutral-900 dark:text-white leading-tight">Marco</span>
                                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Casual drink • Exploring</span>
                                </div>
                            </div>
                            <button className="flex h-9 min-w-[88px] items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 px-4 text-sm font-semibold text-neutral-900 dark:text-white transition-transform active:scale-95 hover:bg-neutral-200 dark:hover:bg-neutral-700">
                                Ver Chat
                            </button>
                        </div>

                    </div>
                </section>

                {/* Section: Convites */}
                <section className="mb-8">
                    <div className="px-6 py-3 sticky top-[72px] bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm z-40">
                        <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-500">Convites</h3>
                    </div>
                    <div className="flex flex-col gap-3 px-4">

                        {/* Invite 1 */}
                        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-surface-dark p-5 shadow-sm border border-transparent dark:border-neutral-900">
                            <div className="absolute right-4 top-4 h-2 w-2 rounded-full bg-primary"></div>
                            <div className="mb-4 flex items-center">
                                <div className="flex -space-x-3 rtl:space-x-reverse">
                                    <div className="h-10 w-10 rounded-full border-2 border-white dark:border-surface-dark bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBiv5nQAnNLHOGoAfmnwJpxKFZXm6aztemVnZMK9oRGNBmKpBCBXYLeAQLmEaew_F07HW_w9kPpAvW3fmar30KyTD8qhq9v2muskeS8lpuR2qdoIDCq-m8Sw7pWBqzL7yrOFjiJ_bbfscvEBzdgYVWEhKE1UyDcDPzDk1TNzE9JKctPKKSaZbvJDxUPMZE304yDKzafJCHnTcnwqeAT_LpTAgVzablygtH8g8EBevufB_fSEZskcdCbKz4gDieP9BjZxg_-jG28bE3a")' }}></div>
                                    <div className="h-10 w-10 rounded-full border-2 border-white dark:border-surface-dark bg-cover bg-center flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                                        <span className="material-symbols-outlined text-neutral-400 !text-[20px]">person</span>
                                    </div>
                                </div>
                                <div className="ml-4 flex flex-col">
                                    <span className="text-sm font-bold text-neutral-900 dark:text-white">Carlos</span>
                                    <span className="text-xs text-neutral-500">Invited you to an event</span>
                                </div>
                            </div>
                            <div className="mb-4 rounded-xl bg-neutral-50 dark:bg-black/40 p-3">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <span className="material-symbols-outlined">nightlife</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">Jazz Night @ Blue Note</p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Friday, 20:00 • Cocktails & Music</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform active:scale-95">
                                    Confirmar
                                </button>
                                <button className="flex-1 rounded-lg py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors">
                                    Recusar
                                </button>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Bottom Spacer */}
                <div className="h-8"></div>
            </main>
        </>
    );
}
