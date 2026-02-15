/**
 * Custom React Hook for Real-time Notifications
 * Provides easy access to notifications state and actions
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    Notification,
    subscribeToNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from '@/lib/notifications';

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    // Subscribe to real-time notifications
    useEffect(() => {
        if (!user?.uid) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = subscribeToNotifications(
            user.uid,
            (newNotifications) => {
                setNotifications(newNotifications);
                const unread = newNotifications.filter(n => !n.read).length;
                setUnreadCount(unread);
                setLoading(false);
            }
        );

        return () => {
            unsubscribe();
        };
    }, [user?.uid]);

    // Mark a single notification as read
    const markAsRead = useCallback(async (notificationId: string) => {
        try {
            await markNotificationAsRead(notificationId);
            // The real-time listener will update the state automatically
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        if (!user?.uid) return;

        try {
            await markAllNotificationsAsRead(user.uid);
            // The real-time listener will update the state automatically
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, [user?.uid]);

    // Get only unread notifications
    const unreadNotifications = notifications.filter(n => !n.read);

    // Get recent notifications (last 10)
    const recentNotifications = notifications.slice(0, 10);

    return {
        notifications,
        unreadNotifications,
        recentNotifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
    };
}
