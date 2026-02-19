"use client";

import { useEffect, useRef, useState } from 'react';
import { getJitsiConfig, JitsiConfig, generateJitsiUrl } from '@/lib/jitsi';
import { Loader2, Video, VideoOff, ExternalLink, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface JitsiMeetProps {
    config: JitsiConfig;
    onMeetingEnd?: () => void;
    onParticipantJoined?: (participant: any) => void;
    onParticipantLeft?: (participant: any) => void;
}

declare global {
    interface Window {
        JitsiMeetExternalAPI: any;
    }
}

/**
 * Detects browsers where Jitsi's External API (iframe) doesn't work properly:
 *  - iOS Safari (including Chrome/Firefox on iOS, all use WebKit)
 *  - WKWebView (React Native WebView, Capacitor, etc.)
 *  - Some Android WebView contexts
 * In these cases, we redirect to the Jitsi app / external browser instead.
 */
function detectMobileFallback(): { isMobile: boolean; isIOS: boolean; isAndroid: boolean } {
    if (typeof navigator === 'undefined') return { isMobile: false, isIOS: false, isAndroid: false };
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    // WebView detection
    const isWebView = /wv|WebView/.test(ua);
    const isMobile = isIOS || isAndroid || isWebView;
    return { isMobile, isIOS, isAndroid };
}

export default function JitsiMeet({
    config,
    onMeetingEnd,
    onParticipantJoined,
    onParticipantLeft,
}: JitsiMeetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [mobileFallback, setMobileFallback] = useState<{ isMobile: boolean; isIOS: boolean; isAndroid: boolean } | null>(null);

    // Detect mobile on mount (client-only)
    useEffect(() => {
        const result = detectMobileFallback();
        setMobileFallback(result);
    }, []);

    const meetingUrl = generateJitsiUrl(config.roomName);

    // ── Mobile Fallback UI ────────────────────────────────────────────────────
    // On iOS / Android, the Jitsi iframe has limited functionality.
    // Best UX is to redirect to the Jitsi Meet app or open in a new tab.
    if (mobileFallback?.isMobile) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] bg-gradient-to-br from-secondary/5 via-white to-primary/5 p-6">
                <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Smartphone className="h-8 w-8 text-primary" />
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-secondary mb-2">Unirse desde el móvil</h2>
                        <p className="text-text-secondary text-sm">
                            Para la mejor experiencia en móvil, te recomendamos abrir la videollamada en el navegador o en la app de Jitsi Meet.
                        </p>
                    </div>

                    {/* Primary: open in new tab */}
                    <a
                        href={meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                    >
                        <Button size="lg" className="w-full">
                            <Video className="h-5 w-5 mr-2" />
                            Abrir Videollamada
                            <ExternalLink className="h-4 w-4 ml-2 opacity-70" />
                        </Button>
                    </a>

                    {/* Secondary: deep-link to Jitsi app if installed */}
                    {mobileFallback.isIOS && (
                        <a
                            href={`org.jitsi.meet://${config.roomName}`}
                            className="block"
                        >
                            <Button variant="outline" size="lg" className="w-full">
                                <Smartphone className="h-4 w-4 mr-2" />
                                Abrir en App Jitsi Meet
                            </Button>
                        </a>
                    )}
                    {mobileFallback.isAndroid && (
                        <a
                            href={`intent://${process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si'}/${config.roomName}#Intent;scheme=org.jitsi.meet;package=org.jitsi.meet;end`}
                            className="block"
                        >
                            <Button variant="outline" size="lg" className="w-full">
                                <Smartphone className="h-4 w-4 mr-2" />
                                Abrir en App Jitsi Meet
                            </Button>
                        </a>
                    )}

                    <p className="text-xs text-text-muted">
                        Sala: <span className="font-mono">{config.roomName}</span>
                    </p>

                    {onMeetingEnd && (
                        <button
                            onClick={onMeetingEnd}
                            className="text-sm text-text-secondary underline hover:text-secondary transition-colors"
                        >
                            Finalizar sesión
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ── Desktop: Jitsi External API (iframe) ─────────────────────────────────
    // We only render this on desktop where the External API works reliably.

    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
        if (mobileFallback === null) return; // Wait for mobile detection
        if (mobileFallback.isMobile) return; // Don't init iframe on mobile

        const loadJitsiScript = () =>
            new Promise<void>((resolve, reject) => {
                if (window.JitsiMeetExternalAPI) { resolve(); return; }
                const script = document.createElement('script');
                script.src = 'https://meet.jit.si/external_api.js';
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'));
                document.body.appendChild(script);
            });

        const initializeJitsi = async () => {
            try {
                setLoading(true);
                setError(null);
                await loadJitsiScript();

                if (!containerRef.current) throw new Error('Container ref not available');

                const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
                const jitsiConfig = getJitsiConfig(config);
                jitsiConfig.parentNode = containerRef.current;

                const api = new window.JitsiMeetExternalAPI(domain, jitsiConfig);
                apiRef.current = api;

                api.addEventListener('videoConferenceJoined', () => setLoading(false));
                api.addEventListener('videoConferenceLeft', () => onMeetingEnd?.());
                api.addEventListener('participantJoined', (p: any) => onParticipantJoined?.(p));
                api.addEventListener('participantLeft', (p: any) => onParticipantLeft?.(p));
                api.addEventListener('readyToClose', () => onMeetingEnd?.());
            } catch (err: any) {
                console.error('Error initializing Jitsi:', err);
                setError(err.message || 'Error al cargar la videollamada');
                setLoading(false);
            }
        };

        initializeJitsi();

        return () => {
            if (apiRef.current) {
                apiRef.current.dispose();
                apiRef.current = null;
            }
        };
    }, [mobileFallback, config, onMeetingEnd, onParticipantJoined, onParticipantLeft]);

    // ── Error state ───────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-red-50 rounded-xl p-8 text-center">
                <VideoOff className="h-16 w-16 text-red-600 mb-4" />
                <h3 className="text-xl font-bold text-red-900 mb-2">Error al cargar videollamada</h3>
                <p className="text-red-700 mb-4">{error}</p>
                <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Intentar abrir en nueva pestaña
                    </Button>
                </a>
            </div>
        );
    }

    // ── Loading state (null = detecting mobile, false.isMobile = rendering iframe) ──
    if (mobileFallback === null) {
        return (
            <div className="flex items-center justify-center h-full min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // ── Desktop iframe ────────────────────────────────────────────────────────
    return (
        <div className="relative w-full h-full" style={{ minHeight: 'min(600px, 80vh)' }}>
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl z-10">
                    <Video className="h-16 w-16 text-primary mb-4 animate-pulse" />
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-secondary font-medium">Conectando a la videollamada...</p>
                </div>
            )}
            <div
                ref={containerRef}
                className="w-full h-full rounded-xl overflow-hidden"
            />
        </div>
    );
}
