"use client";

import { useState, useEffect } from 'react';
import { Clock, Video, Calendar, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getTimeUntilMeeting } from '@/lib/jitsi';

interface WaitingRoomProps {
    appointmentDate: string;
    appointmentTime: string;
    professionalName: string;
    professionalTitle: string;
    duration: number;
    onJoinMeeting: () => void;
}

export default function WaitingRoom({
    appointmentDate,
    appointmentTime,
    professionalName,
    professionalTitle,
    duration,
    onJoinMeeting,
}: WaitingRoomProps) {
    const [timeInfo, setTimeInfo] = useState(getTimeUntilMeeting(appointmentDate, appointmentTime));
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
            setTimeInfo(getTimeUntilMeeting(appointmentDate, appointmentTime));
        }, 10000); // Update every 10 seconds

        return () => clearInterval(interval);
    }, [appointmentDate, appointmentTime]);

    const formattedDate = new Date(appointmentDate).toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary-dark/5 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary to-primary-dark p-8 text-white text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
                            <Video className="h-10 w-10" />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Sala de Espera Virtual</h1>
                        <p className="text-white/90">Tu sesión comenzará pronto</p>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {/* Appointment Details */}
                        <div className="bg-neutral-50 rounded-xl p-6 mb-6">
                            <h2 className="text-lg font-bold text-secondary mb-4">Detalles de la Sesión</h2>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-text-secondary">Profesional</p>
                                        <p className="font-semibold text-secondary">
                                            {professionalTitle} {professionalName}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-text-secondary">Fecha</p>
                                        <p className="font-semibold text-secondary capitalize">{formattedDate}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm text-text-secondary">Hora</p>
                                        <p className="font-semibold text-secondary">
                                            {appointmentTime} ({duration} minutos)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="text-center mb-6">
                            {timeInfo.accessible ? (
                                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                                    <p className="text-green-900 font-bold text-lg mb-2">
                                        ¡Tu sesión está lista!
                                    </p>
                                    <p className="text-green-700 mb-4">
                                        Podés ingresar a la videollamada ahora
                                    </p>
                                    <Button
                                        onClick={onJoinMeeting}
                                        size="lg"
                                        className="w-full sm:w-auto"
                                    >
                                        <Video className="h-5 w-5 mr-2" />
                                        Unirse a la Videollamada
                                    </Button>
                                </div>
                            ) : (
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                                    <Clock className="h-12 w-12 text-amber-600 mx-auto mb-3" />
                                    <p className="text-amber-900 font-bold text-lg mb-2">
                                        Esperando inicio de sesión
                                    </p>
                                    <p className="text-amber-700">
                                        {timeInfo.message}
                                    </p>
                                    {timeInfo.minutesUntil && timeInfo.minutesUntil > 0 && (
                                        <div className="mt-4">
                                            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                                                <Clock className="h-5 w-5 text-amber-600" />
                                                <span className="font-mono text-2xl font-bold text-amber-900">
                                                    {timeInfo.minutesUntil} min
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Tips */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Consejos para tu sesión
                            </h3>
                            <ul className="space-y-2 text-sm text-blue-800">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>Asegurate de tener buena conexión a internet</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>Buscá un lugar tranquilo y privado</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>Verificá que tu cámara y micrófono funcionen correctamente</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 mt-0.5">•</span>
                                    <span>Tené a mano auriculares para mejor calidad de audio</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-text-secondary text-sm">
                    <p>Hora actual: {currentTime.toLocaleTimeString('es-AR')}</p>
                    <p className="mt-2">
                        ¿Tenés problemas técnicos? Contactá a soporte
                    </p>
                </div>
            </div>
        </div>
    );
}
