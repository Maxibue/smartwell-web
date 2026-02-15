"use client";

import { useEffect, useRef, useState } from 'react';
import { getJitsiConfig, JitsiConfig } from '@/lib/jitsi';
import { Loader2, Video, VideoOff } from 'lucide-react';

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

export default function JitsiMeet({
    config,
    onMeetingEnd,
    onParticipantJoined,
    onParticipantLeft
}: JitsiMeetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Load Jitsi Meet External API script
        const loadJitsiScript = () => {
            return new Promise((resolve, reject) => {
                if (window.JitsiMeetExternalAPI) {
                    resolve(window.JitsiMeetExternalAPI);
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://meet.jit.si/external_api.js';
                script.async = true;
                script.onload = () => resolve(window.JitsiMeetExternalAPI);
                script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'));
                document.body.appendChild(script);
            });
        };

        const initializeJitsi = async () => {
            try {
                setLoading(true);
                setError(null);

                await loadJitsiScript();

                if (!containerRef.current) {
                    throw new Error('Container ref not available');
                }

                const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si';
                const jitsiConfig = getJitsiConfig(config);
                jitsiConfig.parentNode = containerRef.current;

                // Initialize Jitsi Meet
                const api = new window.JitsiMeetExternalAPI(domain, jitsiConfig);
                apiRef.current = api;

                // Event listeners
                api.addEventListener('videoConferenceJoined', () => {
                    setLoading(false);
                    console.log('Joined video conference');
                });

                api.addEventListener('videoConferenceLeft', () => {
                    console.log('Left video conference');
                    onMeetingEnd?.();
                });

                api.addEventListener('participantJoined', (participant: any) => {
                    console.log('Participant joined:', participant);
                    onParticipantJoined?.(participant);
                });

                api.addEventListener('participantLeft', (participant: any) => {
                    console.log('Participant left:', participant);
                    onParticipantLeft?.(participant);
                });

                api.addEventListener('readyToClose', () => {
                    console.log('Ready to close');
                    onMeetingEnd?.();
                });

            } catch (err: any) {
                console.error('Error initializing Jitsi:', err);
                setError(err.message || 'Error al cargar la videollamada');
                setLoading(false);
            }
        };

        initializeJitsi();

        // Cleanup
        return () => {
            if (apiRef.current) {
                apiRef.current.dispose();
                apiRef.current = null;
            }
        };
    }, [config, onMeetingEnd, onParticipantJoined, onParticipantLeft]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-red-50 rounded-xl p-8">
                <VideoOff className="h-16 w-16 text-red-600 mb-4" />
                <h3 className="text-xl font-bold text-red-900 mb-2">Error al cargar videollamada</h3>
                <p className="text-red-700 text-center">{error}</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary-dark/10 rounded-xl z-10">
                    <Video className="h-16 w-16 text-primary mb-4 animate-pulse" />
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p className="text-secondary font-medium">Conectando a la videollamada...</p>
                </div>
            )}
            <div
                ref={containerRef}
                className="w-full h-full rounded-xl overflow-hidden"
                style={{ minHeight: '600px' }}
            />
        </div>
    );
}
