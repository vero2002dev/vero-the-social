'use client';

export default function ProfilePage() {
    return (
        <>
            {/* Top App Bar */}
            <header className="shrink-0 flex items-center justify-between px-4 py-2 pt-12 pb-4 bg-background-light dark:bg-background-dark z-10">
                <button className="text-gray-900 dark:text-white flex size-12 shrink-0 items-center justify-start hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[24px]">settings</span>
                </button>
                <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Editar Perfil</h2>
                <button className="flex size-12 shrink-0 items-center justify-end text-gray-900 dark:text-white hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[24px]">visibility</span>
                </button>
            </header>

            {/* Main Scrollable Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-24">

                {/* Presence Management Section */}
                <section className="px-4 py-2">
                    <div className="flex flex-col gap-4">
                        {/* Status Item */}
                        <div className="flex items-center gap-4 bg-white/5 dark:bg-white/5 px-4 h-16 rounded-xl border border-white/10">
                            <div className="flex items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0 size-10">
                                <span className="material-symbols-outlined">person</span>
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Modo Atual</span>
                                <p className="text-base font-semibold leading-tight">Individual</p>
                            </div>
                            <div className="shrink-0 text-primary">
                                <span className="material-symbols-outlined text-[24px]">check_circle</span>
                            </div>
                        </div>
                        {/* Action Button */}
                        <button className="w-full h-14 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all rounded-xl flex items-center justify-center gap-2 group shadow-lg shadow-primary/10">
                            <span className="material-symbols-outlined text-background-dark group-hover:rotate-12 transition-transform">group_add</span>
                            <span className="text-background-dark text-base font-bold tracking-wide">Gerir Presença Conjunta</span>
                        </button>
                    </div>
                </section>

                {/* Divider */}
                <div className="h-px bg-white/10 mx-4 my-6"></div>

                {/* Photos Section */}
                <section className="px-4">
                    <div className="flex justify-between items-end mb-4">
                        <h3 className="text-xl font-bold leading-tight">Fotos de Perfil</h3>
                        <span className="text-sm text-gray-400">4/6</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {/* Photo 1 (Main) */}
                        <div className="relative aspect-[3/4] group">
                            <div className="w-full h-full bg-center bg-cover rounded-xl border border-white/10 relative overflow-hidden" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA3dWaJ4XFsHKFlgv0O83VHcTlpRnXnbMPDv2lNuginVavU8UwtZ4H9kbq8u1woUeNNBx3z75IBKrf8MXo11-8O3YoeEHZ2yfggCr_1tECmbXkF2HscscIk4LmtaWwgu1QQvjXEAjj4wWtHKkf0-yoNff3Vb9_fx2lNp604n80kfd_9pl0ZuxLArTPMkBdT6dgzCdX--Y5Decy8Pn9RY6cNDVW2H7xcwTad2om5S_o6sZUVS2dYdETe3Zn4yl_wF-wJnaXS0Au8kN1o")' }}>
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                            </div>
                            <div className="absolute -bottom-2 -right-2">
                                <button className="size-8 bg-white dark:bg-[#2A2A2A] rounded-full flex items-center justify-center shadow-md border border-white/10 text-red-400 hover:text-red-500 hover:bg-white transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded text-[10px] font-bold uppercase tracking-wider text-white">
                                Principal
                            </div>
                        </div>
                        {/* Photo 2 */}
                        <div className="relative aspect-[3/4] group">
                            <div className="w-full h-full bg-center bg-cover rounded-xl border border-white/10 relative overflow-hidden" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBFIMEuo1FDPybQEoIdzWqN3umj3-Rn3GPjaIomdrWERTtUcGfpVkq-eLNgryYKmtr9DaRrktt80jw0JK8Ua1FRmtlUk5OkrEgpb4YUcRSBi_ZEUk_uswyr-UeSnzXTiPIERNRvAyMPcA7HTuKp3WThooywArE6nNXb4cnNrcdX_VHWfpxWTIZ4IwYjwF02B7ynzvxFbhNPfYD5UgVAanRmseyZfc6wcZE3C1vIBPsdVMr2Uhu_WCDTe-eegbrtOsGj3JagsAM2EdKy")' }}>
                            </div>
                            <div className="absolute -bottom-2 -right-2">
                                <button className="size-8 bg-white dark:bg-[#2A2A2A] rounded-full flex items-center justify-center shadow-md border border-white/10 text-red-400 hover:text-red-500 hover:bg-white transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                        </div>
                        {/* Photo 3 */}
                        <div className="relative aspect-[3/4] group">
                            <div className="w-full h-full bg-center bg-cover rounded-xl border border-white/10 relative overflow-hidden" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA5B2kplRqd2mM_-OXoqpMXkat1QD5q62qB4C7APkX6Fpteoc9jF4mpGlN250BuZdCYWEwgp20pmn4Z9KgKSjIYqhs8Dg-zGr1I7xi5jZG4qANFgbqrYd0bU3yD0nYcdPzFbh28cPNB0OhWi2qeaFbod4sK3JA82gFnJ-1xJ2u_4hb4q4KXgweMxJwS1Z-8AVfQs5C9QR6b8V0rlpL4QW4J1zO9Q4U7a2wXmKswLDjiqm3wXOWmEC0r4mkGgDjVSpEaQZxowa-uht6q")' }}>
                            </div>
                            <div className="absolute -bottom-2 -right-2">
                                <button className="size-8 bg-white dark:bg-[#2A2A2A] rounded-full flex items-center justify-center shadow-md border border-white/10 text-red-400 hover:text-red-500 hover:bg-white transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                        </div>
                        {/* Photo 4 */}
                        <div className="relative aspect-[3/4] group">
                            <div className="w-full h-full bg-center bg-cover rounded-xl border border-white/10 relative overflow-hidden" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDOmluovGGcNK04PpbZ8EuG3P9W5g_g47cL7ywkLKkn035B2CB5IWDHwSAXSKt6eeUvKYGlV5ieKpbjiPoWHnPP_HnGCg3t8l-GR-Mf7m2IBBC_xtNYExrsTXJLWoFv6zSb77qcai3XbmU6YKPykUgDmGIl1P7M6QO8a8zs_kh2w2P3ojtM25Z7A9u0MfUsB9_X4hEWaK_iop0dfHRJ2uNK7bT4ykefGMqa9U0ltWq3EHQpuXe9xVJWm6RUKHTjvIwt5kmGCztRdavK")' }}>
                            </div>
                            <div className="absolute -bottom-2 -right-2">
                                <button className="size-8 bg-white dark:bg-[#2A2A2A] rounded-full flex items-center justify-center shadow-md border border-white/10 text-red-400 hover:text-red-500 hover:bg-white transition-colors">
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                        </div>

                        {/* Empty Slots */}
                        <button className="relative aspect-[3/4] border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-white/5 transition-all group">
                            <span className="material-symbols-outlined text-white/40 group-hover:text-primary transition-colors text-[32px]">add_a_photo</span>
                        </button>
                        <button className="relative aspect-[3/4] border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-white/5 transition-all group">
                            <span className="material-symbols-outlined text-white/40 group-hover:text-primary transition-colors text-[32px]">add_a_photo</span>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">Toque e segure para reordenar</p>
                </section>

                {/* Divider */}
                <div className="h-px bg-white/10 mx-4 my-6"></div>

                {/* Details Section */}
                <section className="px-4 pb-8 flex flex-col gap-5">
                    <h3 className="text-xl font-bold leading-tight">Sobre mim</h3>

                    {/* Bio Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 ml-1">Bio</label>
                        <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600 resize-none h-32" placeholder="Escreva algo interessante sobre você..."></textarea>
                        <div className="flex justify-end">
                            <span className="text-xs text-gray-600">0/500</span>
                        </div>
                    </div>

                    {/* Job Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 ml-1">Profissão</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-[20px]">work</span>
                            <input className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600" type="text" defaultValue="Product Designer" />
                        </div>
                    </div>

                    {/* Education Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 ml-1">Formação</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 material-symbols-outlined text-[20px]">school</span>
                            <input className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600" placeholder="Adicionar formação" type="text" />
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-2 pt-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 ml-1">Básico</label>
                        <div className="flex flex-wrap gap-2">
                            <button className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm hover:border-primary/50 transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">height</span> 1.82m
                            </button>
                            <button className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm hover:border-primary/50 transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">wine_bar</span> Socialmente
                            </button>
                            <button className="px-4 py-2 rounded-full border border-dashed border-white/20 text-gray-500 text-sm hover:border-primary/50 hover:text-primary transition-colors flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">add</span> Adicionar mais
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}
