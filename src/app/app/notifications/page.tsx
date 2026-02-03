'use client';

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setNotifications(data);
            setLoading(false);

            // Mark all as read on open (simple logic for now)
            // Or we can mark individual on click.
            // Let's mark all as read for simplicity of "inbox zero" feeling
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
        };

        fetchNotifications();
    }, [supabase]);

    const handleClick = (n: any) => {
        if (n.data?.url) {
            router.push(n.data.url);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-background-light dark:bg-black">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-black text-slate-900 dark:text-white pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 sticky top-0 bg-background-light dark:bg-black z-10 border-b border-gray-100 dark:border-white/5">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">Notifications</h1>
            </div>

            <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-50 pb-20">
                        <span className="material-symbols-outlined text-4xl mb-2">notifications_off</span>
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => handleClick(n)}
                                className={`px-4 py-4 flex gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${n.type === 'match' ? 'bg-primary/20 text-primary' :
                                        n.type === 'system' ? 'bg-amber-500/20 text-amber-500' :
                                            'bg-gray-200 dark:bg-gray-800 text-gray-500'
                                    }`}>
                                    <span className="material-symbols-outlined text-xl">
                                        {n.type === 'match' ? 'favorite' :
                                            n.type === 'system' ? 'info' :
                                                n.type === 'verification' ? 'verified' : 'notifications'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h4 className={`text-sm mb-0.5 ${!n.is_read ? 'font-bold' : 'font-medium'}`}>{n.title}</h4>
                                    <p className="text-xs text-gray-500 leading-snug">{n.message}</p>
                                    <span className="text-[10px] text-gray-400 mt-2 block">
                                        {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {!n.is_read && (
                                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
