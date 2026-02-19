"use client";

import { useState, useEffect, useRef } from 'react';
import { Clock, Video, Calendar, User, CheckCircle, Wifi, WifiOff, Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getTimeUntilMeeting } from '@/lib/jitsi';
import type { RoomStatus } from '@/lib/jitsi';

interface WaitingRoomProps {
    appointmentDate: string;
    appointmentTime: string;
    professionalName: string;
    professionalTitle: string;
    duration: number;
    roomStatus: RoomStatus;   // Live value from Firestore onSnapshot
    onJoinMeeting: () => void;
}

export default function WaitingRoom({
    appointmentDate,
    appointmentTime,
    professionalName,
    professionalTitle,
    duration,
    roomStatus,
    onJoinMeeting,
}: WaitingRoomProps) {
    const [timeInfo, setTimeInfo] = useState(getTimeUntilMeeting(appointmentDate, appointmentTime));
    const [currentTime, setCurrentTime] = useState(new Date());
    // When roomStatus flips to 'open', pulse the button to draw attention
    const [justOpened, setJustOpened] = useState(false);
    const prevStatus = useRef<RoomStatus>(roomStatus);

    // Live countdown ticker
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
            setTimeInfo(getTimeUntilMeeting(appointmentDate, appointmentTime));
        }, 10_000);
        return () => clearInterval(interval);
    }, [appointmentDate, appointmentTime]);

    // Detect when the professional opens the room
    useEffect(() => {
        if (prevStatus.current !== 'open' && roomStatus === 'open') {
            setJustOpened(true);
            // Auto-clear the animation after a few seconds
            setTimeout(() => setJustOpened(false), 5000);
        }
        prevStatus.current = roomStatus;
    }, [roomStatus]);

    const formattedDate = (() => {
        const [year, month, day] = appointmentDate.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString('es-AR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
    })();

    // ── State machine badge ──────────────────────────────────────────────────
    const statusBadge = {
        waiting: { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Sala cerrada · El profesional aún no abrió la sala' },
        open: { color: 'bg-green-100 text-green-800 border-green-200', label: '✅ El profesional abrió la sala — podés unirte ahora' },
        in_progress: { color: 'bg-primary/10 text-primary border-primary/30', label: 'Sesión en curso' },
        ended: { color: 'bg-neutral-100 text-neutral-600 border-neutral-200', label: 'Esta sesión ya finalizó' },
    }[roomStatus];

    // Patient can join only when: room is open AND time window is correct
    const canEnter = roomStatus === 'open' && timeInfo.accessible;

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary-dark/5 py-6 px-4 overflow-y-auto flex flex-col items-center justify-start md:justify-center">
            <div className="max-w-2xl w-full">

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-primary-dark p-8 text-white text-center relative">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
                            <Video className="h-10 w-10" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Sala de Espera Virtual</h1>
                        <p className="text-white/80 text-sm">SmartWell · Sesión Privada</p>

                        {/* Live status pill */}
                        <div className={`mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold ${statusBadge.color}`}>
                            {roomStatus === 'waiting' && <Loader2 className="h-3 w-3 animate-spin" />}
                            {roomStatus === 'open' && <Wifi className="h-3 w-3" />}
                            {roomStatus === 'ended' && <WifiOff className="h-3 w-3" />}
                            {statusBadge.label}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">

                        {/* Appointment Details */}
                        <div className="bg-neutral-50 rounded-xl p-6">
                            <h2 className="text-lg font-bold text-secondary mb-4">Detalles de la Sesión</h2>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-primary flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-text-secondary">Profesional</p>
                                        <p className="font-semibold text-secondary">{professionalTitle} {professionalName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-primary flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-text-secondary">Fecha</p>
                                        <p className="font-semibold text-secondary capitalize">{formattedDate}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-primary flex-shrink-0" />
                                    <div>
                                        <p className="text-xs text-text-secondary">Hora</p>
                                        <p className="font-semibold text-secondary">{appointmentTime} ({duration} min)</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Zone */}
                        <div className="text-center">
                            {/* Session ended */}
                            {roomStatus === 'ended' && (
                                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6">
                                    <WifiOff className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
                                    <p className="font-bold text-secondary mb-1">Sesión Finalizada</p>
                                    <p className="text-text-secondary text-sm">El profesional cerró la sala.</p>
                                </div>
                            )}

                            {/* Can enter */}
                            {canEnter && (
                                <div className={`border-2 rounded-xl p-6 transition-all ${justOpened ? 'bg-green-50 border-green-400 shadow-lg shadow-green-100 scale-[1.02]' : 'bg-green-50 border-green-200'}`}>
                                    <CheckCircle className={`h-12 w-12 mx-auto mb-3 ${justOpened ? 'text-green-500 animate-bounce' : 'text-green-600'}`} />
                                    <p className="text-green-900 font-bold text-lg mb-1">
                                        {justOpened ? '¡El profesional te está esperando!' : '¡Tu sesión está lista!'}
                                    </p>
                                    <p className="text-green-700 text-sm mb-5">El profesional abrió la sala. Podés ingresar ahora.</p>
                                    <Button
                                        onClick={onJoinMeeting}
                                        size="lg"
                                        className={`w-full sm:w-auto ${justOpened ? 'animate-pulse' : ''}`}
                                    >
                                        <Video className="h-5 w-5 mr-2" />
                                        Unirse a la Videollamada
                                    </Button>
                                </div>
                            )}

                            {/* Room open but time window not yet valid */}
                            {roomStatus === 'open' && !timeInfo.accessible && (
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                                    <ShieldAlert className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                                    <p className="font-bold text-secondary mb-1">Sala abierta pero fuera de horario</p>
                                    <p className="text-text-secondary text-sm">{timeInfo.message}</p>
                                </div>
                            )}

                            {/* Waiting for professional */}
                            {roomStatus === 'waiting' && (
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                                    <div className="flex justify-center mb-3">
                                        <div className="relative">
                                            <Clock className="h-12 w-12 text-amber-600" />
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                                            </span>
                                        </div>
                                    </div>

                                    {!timeInfo.accessible ? (
                                        <>
                                            <p className="text-amber-900 font-bold text-lg mb-1">Esperando hora de inicio</p>
                                            <p className="text-amber-700 text-sm mb-4">{timeInfo.message}</p>
                                            {timeInfo.minutesUntil && timeInfo.minutesUntil > 0 && (
                                                <div className="inline-flex items-center gap-2 bg-white border border-amber-200 px-4 py-2 rounded-lg">
                                                    <Clock className="h-4 w-4 text-amber-600" />
                                                    <span className="font-mono text-xl font-bold text-amber-900">
                                                        {timeInfo.minutesUntil} min
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-amber-900 font-bold text-lg mb-1">Esperando al profesional</p>
                                            <p className="text-amber-700 text-sm">La sala estará disponible cuando el profesional la abra. Esta página se actualiza automáticamente.</p>
                                            <div className="mt-4 flex justify-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tips */}
                        {roomStatus !== 'ended' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                                <h3 className="font-bold text-blue-900 mb-3 text-sm flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" /> Consejos para tu sesión
                                </h3>
                                <ul className="space-y-1.5 text-sm text-blue-800">
                                    {[
                                        'Asegurate de tener buena conexión a internet',
                                        'Buscá un lugar tranquilo y privado',
                                        'Verificá que tu cámara y micrófono funcionen',
                                        'Tené auriculares a mano para mejor calidad de audio',
                                    ].map((tip) => (
                                        <li key={tip} className="flex items-start gap-2">
                                            <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-4 text-text-secondary text-xs space-y-1">
                    <p>Hora actual: {currentTime.toLocaleTimeString('es-AR')}</p>
                    <p>Esta página se actualiza automáticamente · <span className="text-primary cursor-pointer hover:underline">Soporte</span></p>
                </div>
            </div>
        </div>
    );
}
