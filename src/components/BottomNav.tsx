'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 w-full max-w-md bg-surface-dark/95 backdrop-blur-xl border-t border-white/5 px-6 pb-6 pt-3 z-40 left-0 right-0 mx-auto">
            <div className="flex justify-between items-center">
                <Link href="/app/explore" className={`flex flex-col items-center justify-center gap-1 group transition-colors ${isActive('/app/explore') ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}>
                    <span className={`material-symbols-outlined text-2xl group-hover:scale-110 transition-transform ${isActive('/app/explore') ? 'fill-current' : ''}`} style={isActive('/app/explore') ? { fontVariationSettings: "'FILL' 1" } : {}}>style</span>
                    <span className="text-[10px] font-semibold tracking-wide uppercase">Explore</span>
                </Link>

                <Link href="/app/likes" className={`flex flex-col items-center justify-center gap-1 group transition-colors ${isActive('/app/likes') ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}>
                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">favorite</span>
                    <span className="text-[10px] font-medium tracking-wide uppercase">Likes</span>
                </Link>

                <Link href="/app/chats" className={`flex flex-col items-center justify-center gap-1 group transition-colors ${isActive('/app/chats') ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}>
                    <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">chat_bubble</span>
                    <span className="text-[10px] font-medium tracking-wide uppercase">Messages</span>
                </Link>

                <Link href="/app/profile" className={`flex flex-col items-center justify-center gap-1 group transition-colors ${isActive('/app/profile') ? 'text-primary' : 'text-gray-500 hover:text-gray-300'}`}>
                    <div className="relative">
                        <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">person</span>
                        <span className="absolute -top-0.5 -right-0.5 size-2 bg-primary rounded-full border border-surface-dark"></span>
                    </div>
                    <span className="text-[10px] font-medium tracking-wide uppercase">Profile</span>
                </Link>
            </div>
        </nav>
    );
}
