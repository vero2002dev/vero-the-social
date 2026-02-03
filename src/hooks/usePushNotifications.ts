import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const subscribeUser = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push messaging is not supported');
            return;
        }

        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;

            // Use Public Key from Env (or temporary placeholder for dev)
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                console.error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");
                alert("Push configuration missing");
                return;
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            // Save to Database
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            // Serialize
            const subJson = JSON.parse(JSON.stringify(subscription));

            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    endpoint: subJson.endpoint,
                    p256dh: subJson.keys.p256dh,
                    auth: subJson.keys.auth,
                    user_agent: navigator.userAgent
                }, { onConflict: 'endpoint' });

            if (error) throw error;

            setPermission('granted');
            alert("Notifications enabled!");

        } catch (error) {
            console.error('Failed to subscribe:', error);
            alert('Failed to enable notifications.');
        } finally {
            setLoading(false);
        }
    };

    return { permission, subscribeUser, loading };
}
