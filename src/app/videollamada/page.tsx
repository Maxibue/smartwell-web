"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import JitsiMeet from '@/components/JitsiMeet';
import WaitingRoom from '@/components/WaitingRoom';
import { isMeetingAccessible } from '@/lib/jitsi';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface Appointment {
    id: string;
    userId: string;
    professionalId: string;
    date: string;
    time: string;
    duration: number;
    status: string;
    professionalName: string;
    professionalTitle?: string;
    meetingRoomName?: string;
}

export default function VideoCallPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const appointmentId = searchParams.get('appointment');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userDisplayName, setUserDisplayName] = useState<string>('Usuario');
    const [inMeeting, setInMeeting] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/login?redirect=/videollamada');
            } else {
                setUserId(user.uid);

                // Get user display name
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserDisplayName(userData.displayName || userData.email || 'Usuario');
                }
            }
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (appointmentId && userId) {
            loadAppointment();
        }
    }, [appointmentId, userId]);

    const loadAppointment = async () => {
        if (!appointmentId || !userId) return;

        try {
            setLoading(true);
            setError(null);

            const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));

            if (!appointmentDoc.exists()) {
                setError('Turno no encontrado');
                setLoading(false);
                return;
            }

            const data = appointmentDoc.data();

            // Verify user has access to this appointment
            if (data.userId !== userId && data.professionalId !== userId) {
                setError('No tenés permiso para acceder a esta videollamada');
                setLoading(false);
                return;
            }

            setAppointment({
                id: appointmentDoc.id,
                ...data,
            } as Appointment);

        } catch (error) {
            console.error('Error loading appointment:', error);
            setError('Error al cargar la información del turno');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinMeeting = () => {
        if (!appointment) return;

        if (isMeetingAccessible(appointment.date, appointment.time)) {
            setInMeeting(true);
        } else {
            alert('La videollamada aún no está disponible');
        }
    };

    const handleMeetingEnd = () => {
        setInMeeting(false);
        router.push('/panel-usuario/turnos');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-text-secondary">Cargando videollamada...</p>
                </div>
            </div>
        );
    }

    if (error || !appointment) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-secondary mb-2">Error</h2>
                    <p className="text-text-secondary mb-6">
                        {error || 'No se pudo cargar la información del turno'}
                    </p>
                    <Link href="/panel-usuario/turnos">
                        <Button>Volver a Mis Turnos</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (inMeeting && appointment.meetingRoomName) {
        return (
            <div className="h-screen w-full bg-neutral-900">
                <JitsiMeet
                    config={{
                        roomName: appointment.meetingRoomName,
                        displayName: userDisplayName,
                        email: auth.currentUser?.email || undefined,
                        subject: `Sesión con ${appointment.professionalName}`,
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                    }}
                    onMeetingEnd={handleMeetingEnd}
                />
            </div>
        );
    }

    return (
        <WaitingRoom
            appointmentDate={appointment.date}
            appointmentTime={appointment.time}
            professionalName={appointment.professionalName}
            professionalTitle={appointment.professionalTitle || 'Lic.'}
            duration={appointment.duration}
            onJoinMeeting={handleJoinMeeting}
        />
    );
}
