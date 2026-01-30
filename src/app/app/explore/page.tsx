'use client';

export default function ExplorePage() {
    return (
        <>
            {/* Header */}
            <header className="flex items-center justify-between px-4 pt-12 pb-4 z-20">
                <button className="flex size-10 items-center justify-center rounded-full bg-surface-accent/50 backdrop-blur-sm text-white hover:bg-surface-accent transition-colors">
                    <span className="material-symbols-outlined text-xl">tune</span>
                </button>
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                    <h1 className="text-lg font-bold tracking-wide text-white">PRESENCE</h1>
                </div>
                <button className="relative flex size-10 items-center justify-center rounded-full bg-surface-accent/50 backdrop-blur-sm text-white hover:bg-surface-accent transition-colors">
                    <span className="material-symbols-outlined text-xl">notifications</span>
                    <span className="absolute top-2 right-2 size-2 rounded-full bg-primary ring-2 ring-background-dark"></span>
                </button>
            </header>

            {/* Main Content (Swipe Card) */}
            <main className="flex-1 relative flex flex-col justify-center px-4 pb-24 pt-2 w-full">
                <div className="relative w-full h-full flex flex-col rounded-xl overflow-hidden shadow-2xl bg-surface-dark group">

                    {/* Background Image */}
                    <div className="absolute inset-0 w-full h-full">
                        {/* Note: In production use Next.js Image */}
                        <div
                            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAVQJe31soocgk8B8uXPodKOVpkmec6bTJXlny1XpqMT59kcSbw46e-nmq5GGXRf0OkVkm7NfJsMNTRR29b6g1DXoqajHYg22lH04H_JFavrM2HY6wvu9mCvH3G-loLUcvW7bKm0HNnsPtIoVTwBHj48XMWOI9xzlAqd-RDYBTqSLAtVuW0TdDv7bc-42zpvdoVK0AWI2Ot9_fWDXjznWNWiGzsv36cTjdQTHLs5UV0_MTnd96OyVskpcx7hlj9pJq--w_hVQtgtUNq')" }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark/95 via-background-dark/40 to-transparent opacity-80"></div>
                    </div>

                    {/* Card Content Overlay */}
                    <div className="relative z-10 flex h-full flex-col justify-end p-6">

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            <div className="flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/30 px-3 py-1.5 backdrop-blur-md">
                                <span className="material-symbols-outlined text-primary text-[16px]">group</span>
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">Dynamics: 2→1</span>
                            </div>
                            <div className="flex items-center gap-1.5 rounded-full bg-surface-accent/60 border border-white/10 px-3 py-1.5 backdrop-blur-md">
                                <span className="material-symbols-outlined text-white text-[16px]">explore</span>
                                <span className="text-xs font-medium text-white">Intent: Exploration</span>
                            </div>
                        </div>

                        {/* Profile Info */}
                        <div className="mb-4">
                            <div className="flex items-end gap-2 mb-1">
                                <h2 className="text-3xl font-bold text-white leading-tight">Mila <span className="text-2xl font-medium text-gray-300">26</span> <span className="text-primary">&</span> Leo <span className="text-2xl font-medium text-gray-300">29</span></h2>
                                <span className="material-symbols-outlined text-primary mb-1.5" style={{ fontVariationSettings: "'FILL' 1" }} title="Verified">verified</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-300 text-sm mb-3">
                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                <span>3 km away</span>
                            </div>
                            <p className="text-gray-200 text-base font-medium leading-relaxed line-clamp-2">
                                Curious couple looking for a third to join our weekend adventures. We love art galleries, techno, and deep conversations.
                            </p>
                        </div>

                        {/* Story Progress Indicators */}
                        <div className="absolute top-4 left-0 right-0 flex gap-1 px-4">
                            <div className="h-1 flex-1 rounded-full bg-white shadow-sm"></div>
                            <div className="h-1 flex-1 rounded-full bg-white/30"></div>
                            <div className="h-1 flex-1 rounded-full bg-white/30"></div>
                        </div>

                        {/* Tappable Areas for Navigation */}
                        <div aria-label="Previous photo" className="absolute inset-y-0 left-0 w-1/4 z-20"></div>
                        <div aria-label="Next photo" className="absolute inset-y-0 right-0 w-1/4 z-20"></div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="absolute bottom-6 left-0 right-0 px-6 flex items-center justify-center gap-6 z-30">
                    <button className="flex size-16 items-center justify-center rounded-full bg-surface-accent/80 border border-white/10 text-white shadow-lg backdrop-blur-md transition-transform active:scale-95 hover:bg-surface-accent">
                        <span className="material-symbols-outlined text-3xl">close</span>
                        <span className="sr-only">Passar</span>
                    </button>

                    <button className="flex h-16 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-white shadow-[0_0_20px_rgba(84,155,140,0.4)] transition-transform active:scale-95 hover:bg-[#468275]">
                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                        <span className="text-lg font-bold tracking-wide">CONECTAR</span>
                    </button>

                    <button className="flex size-12 items-center justify-center rounded-full bg-surface-accent/40 border border-white/5 text-gray-300 backdrop-blur-md transition-transform active:scale-95 hover:text-primary">
                        <span className="material-symbols-outlined text-2xl">bookmark</span>
                    </button>
                </div>
            </main>
        </>
    );
}
