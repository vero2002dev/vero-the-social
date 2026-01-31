'use client';

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile(data);
            }
            setLoading(false);
        };
        fetchProfile();
    }, [router, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
        router.refresh();
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center text-gray-500">Loading profile...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-black text-slate-900 dark:text-white pb-24 overflow-y-auto">
            {/* Header / Cover */}
            <div className="relative h-48 w-full bg-gradient-to-b from-primary/20 to-transparent">
                <button
                    onClick={handleLogout}
                    className="absolute top-4 right-4 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold text-white hover:bg-red-500/80 transition-colors"
                >
                    LOGOUT
                </button>
            </div>

            {/* Profile Info */}
            <div className="px-6 -mt-16 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-background-light dark:border-black overflow-hidden relative shadow-xl">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-500">
                            <span className="material-symbols-outlined text-4xl">person</span>
                        </div>
                    )}
                </div>

                <h1 className="mt-4 text-2xl font-bold">
                    {profile?.profile_type === 'couple' ? profile.couple_name : profile?.display_name || 'Anonymous'}
                </h1>

                <div className="flex items-center gap-2 mt-1 text-primary font-medium text-sm">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <span>{profile?.verification_status === 'verified' ? 'Verified Member' : 'Unverified'}</span>
                </div>

                <div className="mt-6 w-full flex justify-around border-y border-gray-100 dark:border-white/5 py-4">
                    <div className="text-center">
                        <span className="block text-lg font-bold">0</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Matches</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-lg font-bold">0</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Likes</span>
                    </div>
                    <div className="text-center">
                        <span className="block text-lg font-bold">0</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Views</span>
                    </div>
                </div>

                <div className="mt-8 w-full">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Settings</h3>

                    <div className="flex flex-col gap-3">
                        <button className="flex items-center justify-between w-full p-4 bg-white dark:bg-white/5 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                    <span className="material-symbols-outlined">edit</span>
                                </div>
                                <span className="font-medium">Edit Profile</span>
                            </div>
                            <span className="material-symbols-outlined text-gray-500">chevron_right</span>
                        </button>

                        <button className="flex items-center justify-between w-full p-4 bg-white dark:bg-white/5 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                </div>
                                <span className="font-medium">Discovery Settings</span>
                            </div>
                            <span className="material-symbols-outlined text-gray-500">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
