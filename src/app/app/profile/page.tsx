'use client';

import Link from "next/link";
import AvatarUpload from "@/components/AvatarUpload";
import GalleryUpload from "@/components/GalleryUpload";

// ... inside ProfilePage component ...

const updateProfileAvatar = async (url: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: url })
            .eq('id', user.id);

        if (error) throw error;

        // Update local state
        setProfile((prev: any) => ({ ...prev, avatar_url: url }));
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile!');
    }
};

// ...

{/* Profile Info */ }
<div className="px-6 -mt-16 flex flex-col items-center">
    <AvatarUpload
        uid={profile?.id}
        url={profile?.avatar_url}
        onUpload={updateProfileAvatar}
        size={130}
    />

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

    {profile?.id && <GalleryUpload uid={profile.id} />}

    <div className="mt-8 w-full">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Settings</h3>

        <div className="flex flex-col gap-3">
            <Link href="/app/profile/edit" className="flex items-center justify-between w-full p-4 bg-white dark:bg-white/5 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <span className="material-symbols-outlined">edit</span>
                    </div>
                    <span className="font-medium">Edit Profile</span>
                </div>
                <span className="material-symbols-outlined text-gray-500">chevron_right</span>
            </Link>

            <Link href="/app/profile/discovery" className="flex items-center justify-between w-full p-4 bg-white dark:bg-white/5 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                        <span className="material-symbols-outlined">auto_awesome</span>
                    </div>
                    <span className="font-medium">Discovery Settings</span>
                </div>
                <span className="material-symbols-outlined text-gray-500">chevron_right</span>
            </Link>

            <button
                onClick={() => {
                    if (navigator.share) {
                        navigator.share({
                            title: 'VERO - Dating App',
                            text: 'Check out VERO, the new dating app!',
                            url: window.location.origin
                        }).catch(console.error);
                    } else {
                        navigator.clipboard.writeText(window.location.origin);
                        alert('Link copied to clipboard!');
                    }
                }}
                className="flex items-center justify-between w-full p-4 bg-gradient-to-r from-primary/10 to-green-500/10 rounded-2xl hover:bg-primary/20 transition-colors border border-primary/20"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg text-primary">
                        <span className="material-symbols-outlined">ios_share</span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-primary">Invite Friends</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Get Full Access</span>
                    </div>
                </div>
                <span className="material-symbols-outlined text-primary">arrow_forward</span>
            </button>
        </div>
    </div>
</div>
        </div >
    );
}
