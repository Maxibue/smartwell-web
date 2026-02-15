/**
 * Jitsi Meet Integration Service
 * Handles video call room creation and configuration
 */

export interface JitsiConfig {
    roomName: string;
    displayName: string;
    email?: string;
    avatarUrl?: string;
    subject?: string;
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
}

/**
 * Generate a unique room name for an appointment
 */
export function generateRoomName(appointmentId: string, professionalId: string): string {
    // Create a unique, URL-safe room name
    const timestamp = Date.now();
    const hash = btoa(`${appointmentId}-${professionalId}-${timestamp}`).replace(/[^a-zA-Z0-9]/g, '');
    return `SmartWell-${hash.substring(0, 20)}`;
}

/**
 * Generate Jitsi Meet URL for an appointment
 */
export function generateJitsiUrl(roomName: string): string {
    const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
    return `https://${domain}/${roomName}`;
}

/**
 * Get Jitsi configuration for embedding
 */
export function getJitsiConfig(config: JitsiConfig): any {
    return {
        roomName: config.roomName,
        width: '100%',
        height: '100%',
        parentNode: undefined, // Will be set when mounting
        configOverwrite: {
            startWithAudioMuted: config.startWithAudioMuted ?? false,
            startWithVideoMuted: config.startWithVideoMuted ?? false,
            prejoinPageEnabled: true, // Enable pre-join page
            enableWelcomePage: false,
            enableClosePage: false,
            defaultLanguage: 'es',
            disableDeepLinking: true,
            toolbarButtons: [
                'microphone',
                'camera',
                'closedcaptions',
                'desktop',
                'fullscreen',
                'fodeviceselection',
                'hangup',
                'chat',
                'recording',
                'livestreaming',
                'etherpad',
                'sharedvideo',
                'settings',
                'raisehand',
                'videoquality',
                'filmstrip',
                'feedback',
                'stats',
                'shortcuts',
                'tileview',
                'videobackgroundblur',
                'download',
                'help',
                'mute-everyone',
            ],
        },
        interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: '',
            SHOW_POWERED_BY: false,
            DEFAULT_BACKGROUND: '#1a1a2e',
            DEFAULT_REMOTE_DISPLAY_NAME: 'Participante',
            DEFAULT_LOCAL_DISPLAY_NAME: 'Yo',
            MOBILE_APP_PROMO: false,
            TOOLBAR_ALWAYS_VISIBLE: false,
            SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
            FILM_STRIP_MAX_HEIGHT: 120,
            RECENT_LIST_ENABLED: false,
        },
        userInfo: {
            displayName: config.displayName,
            email: config.email,
        },
    };
}

/**
 * Check if a meeting should be accessible
 * (15 minutes before to 30 minutes after scheduled time)
 */
export function isMeetingAccessible(appointmentDate: string, appointmentTime: string): boolean {
    const now = new Date();

    // Parse appointment date and time
    const [year, month, day] = appointmentDate.split('-').map(Number);
    const [hours, minutes] = appointmentTime.split(':').map(Number);

    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

    // Allow access 15 minutes before
    const accessStartTime = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000);

    // Allow access up to 30 minutes after scheduled end (assuming 1 hour sessions)
    const accessEndTime = new Date(appointmentDateTime.getTime() + 90 * 60 * 1000);

    return now >= accessStartTime && now <= accessEndTime;
}

/**
 * Get time until meeting is accessible
 */
export function getTimeUntilMeeting(appointmentDate: string, appointmentTime: string): {
    accessible: boolean;
    minutesUntil?: number;
    message: string;
} {
    const now = new Date();

    const [year, month, day] = appointmentDate.split('-').map(Number);
    const [hours, minutes] = appointmentTime.split(':').map(Number);

    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
    const accessStartTime = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000);

    const minutesUntil = Math.floor((accessStartTime.getTime() - now.getTime()) / (60 * 1000));

    if (minutesUntil > 60) {
        const hoursUntil = Math.floor(minutesUntil / 60);
        return {
            accessible: false,
            minutesUntil,
            message: `La videollamada estará disponible ${hoursUntil} hora${hoursUntil > 1 ? 's' : ''} antes de tu sesión`,
        };
    } else if (minutesUntil > 0) {
        return {
            accessible: false,
            minutesUntil,
            message: `La videollamada estará disponible en ${minutesUntil} minuto${minutesUntil > 1 ? 's' : ''}`,
        };
    } else if (minutesUntil > -90) {
        return {
            accessible: true,
            message: 'La videollamada está disponible ahora',
        };
    } else {
        return {
            accessible: false,
            message: 'Esta sesión ya finalizó',
        };
    }
}
