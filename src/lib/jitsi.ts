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
    isModerator?: boolean; // Professional = moderator, patient = participant
}

/**
 * Room status lifecycle in Firestore (stored on the appointment document):
 *   "waiting"    → Professional has not opened the room yet
 *   "open"       → Professional opened the room, patients can join
 *   "in_progress"→ Session is underway (both sides connected)
 *   "ended"      → Session finished
 */
export type RoomStatus = 'waiting' | 'open' | 'in_progress' | 'ended';

/**
 * Generate a deterministic, unique room name for an appointment.
 * Using appointmentId only (no timestamp) so both sides derive the same name.
 */
export function generateRoomName(appointmentId: string): string {
    const encoded = btoa(`smartwell-${appointmentId}`)
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 24);
    return `SW-${encoded}`;
}

/**
 * Generate Jitsi Meet URL for an appointment
 */
export function generateJitsiUrl(roomName: string): string {
    const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
    return `https://${domain}/${roomName}`;
}

/**
 * Get Jitsi configuration for embedding.
 * Moderators (professionals) get extra controls; patients get a minimal toolbar.
 */
export function getJitsiConfig(config: JitsiConfig): any {
    const moderatorToolbar = [
        'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
        'fodeviceselection', 'hangup', 'chat', 'settings', 'raisehand',
        'videoquality', 'filmstrip', 'tileview', 'videobackgroundblur',
        'mute-everyone', 'security',
    ];

    const participantToolbar = [
        'microphone', 'camera', 'desktop', 'fullscreen',
        'fodeviceselection', 'hangup', 'chat', 'raisehand',
        'videoquality', 'filmstrip', 'videobackgroundblur',
    ];

    return {
        roomName: config.roomName,
        width: '100%',
        height: '100%',
        parentNode: undefined, // Set when mounting
        configOverwrite: {
            startWithAudioMuted: config.startWithAudioMuted ?? false,
            startWithVideoMuted: config.startWithVideoMuted ?? false,
            prejoinPageEnabled: false, // We handle our own pre-join
            enableWelcomePage: false,
            enableClosePage: false,
            defaultLanguage: 'es',
            disableDeepLinking: true,
            /**
             * Lobby mode: professionals skip lobby; patients wait until admitted.
             * In meet.jit.si public rooms, we simulate this via roomStatus in Firestore.
             */
            enableLobbyChat: false,
            toolbarButtons: config.isModerator ? moderatorToolbar : participantToolbar,
        },
        interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: '',
            SHOW_POWERED_BY: false,
            DEFAULT_BACKGROUND: '#0f172a',
            DEFAULT_REMOTE_DISPLAY_NAME: 'Participante',
            DEFAULT_LOCAL_DISPLAY_NAME: 'Yo',
            MOBILE_APP_PROMO: false,
            TOOLBAR_ALWAYS_VISIBLE: false,
            SETTINGS_SECTIONS: ['devices', 'language', 'profile'],
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
 * Check if a meeting window is open based on scheduled time.
 * Access window: 15 min before → duration + 30 min after.
 */
export function isMeetingTimeWindow(
    appointmentDate: string,
    appointmentTime: string,
    durationMinutes: number = 60,
): boolean {
    const now = new Date();
    const [year, month, day] = appointmentDate.split('-').map(Number);
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);

    const accessStartTime = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000);
    const accessEndTime = new Date(appointmentDateTime.getTime() + (durationMinutes + 30) * 60 * 1000);

    return now >= accessStartTime && now <= accessEndTime;
}

/** @deprecated Use isMeetingTimeWindow */
export function isMeetingAccessible(appointmentDate: string, appointmentTime: string): boolean {
    return isMeetingTimeWindow(appointmentDate, appointmentTime);
}

/**
 * Get time until meeting is accessible (for the countdown UI).
 */
export function getTimeUntilMeeting(
    appointmentDate: string,
    appointmentTime: string,
): {
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
            message: `La videollamada estará disponible en ${hoursUntil} hora${hoursUntil > 1 ? 's' : ''}`,
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
