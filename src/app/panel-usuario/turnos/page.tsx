"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Calendar, Video, Clock, Loader2, CheckCircle2, Filter, RefreshCw, X, Star } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { isMeetingAccessible, getTimeUntilMeeting } from "@/lib/jitsi";
import { getUpcomingAppointments, getPastAppointments, AppointmentStatus } from "@/lib/appointments";
import CancelAppointmentModal from "@/components/CancelAppointmentModal";
import RescheduleAppointmentModal from "@/components/RescheduleAppointmentModal";

interface Appointment {
    id: string;
    professionalName: string;
    professionalId: string;
    professionalTitle?: string;
    professionalSpecialty: string;
    professionalEmail?: string;
    price: number;
    date: string;
    time: string;
    duration: number;
    status: AppointmentStatus;
    paymentStatus: string;
    meetingRoomName?: string;
    meetingUrl?: string;
}

type ViewMode = 'upcoming' | 'past';

export default function UserAppointmentsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('upcoming');
    const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');

    // Modals
    const [cancelModal, setCancelModal] = useState<{ show: boolean; appointment: Appointment | null }>({
        show: false,
        appointment: null,
    });
    const [rescheduleModal, setRescheduleModal] = useState<{ show: boolean; appointment: Appointment | null }>({
        show: false,
        appointment: null,
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await loadAppointments(currentUser.uid);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [viewMode]);

    const loadAppointments = async (userId: string) => {
        setLoading(true);
        try {
            const data = viewMode === 'upcoming'
                ? await getUpcomingAppointments(userId, 'patient')
                : await getPastAppointments(userId, 'patient');

            setAppointments(data as Appointment[]);
        } catch (error) {
            console.error("Error loading appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSuccess = () => {
        setCancelModal({ show: false, appointment: null });
        if (user) loadAppointments(user.uid);
    };

    const handleRescheduleSuccess = () => {
        setRescheduleModal({ show: false, appointment: null });
        if (user) loadAppointments(user.uid);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const getVideoCallStatus = (appointment: Appointment) => {
        return getTimeUntilMeeting(appointment.date, appointment.time);
    };

    const getStatusBadge = (status: AppointmentStatus | string) => {
        const badges: Record<string, { label: string; color: string; icon: any }> = {
            pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-800', icon: Clock },
            confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
            in_progress: { label: 'En Curso', color: 'bg-blue-100 text-blue-800', icon: Video },
            cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: X },
            completed: { label: 'Completado', color: 'bg-neutral-100 text-neutral-800', icon: CheckCircle2 },
            pending_payment: { label: '💳 Esperando seña', color: 'bg-amber-100 text-amber-800', icon: Clock },
            payment_submitted: { label: '⏳ Verificando pago', color: 'bg-blue-100 text-blue-800', icon: Clock },
            payment_rejected: { label: '⚠️ Pago rechazado', color: 'bg-red-100 text-red-700', icon: X },
        };
        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon className="h-3 w-3" />
                {badge.label}
            </span>
        );
    };

    const filteredAppointments = filterStatus === 'all'
        ? appointments
        : appointments.filter(apt => apt.status === filterStatus);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Mis Turnos</h1>
                    <p className="text-text-secondary">Gestioná tus sesiones.</p>
                </div>
                <Link href="/profesionales">
                    <Button>+ Nueva Reserva</Button>
                </Link>
            </div>

            {/* View Mode Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-2 flex gap-2">
                <button
                    onClick={() => setViewMode('upcoming')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'upcoming'
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:bg-neutral-50'
                        }`}
                >
                    Próximos
                </button>
                <button
                    onClick={() => setViewMode('past')}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${viewMode === 'past'
                        ? 'bg-primary text-white'
                        : 'text-text-secondary hover:bg-neutral-50'
                        }`}
                >
                    Historial
                </button>
            </div>

            {/* Filters */}
            {viewMode === 'past' && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="h-4 w-4 text-text-secondary" />
                        <span className="text-sm font-medium text-secondary">Filtrar por estado:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(['all', 'completed', 'cancelled'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === status
                                    ? 'bg-primary text-white'
                                    : 'bg-neutral-100 text-text-secondary hover:bg-neutral-200'
                                    }`}
                            >
                                {status === 'all' ? 'Todos' : status === 'completed' ? 'Completados' : 'Cancelados'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Appointments List */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                {filteredAppointments.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <div className="bg-neutral-50 p-4 rounded-full mb-4">
                            <Calendar className="h-8 w-8 text-neutral-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-secondary mb-2">
                            {viewMode === 'upcoming' ? 'No tenés turnos próximos' : 'No hay turnos en el historial'}
                        </h3>
                        <p className="text-text-secondary mb-6 max-w-sm">
                            {viewMode === 'upcoming'
                                ? 'Explorá nuestros profesionales y comenzá tu camino de bienestar hoy mismo.'
                                : 'Tus sesiones pasadas aparecerán aquí.'}
                        </p>
                        {viewMode === 'upcoming' && (
                            <Link href="/profesionales">
                                <Button variant="outline">Buscar Profesional</Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100">
                        {filteredAppointments.map((appointment) => {
                            const videoStatus = getVideoCallStatus(appointment);
                            const appointmentDate = new Date(appointment.date);
                            const canManage = appointment.status !== 'cancelled' && appointment.status !== 'completed';

                            return (
                                <div key={appointment.id} className="p-6 hover:bg-neutral-50 transition-colors">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        {/* Left: Appointment Info */}
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary border border-primary/20 shrink-0">
                                                <span className="text-xs font-bold uppercase">
                                                    {format(appointmentDate, "MMM", { locale: es })}
                                                </span>
                                                <span className="text-lg font-bold">
                                                    {format(appointmentDate, "d")}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h3 className="font-bold text-secondary">
                                                        {appointment.professionalTitle} {appointment.professionalName}
                                                    </h3>
                                                    {getStatusBadge(appointment.status)}
                                                </div>
                                                <p className="text-sm text-text-secondary mb-1">
                                                    {appointment.professionalSpecialty}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-text-secondary flex-wrap">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{appointment.time} hs</span>
                                                    <span className="text-neutral-300">•</span>
                                                    <span>{appointment.duration} min</span>
                                                    <span className="text-neutral-300">•</span>
                                                    <span>${appointment.price}</span>
                                                </div>
                                                {viewMode === 'upcoming' && videoStatus.accessible && (
                                                    <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span className="font-medium">Videollamada disponible</span>
                                                    </div>
                                                )}
                                                {viewMode === 'upcoming' && !videoStatus.accessible && videoStatus.minutesUntil && videoStatus.minutesUntil > 0 && (
                                                    <div className="flex items-center gap-2 mt-2 text-amber-600 text-sm">
                                                        <Clock className="h-4 w-4" />
                                                        <span>Disponible en {videoStatus.minutesUntil} min</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex flex-col sm:flex-row gap-2 sm:min-w-[280px] lg:justify-end">
                                            {/* CTA de Seña */}
                                            {(appointment.status === 'pending_payment' || appointment.status === 'payment_rejected') && (
                                                <Link href={`/reservar/pago/${appointment.id}`} className="flex-1 sm:flex-initial">
                                                    <Button
                                                        className={`w-full flex items-center justify-center gap-2 ${appointment.status === 'payment_rejected'
                                                                ? 'bg-amber-500 hover:bg-amber-600'
                                                                : 'bg-emerald-500 hover:bg-emerald-600'
                                                            } text-white`}
                                                    >
                                                        💳 {appointment.status === 'payment_rejected' ? 'Reintentar pago' : 'Subir comprobante'}
                                                    </Button>
                                                </Link>
                                            )}
                                            {appointment.status === 'payment_submitted' && (
                                                <div className="flex items-center gap-2 text-blue-600 text-sm bg-blue-50 rounded-lg px-3 py-2">
                                                    <Clock className="h-4 w-4 flex-shrink-0" />
                                                    <span className="font-medium">Comprobante enviado — esperando verificación</span>
                                                </div>
                                            )}
                                            {viewMode === 'upcoming' && !['pending_payment', 'payment_submitted', 'payment_rejected'].includes(appointment.status) && (
                                                <>
                                                    {videoStatus.accessible ? (
                                                        <Link href={`/videollamada?appointment=${appointment.id}`} className="flex-1 sm:flex-initial">
                                                            <Button className="flex items-center justify-center gap-2 w-full">
                                                                <Video className="h-4 w-4" />
                                                                Unirse
                                                            </Button>
                                                        </Link>
                                                    ) : (
                                                        <Button
                                                            disabled
                                                            className="flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                                                            variant="outline"
                                                        >
                                                            <Video className="h-4 w-4" />
                                                            Videollamada
                                                        </Button>
                                                    )}
                                                    {canManage && (
                                                        <>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setRescheduleModal({ show: true, appointment })}
                                                                className="flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                                                            >
                                                                <RefreshCw className="h-4 w-4" />
                                                                Reprogramar
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setCancelModal({ show: true, appointment })}
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100 flex-1 sm:flex-initial"
                                                            >
                                                                Cancelar
                                                            </Button>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                            {viewMode === 'past' && appointment.status === 'completed' && (
                                                <Link href={`/calificar/${appointment.id}`} className="flex-1 sm:flex-initial">
                                                    <Button className="flex items-center justify-center gap-2 w-full">
                                                        <Star className="h-4 w-4" />
                                                        Calificar
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modals */}
            {cancelModal.show && cancelModal.appointment && (
                <CancelAppointmentModal
                    appointmentId={cancelModal.appointment.id}
                    appointmentDate={cancelModal.appointment.date}
                    appointmentTime={cancelModal.appointment.time}
                    appointmentDuration={cancelModal.appointment.duration}
                    professionalName={`${cancelModal.appointment.professionalTitle} ${cancelModal.appointment.professionalName}`}
                    professionalEmail={cancelModal.appointment.professionalEmail}
                    patientId={user?.uid}
                    patientName={user?.displayName || user?.email || undefined}
                    patientEmail={user?.email || undefined}
                    userType="patient"
                    onClose={() => setCancelModal({ show: false, appointment: null })}
                    onSuccess={handleCancelSuccess}
                />
            )}

            {rescheduleModal.show && rescheduleModal.appointment && (
                <RescheduleAppointmentModal
                    appointmentId={rescheduleModal.appointment.id}
                    professionalId={rescheduleModal.appointment.professionalId}
                    professionalName={`${rescheduleModal.appointment.professionalTitle} ${rescheduleModal.appointment.professionalName}`}
                    professionalEmail={rescheduleModal.appointment.professionalEmail}
                    patientId={user?.uid}
                    patientName={user?.displayName || user?.email || undefined}
                    patientEmail={user?.email || undefined}
                    currentDate={rescheduleModal.appointment.date}
                    currentTime={rescheduleModal.appointment.time}
                    duration={rescheduleModal.appointment.duration}
                    onClose={() => setRescheduleModal({ show: false, appointment: null })}
                    onSuccess={handleRescheduleSuccess}
                />
            )}
        </div>
    );
}
