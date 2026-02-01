'use client';

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DiscoverySettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState({
        show_singles: true,
        show_couples: true,
        max_distance: 50
    });

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const fetchSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('preferences')
                .eq('id', user.id)
                .single();

            if (data?.preferences) {
                // Merge defaults with saved data
                setPreferences(prev => ({ ...prev, ...data.preferences }));
            }
            setLoading(false);
        };
        fetchSettings();
    }, [router, supabase]);

    const handleToggle = (key: 'show_singles' | 'show_couples') => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPreferences(prev => ({ ...prev, max_distance: parseInt(e.target.value) }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('profiles')
                .update({ preferences: preferences })
                .eq('id', user.id);

            if (error) throw error;
            router.back();
            router.refresh();
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="flex flex-col h-full bg-background-light dark:bg-black text-slate-900 dark:text-white pb-24">

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 sticky top-0 bg-background-light dark:bg-black z-10 border-b border-gray-100 dark:border-white/5">
                <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-500">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">Discovery Settings</h1>
            </div>

            <div className="flex flex-col gap-6 px-6 py-8">

                {/* Section: Show Me */}
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Show Me</h3>
                    <div className="flex flex-col gap-3">

                        <div className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark rounded-xl">
                            <span className="font-medium">Singles</span>
                            <button
                                onClick={() => handleToggle('show_singles')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${preferences.show_singles ? 'bg-primary' : 'bg-gray-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${preferences.show_singles ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark rounded-xl">
                            <span className="font-medium">Couples</span>
                            <button
                                onClick={() => handleToggle('show_couples')}
                                className={`w-12 h-6 rounded-full transition-colors relative ${preferences.show_couples ? 'bg-primary' : 'bg-gray-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${preferences.show_couples ? 'left-7' : 'left-1'}`}></div>
                            </button>
                        </div>

                    </div>
                </div>

                {/* Section: Distance */}
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Maximum Distance</h3>
                    <div className="p-6 bg-surface-light dark:bg-surface-dark rounded-xl">
                        <div className="flex justify-between mb-4">
                            <span className="font-medium">Distance</span>
                            <span className="font-bold text-primary">{preferences.max_distance} km</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="100"
                            value={preferences.max_distance}
                            onChange={handleRangeChange}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                </div>

                <div className="mt-8">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-primary text-white font-bold py-4 rounded-full shadow-lg hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Apply Changes'}
                    </button>
                </div>

            </div>
        </div>
    );
}
