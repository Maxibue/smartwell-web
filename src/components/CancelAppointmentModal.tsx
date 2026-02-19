"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { cancelAppointment, checkCancellationPolicy } from '@/lib/appointments';
import { auth } from '@/lib/firebase';

interface CancelAppointmentModalProps {
    appointmentId: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentDuration?: number;
    professionalName: string;
    professionalEmail?: string;
    patientId?: string;
    patientName?: string;
    patientEmail?: string;
    userType: 'patient' | 'professional';
    onClose: () => void;
    onSuccess: () => void;
}

export default function CancelAppointmentModal({
    appointmentId,
    appointmentDate,
    appointmentTime,
    appointmentDuration,
    professionalName,
    professionalEmail,
    patientId,
    patientName,
    patientEmail,
    userType,
    onClose,
    onSuccess,
}: CancelAppointmentModalProps) {
    const [reason, setReason] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const policy = checkCancellationPolicy(appointmentDate, appointmentTime);

    const handleCancel = async () => {
        if (!policy.canCancel) {
            setError(policy.reason || 'No se puede cancelar este turno');
            return;
        }

        setCancelling(true);
        setError(null);

        try {
            const result = await cancelAppointment(appointmentId, userType, reason);

            if (result.success) {
                // Notificar al profesional por email si el paciente cancela
                if (userType === 'patient' && professionalEmail) {
                    try {
                        const user = auth.currentUser;
                        const token = user ? await user.getIdToken() : null;
                        if (token) {
                            await fetch('/api/send-email', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({
                                    type: 'patient_cancelled',
                                    data: {
                                        patientId: patientId || user?.uid,
                                        patientName: patientName || 'El paciente',
                                        patientEmail: patientEmail || '',
                                        professionalName,
                                        professionalEmail,
                                        date: appointmentDate,
                                        time: appointmentTime,
                                        duration: appointmentDuration || 50,
                                        reason: reason || undefined,
                                    }
                                })
                            });
                        }
                    } catch (emailErr) {
                        console.error('Error sending cancellation email to professional:', emailErr);
                    }
                }
                onSuccess();
            } else {
                setError(result.error || 'Error al cancelar el turno');
            }
        } catch (err: any) {
            setError(err.message || 'Error inesperado');
        } finally {
            setCancelling(false);
        }
    };

    const formattedDate = new Date(appointmentDate).toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-100">
                    <h2 className="text-xl font-bold text-secondary">Cancelar Turno</h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Warning */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-red-900">
                            <p className="font-semibold mb-1">⚠️ Perderás tu seña</p>
                            <p>Al cancelar un turno, <strong>la seña no es reembolsable</strong>. Si querés cambiar la fecha, usá la opción <strong>Reprogramar</strong> (sin costo hasta 24hs antes).</p>
                        </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                        <div>
                            <p className="text-sm text-text-secondary">Profesional</p>
                            <p className="font-semibold text-secondary">{professionalName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-text-secondary">Fecha y Hora</p>
                            <p className="font-semibold text-secondary capitalize">
                                {formattedDate} - {appointmentTime} hs
                            </p>
                        </div>
                    </div>

                    {/* Cancellation Policy */}
                    {policy.canCancel ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <p className="text-sm text-green-900">
                                ✓ Podés cancelar este turno ({policy.hoursBeforeSession} horas de anticipación)
                            </p>
                        </div>
                    ) : (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-900 font-semibold">
                                ✗ {policy.reason}
                            </p>
                            <p className="text-xs text-red-700 mt-1">
                                Para cancelar, contactá directamente al profesional.
                            </p>
                        </div>
                    )}

                    {/* Reason */}
                    {policy.canCancel && (
                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">
                                Motivo de cancelación (opcional)
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Ej: Surgió un imprevisto..."
                                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                rows={3}
                                maxLength={200}
                            />
                            <p className="text-xs text-text-secondary mt-1">
                                {reason.length}/200 caracteres
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-900">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-neutral-100">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={cancelling}
                    >
                        Volver
                    </Button>
                    <Button
                        onClick={handleCancel}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        disabled={cancelling || !policy.canCancel}
                    >
                        {cancelling ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Cancelando...
                            </>
                        ) : (
                            'Confirmar Cancelación'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
