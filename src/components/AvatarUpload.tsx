'use client';

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface AvatarUploadProps {
    uid: string;
    url: string | null;
    onUpload: (url: string) => void;
    size?: number;
}

export default function AvatarUpload({ uid, url, onUpload, size = 150 }: AvatarUploadProps) {
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();

    const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${uid}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`; // root of bucket or folder? policy uses user id as folder usually.
            // Wait, storage policy in `storage_policies.sql` check:
            // (storage.foldername(name))[1] = auth.uid()::text
            // This means file MUST be in folder named {uid}

            const storagePath = `${uid}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(storagePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get Public URL
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(storagePath);

            onUpload(data.publicUrl);
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error uploading avatar!');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                className="relative rounded-full overflow-hidden border-4 border-background-light dark:border-white/10 shadow-xl bg-gray-800 group cursor-pointer"
                style={{ height: size, width: size }}
            >
                {url ? (
                    <img
                        src={url}
                        alt="Avatar"
                        className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-75"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400">
                        <span className="material-symbols-outlined text-4xl">person</span>
                    </div>
                )}

                {/* Loading Overlay */}
                {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Upload Input overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <div className="bg-black/50 p-2 rounded-full backdrop-blur-sm">
                        <span className="material-symbols-outlined text-white">photo_camera</span>
                    </div>
                </div>

                <input
                    type="file"
                    id="single"
                    accept="image/*"
                    onChange={uploadAvatar}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                />
            </div>

        </div>
    );
}
