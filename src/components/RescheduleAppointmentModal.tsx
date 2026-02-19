"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Calendar, Clock, Loader2, AlertCircle } from 'lucide-react';
import { rescheduleAppointment } from '@/lib/appointments';
import BookingCalendar from './BookingCalendar';
import { auth } from '@/lib/firebase';

interface RescheduleAppointmentModalProps {
    appointmentId: string;
    professionalId: string;
    professionalName: string;
    professionalEmail?: string;
    patientId?: string;
    patientName?: string;
    patientEmail?: string;
    currentDate: string;
    currentTime: string;
    duration?: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RescheduleAppointmentModal({
    appointmentId,
    professionalId,
    professionalName,
    professionalEmail,
    patientId,
    patientName,
    patientEmail,
    currentDate,
    currentTime,
    duration,
    onClose,
    onSuccess,
}: RescheduleAppointmentModalProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [rescheduling, setRescheduling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check reschedule policy: only allowed up to 24hs before appointment
    const canReschedule = (() => {
        const [year, month, day] = currentDate.split('-').map(Number);
        const [hours, minutes] = currentTime.split(':').map(Number);
        const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
        const hoursUntil = (appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
        return hoursUntil >= 24;
    })();

    const handleReschedule = async () => {
        if (!selectedDate || !selectedTime) {
            setError('Por favor seleccioná una nueva fecha y hora');
            return;
        }

        setRescheduling(true);
        setError(null);

        try {
            const newDateStr = selectedDate.toISOString().split('T')[0];
            const result = await rescheduleAppointment(appointmentId, newDateStr, selectedTime, professionalId);

            if (result.success) {
                // Notificar al profesional por email
                if (professionalEmail) {
                    try {
                        const user = auth.currentUser;
                        const token = user ? await user.getIdToken() : null;
                        if (token) {
                            await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({
                                    type: 'patient_rescheduled',
                                    data: {
                                        patientId: patientId || user?.uid,
                                        patientName: patientName || 'El paciente',
                                        patientEmail: patientEmail || '',
                                        professionalName,
                                        professionalEmail,
                                        oldDate: currentDate,
                                        oldTime: currentTime,
                                        newDate: newDateStr,
                                        newTime: selectedTime,
                                        duration: duration || 50,
                                    }
                                })
                            });
                        }
                    } catch (emailErr) {
                        console.error('Error sending reschedule email to professional:', emailErr);
                    }
                }
                onSuccess();
            } else {
                setError(result.error || 'Error al reprogramar el turno');
            }
        } catch (err: any) {
            setError(err.message || 'Error inesperado');
        } finally {
            setRescheduling(false);
        }
    };

    const currentFormattedDate = new Date(currentDate).toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    const newFormattedDate = selectedDate?.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl my-8">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                    <div>
                        <h2 className="text-xl font-bold text-secondary">Reprogramar Turno</h2>
                        <p className="text-sm text-text-secondary mt-1">
                            Seleccioná una nueva fecha y hora disponible
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Current Appointment */}
                    <div className="bg-neutral-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-text-secondary mb-2">Turno Actual</p>
                        <div className="flex items-center gap-4 text-secondary">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="font-semibold capitalize">{currentFormattedDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                <span className="font-semibold">{currentTime} hs</span>
                            </div>
                        </div>
                    </div>

                    {/* Policy Notice */}
                    {canReschedule ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                            <div className="text-sm text-green-900">
                                <p className="font-semibold mb-1">✅ Podés reprogramar sin costo</p>
                                <p>Las reprogramaciones están permitidas hasta <strong>24 horas antes</strong> del turno, sin perder tu seña.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                            <div className="text-sm text-red-900">
                                <p className="font-semibold mb-1">⛔ No podés reprogramar este turno</p>
                                <p>Solo se puede reprogramar con <strong>al menos 24 horas de anticipación</strong>. Para cancelar, contactá directamente al profesional.</p>
                            </div>
                        </div>
                    )}
                    {canReschedule && (
                        <div>
                            <p className="text-sm font-medium text-secondary mb-4">Seleccionar Nueva Fecha y Hora</p>
                            <BookingCalendar
                                professionalId={professionalId}
                                onSelectSlot={(date, time) => {
                                    setSelectedDate(date);
                                    setSelectedTime(time);
                                }}
                            />
                        </div>
                    )}

                    {/* New Appointment Summary */}
                    {canReschedule && selectedDate && selectedTime && (
                        <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
                            <p className="text-sm font-medium text-primary mb-2">Nuevo Turno</p>
                            <div className="flex items-center gap-4 text-secondary">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span className="font-semibold capitalize">{newFormattedDate}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <span className="font-semibold">{selectedTime} hs</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                            <p className="text-sm text-red-900">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-neutral-100">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={rescheduling}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleReschedule}
                        className="flex-1"
                        disabled={rescheduling || !selectedDate || !selectedTime || !canReschedule}
                    >
                        {rescheduling ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Reprogramando...
                            </>
                        ) : (
                            'Confirmar Reprogramación'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
