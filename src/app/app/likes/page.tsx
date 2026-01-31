'use client';

export default function LikesPage() {
    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-black text-slate-900 dark:text-white px-6 pt-12">
            <h1 className="text-2xl font-bold mb-6">Likes You</h1>

            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                <div className="w-20 h-20 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20">
                    <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </div>
                <h3 className="text-lg font-bold mb-2">See who likes you</h3>
                <p className="text-sm max-w-[200px] leading-relaxed">
                    Upgrade to Gold to see people who have already swiped right on you.
                </p>
            </div>
        </div>
    );
}
