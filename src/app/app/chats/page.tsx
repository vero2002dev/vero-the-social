'use client';

export default function ChatsPage() {
    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-black text-slate-900 dark:text-white px-6 pt-12">
            <h1 className="text-2xl font-bold mb-6">Messages</h1>

            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
                <div className="w-24 h-24 bg-surface-light dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-4xl">chat_bubble_outline</span>
                </div>
                <h3 className="text-lg font-bold mb-1">No matches yet</h3>
                <p className="text-sm">Start swiping to find your vibe.</p>
            </div>
        </div>
    );
}
