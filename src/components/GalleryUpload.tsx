'use client';

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

interface GalleryPhoto {
    id: string;
    url: string;
    status: 'pending_review' | 'approved' | 'rejected';
}

interface GalleryUploadProps {
    uid: string;
}

export default function GalleryUpload({ uid }: GalleryUploadProps) {
    const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        fetchPhotos();
    }, [uid]);

    const fetchPhotos = async () => {
        const { data } = await supabase
            .from('gallery_photos')
            .select('*')
            .eq('owner_id', uid)
            .order('created_at', { ascending: false });

        if (data) setPhotos(data);
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) return;

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${uid}-${Math.random()}.${fileExt}`;
            const storagePath = `${uid}/${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('gallery')
                .upload(storagePath, file);

            if (uploadError) throw uploadError;

            const { data: publicURL } = supabase.storage
                .from('gallery')
                .getPublicUrl(storagePath);

            // 2. Insert into DB
            const { error: dbError } = await supabase
                .from('gallery_photos')
                .insert({
                    owner_id: uid,
                    url: publicURL.publicUrl,
                    status: 'approved' // Auto-approve for MVP/Demo
                });

            if (dbError) throw dbError;

            await fetchPhotos(); // Refresh list

        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Error uploading photo');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (photoId: string, url: string) => {
        if (!confirm('Delete this photo?')) return;

        try {
            // 1. Delete from DB
            await supabase.from('gallery_photos').delete().eq('id', photoId);

            // 2. Ideally delete from storage too, but keeping it simple for now
            setPhotos(prev => prev.filter(p => p.id !== photoId));
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    return (
        <div className="w-full mt-6 px-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Gallery</h3>

            <div className="grid grid-cols-3 gap-3">
                {/* Existing Photos */}
                {photos.map((photo) => (
                    <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden group bg-gray-800">
                        <img src={photo.url} className="w-full h-full object-cover" />
                        <button
                            onClick={() => handleDelete(photo.id, photo.url)}
                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                ))}

                {/* Upload Button */}
                {photos.length < 6 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-700 hover:border-primary flex flex-col items-center justify-center cursor-pointer transition-colors bg-white/5 hover:bg-white/10 relative">
                        {uploading ? (
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-gray-500 mb-1">add_a_photo</span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase">Add</span>
                            </>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                    </label>
                )}
            </div>
        </div>
    );
}
