/**
 * Notifications Dropdown Component
 * Displays real-time notifications with badge and dropdown menu
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Calendar, AlertCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { Notification } from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import { differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export function NotificationsDropdown() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        recentNotifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        // Navigate to action URL if exists
        if (notification.actionUrl) {
            router.push(notification.actionUrl);
        }

        // Close dropdown
        setIsOpen(false);
    };

    const handleMarkAllAsRead = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await markAllAsRead();
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'appointment_booked':
                return <Calendar className="h-5 w-5 text-blue-600" />;
            case 'appointment_confirmed':
                return <Check className="h-5 w-5 text-green-600" />;
            case 'appointment_cancelled':
                return <X className="h-5 w-5 text-red-600" />;
            case 'appointment_rescheduled':
                return <Calendar className="h-5 w-5 text-orange-600" />;
            case 'appointment_reminder':
                return <AlertCircle className="h-5 w-5 text-yellow-600" />;
            default:
                return <Bell className="h-5 w-5 text-gray-600" />;
        }
    };

    const formatNotificationTime = (timestamp: any) => {
        if (!timestamp) return '';

        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();

            const minutes = differenceInMinutes(now, date);
            const hours = differenceInHours(now, date);
            const days = differenceInDays(now, date);

            if (minutes < 1) return 'Justo ahora';
            if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
            if (hours < 24) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
            if (days < 7) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
            if (days < 30) {
                const weeks = Math.floor(days / 7);
                return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
            }
            const months = Math.floor(days / 30);
            return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
        } catch (error) {
            return '';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon with Badge */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-text-secondary hover:text-primary transition-colors rounded-lg hover:bg-neutral-50"
                aria-label="Notificaciones"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-neutral-100 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-neutral-100 bg-gradient-to-r from-primary/5 to-secondary/5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-secondary">
                                Notificaciones
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="text-sm text-primary hover:text-primary-active font-medium flex items-center gap-1 transition-colors"
                                >
                                    <CheckCheck className="h-4 w-4" />
                                    Marcar todas como leídas
                                </button>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <p className="text-sm text-text-muted mt-1">
                                Tenés {unreadCount} {unreadCount === 1 ? 'notificación nueva' : 'notificaciones nuevas'}
                            </p>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-[500px] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="text-text-muted mt-2">Cargando notificaciones...</p>
                            </div>
                        ) : recentNotifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                                <p className="text-text-muted font-medium">No tenés notificaciones</p>
                                <p className="text-sm text-text-muted mt-1">
                                    Te avisaremos cuando haya novedades
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-neutral-100">
                                {recentNotifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`w-full p-4 text-left hover:bg-neutral-50 transition-colors ${!notification.read ? 'bg-blue-50/50' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            {/* Icon */}
                                            <div className="flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`font-semibold text-sm ${!notification.read ? 'text-secondary' : 'text-text-secondary'
                                                        }`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.read && (
                                                        <span className="flex-shrink-0 h-2 w-2 bg-primary rounded-full mt-1"></span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-text-muted mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-text-muted mt-2">
                                                    {formatNotificationTime(notification.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {recentNotifications.length > 0 && (
                        <div className="p-3 border-t border-neutral-100 bg-neutral-50">
                            <button
                                onClick={() => {
                                    router.push('/notificaciones');
                                    setIsOpen(false);
                                }}
                                className="w-full text-center text-sm text-primary hover:text-primary-active font-medium transition-colors"
                            >
                                Ver todas las notificaciones
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
