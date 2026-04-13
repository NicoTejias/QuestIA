import { useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { ProfilesAPI } from '../lib/api';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { requestNotificationPermission } from '../lib/firebase';
import { toast } from 'sonner';

export default function PushNotificationManager() {
    const { user } = useProfile();

    useEffect(() => {
        if (!user?.clerk_id) return;

        const setupNotifications = async () => {
            if (Capacitor.isNativePlatform()) {
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive !== 'granted') {
                    return;
                }

                await PushNotifications.register();

                PushNotifications.addListener('registration', (token) => {
                    ProfilesAPI.savePushToken(user.clerk_id, token.value).catch(() => {});
                });

                PushNotifications.addListener('registrationError', () => {
                    /* Silently ignore registration errors */
                });

                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    toast(notification.title, {
                        description: notification.body,
                    });
                });
            } else if ('Notification' in window) {
                try {
                    const token = await requestNotificationPermission();
                    if (token) {
                        ProfilesAPI.savePushToken(user.clerk_id, token).catch(() => {});
                    }
                } catch { /* Silently ignore notification permission errors */ }
            }
        };

        setupNotifications();

        return () => {
            if (Capacitor.isNativePlatform()) {
                PushNotifications.removeAllListeners();
            }
        };
    }, [user?.clerk_id]);

    return null;
}