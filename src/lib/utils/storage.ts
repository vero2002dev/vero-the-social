import { createServiceClient } from '@/lib/supabase/server';

/**
 * Generate signed URL for private storage files
 * Server-side only (uses service role)
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Upload file to storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<{ path: string } | { error: string }> {
  const supabase = createServiceClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading file:', error);
    return { error: error.message };
  }

  return { path: data.path };
}

/**
 * Delete file from storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ success: boolean }> {
  const supabase = createServiceClient();

  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    console.error('Error deleting file:', error);
    return { success: false };
  }

  return { success: true };
}
