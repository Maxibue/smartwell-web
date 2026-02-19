"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import JitsiMeet from '@/components/JitsiMeet';
import WaitingRoom from '@/components/WaitingRoom';
import { generateRoomName, isMeetingTimeWindow } from '@/lib/jitsi';
import type { RoomStatus } from '@/lib/jitsi';
import {
    Loader2, AlertCircle, ShieldX, Video, Clock,
    CheckCircle2, XCircle,
} from 'lucide-react';
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
    paymentStatus?: string;
    professionalName: string;
    professionalTitle?: string;
    meetingRoomName?: string;
    roomStatus?: RoomStatus;
}

type UserRole = 'professional' | 'patient' | null;

// ─────────────────────────────────────────────────────────────────────────────
// Professional Control Panel
// ─────────────────────────────────────────────────────────────────────────────
function ProfessionalLobby({
    appointment,
    onOpenRoom,
    onEndRoom,
    onJoinMeeting,
}: {
    appointment: Appointment;
    onOpenRoom: () => Promise<void>;
    onEndRoom: () => Promise<void>;
    onJoinMeeting: () => void;
}) {
    const [opening, setOpening] = useState(false);
    const [ending, setEnding] = useState(false);
    const roomStatus = appointment.roomStatus ?? 'waiting';
    const inTimeWindow = isMeetingTimeWindow(appointment.date, appointment.time, appointment.duration);

    const formattedDate = (() => {
        const [y, m, d] = appointment.date.split('-').map(Number);
        return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
            weekday: 'long', day: 'numeric', month: 'long',
        });
    })();

    const handleOpen = async () => {
        setOpening(true);
        try { await onOpenRoom(); } finally { setOpening(false); }
    };
    const handleEnd = async () => {
        setEnding(true);
        try { await onEndRoom(); } finally { setEnding(false); }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-white to-primary/5 flex items-center justify-center p-4">
            <div className="max-w-xl w-full space-y-6">

                <div className="bg-white rounded-2xl shadow-lg border border-neutral-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-secondary to-secondary/80 p-5 md:p-6 text-white">
                        <div className="flex items-center gap-3 mb-1">
                            <Video className="h-5 w-5 md:h-6 md:w-6" />
                            <h1 className="text-lg md:text-xl font-bold">Control de Sala · Profesional</h1>
                        </div>
                        <p className="text-white/70 text-sm">Solo vos podés abrir y cerrar esta sala</p>
                    </div>

                    <div className="p-5 md:p-6 space-y-4">
                        {/* Appointment summary */}
                        <div className="bg-neutral-50 rounded-xl p-4 space-y-2 text-sm">
                            <div className="flex justify-between gap-2">
                                <span className="text-text-secondary">Fecha</span>
                                <span className="font-semibold text-secondary capitalize text-right">{formattedDate}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-secondary">Hora</span>
                                <span className="font-semibold text-secondary">{appointment.time} ({appointment.duration} min)</span>
                            </div>
                        </div>

                        {/* Room status badge */}
                        <div className={`rounded-xl p-4 text-center border-2 ${roomStatus === 'open' ? 'bg-green-50 border-green-300' :
                                roomStatus === 'ended' ? 'bg-neutral-50 border-neutral-200' :
                                    'bg-amber-50 border-amber-200'
                            }`}>
                            <p className="font-bold text-secondary text-sm mb-1">
                                Estado de la sala:{' '}
                                <span className={
                                    roomStatus === 'open' ? 'text-green-700' :
                                        roomStatus === 'ended' ? 'text-neutral-500' :
                                            'text-amber-700'
                                }>
                                    {roomStatus === 'waiting' && 'Cerrada · esperando'}
                                    {roomStatus === 'open' && 'Abierta ✓'}
                                    {roomStatus === 'in_progress' && 'En curso'}
                                    {roomStatus === 'ended' && 'Finalizada'}
                                </span>
                            </p>
                            <p className="text-text-secondary text-xs">
                                {roomStatus === 'open'
                                    ? 'El paciente ya puede unirse. Podés ingresar a la videollamada.'
                                    : roomStatus === 'ended'
                                        ? 'La sesión fue cerrada. No se puede reabrir.'
                                        : 'El paciente está esperando en la sala de espera virtual.'}
                            </p>
                        </div>

                        {/* Time window warning */}
                        {!inTimeWindow && roomStatus === 'waiting' && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                                <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>
                                    La sala se puede abrir 15 minutos antes del horario programado ({appointment.time}).
                                    Fuera de ese rango, el botón estará bloqueado.
                                </span>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            {roomStatus === 'waiting' && (
                                <Button
                                    onClick={handleOpen}
                                    disabled={opening || !inTimeWindow}
                                    size="lg"
                                    className="w-full h-14 text-base"
                                >
                                    {opening
                                        ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Abriendo sala...</>
                                        : <><CheckCircle2 className="h-5 w-5 mr-2" />Abrir Sala y Admitir al Paciente</>
                                    }
                                </Button>
                            )}

                            {roomStatus === 'open' && (
                                <>
                                    <Button onClick={onJoinMeeting} size="lg" className="w-full h-14 text-base">
                                        <Video className="h-5 w-5 mr-2" />Ingresar a la Videollamada
                                    </Button>
                                    <Button
                                        onClick={handleEnd}
                                        disabled={ending}
                                        variant="outline"
                                        size="lg"
                                        className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                        {ending
                                            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Cerrando...</>
                                            : <><XCircle className="h-5 w-5 mr-2" />Cerrar Sala</>
                                        }
                                    </Button>
                                </>
                            )}

                            {roomStatus === 'ended' && (
                                <p className="text-center text-text-secondary text-sm">
                                    La sesión ha finalizado.{' '}
                                    <Link href="/panel-profesional/turnos" className="text-primary hover:underline">
                                        Volver al panel
                                    </Link>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-center text-xs text-text-muted">
                    Esta página se actualiza en tiempo real
                </p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inner page — must be wrapped in Suspense because it uses useSearchParams
// ─────────────────────────────────────────────────────────────────────────────
function VideoCallPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const appointmentId = searchParams.get('appointment');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [appointment, setAppointment] = useState<Appointment | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userDisplayName, setUserDisplayName] = useState<string>('Usuario');
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [inMeeting, setInMeeting] = useState(false);

    // ── Auth ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push(`/login?redirect=/videollamada?appointment=${appointmentId}`);
                return;
            }
            setUserId(user.uid);
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const d = userDoc.data();
                setUserDisplayName(
                    d.displayName || `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim() || user.email || 'Usuario'
                );
            }
        });
        return () => unsub();
    }, [router, appointmentId]);

    // ── Validate + real-time snapshot ─────────────────────────────────────────
    useEffect(() => {
        if (!appointmentId || !userId) return;

        const appointmentRef = doc(db, 'appointments', appointmentId);

        // One-time validation
        getDoc(appointmentRef)
            .then((snap) => {
                if (!snap.exists()) { setError('Turno no encontrado.'); setLoading(false); return; }

                const data = snap.data();
                let role: UserRole = null;
                if (data.professionalId === userId) role = 'professional';
                else if (data.userId === userId) role = 'patient';

                if (!role) {
                    setError('No tenés permiso para acceder a esta videollamada.');
                    setLoading(false);
                    return;
                }

                if (role === 'patient' && !['confirmed', 'payment_confirmed', 'approved'].includes(data.status)) {
                    setError('Tu turno aún no está confirmado. Verificá el estado de pago en tu panel.');
                    setLoading(false);
                    return;
                }

                setUserRole(role);
                setLoading(false);
            })
            .catch(() => {
                setError('Error al cargar la información del turno.');
                setLoading(false);
            });

        // Real-time updates for roomStatus
        const unsubscribe = onSnapshot(appointmentRef, (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();
            setAppointment({
                id: snap.id,
                userId: data.userId,
                professionalId: data.professionalId,
                date: data.date,
                time: data.time,
                duration: data.duration || 60,
                status: data.status,
                paymentStatus: data.paymentStatus,
                professionalName: data.professionalName || data.patientName || 'Participante',
                professionalTitle: data.professionalTitle || 'Lic.',
                meetingRoomName: data.meetingRoomName,
                roomStatus: data.roomStatus ?? 'waiting',
            });
        });

        return () => unsubscribe();
    }, [appointmentId, userId]);

    // ── Room control ──────────────────────────────────────────────────────────
    const handleOpenRoom = async () => {
        if (!appointment || !appointmentId) return;
        const roomName = appointment.meetingRoomName || generateRoomName(appointmentId);
        await updateDoc(doc(db, 'appointments', appointmentId), {
            roomStatus: 'open',
            meetingRoomName: roomName,
            roomOpenedAt: new Date(),
        });
    };

    const handleEndRoom = async () => {
        if (!appointmentId) return;
        await updateDoc(doc(db, 'appointments', appointmentId), {
            roomStatus: 'ended',
            roomEndedAt: new Date(),
            status: 'completed',
        });
        router.push('/panel-profesional/turnos');
    };

    const handleJoinMeeting = () => {
        if (!appointment) return;
        const roomStatus = appointment.roomStatus ?? 'waiting';
        const inTimeWindow = isMeetingTimeWindow(appointment.date, appointment.time, appointment.duration);
        if (userRole === 'professional' && roomStatus === 'open') {
            setInMeeting(true);
        } else if (userRole === 'patient' && roomStatus === 'open' && inTimeWindow) {
            setInMeeting(true);
        }
    };

    const handleMeetingEnd = async () => {
        setInMeeting(false);
        if (userRole === 'professional') {
            await handleEndRoom();
        } else {
            router.push('/panel-usuario/turnos');
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading || !appointment) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-text-secondary">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    // ── Access denied ─────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldX className="h-8 w-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-secondary mb-2">Acceso denegado</h2>
                    <p className="text-text-secondary mb-6">{error}</p>
                    <div className="flex flex-col gap-3">
                        <Link href="/panel-usuario/turnos">
                            <Button className="w-full">Ver Mis Turnos</Button>
                        </Link>
                        <Link href="/">
                            <Button variant="outline" className="w-full">Ir al Inicio</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ── Active meeting ────────────────────────────────────────────────────────
    if (inMeeting && appointment.meetingRoomName) {
        return (
            // Full viewport, no scroll, mobile-safe
            <div className="fixed inset-0 flex flex-col bg-neutral-900 z-50">
                {/* Top bar — touch-friendly (min 48px height) */}
                <div className="flex items-center justify-between px-4 bg-secondary/95 text-white flex-shrink-0"
                    style={{ minHeight: '52px' }}>
                    <div className="flex items-center gap-2 py-2">
                        <Video className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-semibold text-sm truncate">SmartWell · Sesión en curso</span>
                    </div>
                    {userRole === 'professional' && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-red-400 text-red-300 hover:bg-red-900/30 text-xs ml-2 shrink-0"
                            onClick={handleMeetingEnd}
                        >
                            Finalizar
                        </Button>
                    )}
                </div>

                {/* Jitsi — fills all remaining space */}
                <div className="flex-1 overflow-hidden">
                    <JitsiMeet
                        config={{
                            roomName: appointment.meetingRoomName!,
                            displayName: userDisplayName,
                            email: auth.currentUser?.email || undefined,
                            subject: 'Sesión SmartWell',
                            startWithAudioMuted: false,
                            startWithVideoMuted: false,
                            isModerator: userRole === 'professional',
                        }}
                        onMeetingEnd={handleMeetingEnd}
                    />
                </div>
            </div>
        );
    }

    // ── Professional lobby ────────────────────────────────────────────────────
    if (userRole === 'professional') {
        return (
            <ProfessionalLobby
                appointment={appointment}
                onOpenRoom={handleOpenRoom}
                onEndRoom={handleEndRoom}
                onJoinMeeting={handleJoinMeeting}
            />
        );
    }

    // ── Patient waiting room ──────────────────────────────────────────────────
    return (
        <WaitingRoom
            appointmentDate={appointment.date}
            appointmentTime={appointment.time}
            professionalName={appointment.professionalName}
            professionalTitle={appointment.professionalTitle || 'Lic.'}
            duration={appointment.duration}
            roomStatus={appointment.roomStatus ?? 'waiting'}
            onJoinMeeting={handleJoinMeeting}
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported page — wraps inner component in Suspense (required by Next.js 14
// when using useSearchParams in a Client Component)
// ─────────────────────────────────────────────────────────────────────────────
export default function VideoCallPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                    <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-text-secondary">Cargando...</p>
                    </div>
                </div>
            }
        >
            <VideoCallPageInner />
        </Suspense>
    );
}
