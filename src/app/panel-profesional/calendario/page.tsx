"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, X } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, Timestamp, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const FULL_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Mapa: getDay() → clave de disponibilidad
const DOW_MAP: Record<number, string> = {
    0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
    4: 'thursday', 5: 'friday', 6: 'saturday',
};

interface TimeSlot { start: string; end: string; }
interface DayAvailability { enabled: boolean; slots: TimeSlot[]; }
interface WeekAvailability {
    monday: DayAvailability; tuesday: DayAvailability; wednesday: DayAvailability;
    thursday: DayAvailability; friday: DayAvailability;
    saturday: DayAvailability; sunday: DayAvailability;
}

function parseMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

interface Appointment {
    id: string;
    source: 'appointment' | 'booking';
    patientName: string;
    patientEmail?: string;
    service: string;
    date: string;
    time: string;
    duration: number;
    status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
    notes?: string;
}

export default function CalendarPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
    const [currentDay, setCurrentDay] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [view, setView] = useState<'week' | 'day' | 'month'>('week');
    const [availability, setAvailability] = useState<WeekAvailability | null>(null);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
    const [newAppointment, setNewAppointment] = useState({
        patientName: "",
        patientEmail: "",
        service: "",
        duration: 60,
        notes: ""
    });
    const [creating, setCreating] = useState(false);

    // Modal de detalle/edición de turno
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");
    const [rescheduling, setRescheduling] = useState(false);

    function getMonday(d: Date) {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    }

    function formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    function getDaysOfWeek(start: Date): Date[] {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
        });
    }

    function getDaysOfMonth(date: Date): Date[] {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days: Date[] = [];

        // Add previous month days to fill first week
        const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const d = new Date(firstDay);
            d.setDate(d.getDate() - (i + 1));
            days.push(d);
        }

        // Add current month days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            days.push(new Date(year, month, day));
        }

        // Add next month days to fill last week
        const remainingDays = 42 - days.length; // 6 weeks * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            const d = new Date(lastDay);
            d.setDate(d.getDate() + i);
            days.push(d);
        }

        return days;
    }

    // Auth: solo una vez al montar
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (!currentUser) setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Cargar disponibilidad cuando el usuario está disponible
    // y también cuando el usuario vuelve a la página (visibilitychange)
    useEffect(() => {
        if (!user) return;

        const loadAvailability = async () => {
            try {
                const profDoc = await getDoc(doc(db, 'professionals', user.uid));
                if (profDoc.exists() && profDoc.data().availability) {
                    setAvailability(profDoc.data().availability as WeekAvailability);
                } else {
                    setAvailability(null);
                }
            } catch (e) { console.warn('availability:', e); }
        };

        loadAvailability();
        fetchAppointments(user.uid);

        // Recargar cuando el usuario vuelve a esta pestaña
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                loadAvailability();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [user]);

    // Re-fetch cuando cambia la vista o el período
    useEffect(() => {
        if (user) fetchAppointments(user.uid);
    }, [currentWeekStart, currentDay, currentMonth, view]);

    const fetchAppointments = async (professionalId: string) => {
        try {
            let startDate: string;
            let endDate: string;

            if (view === 'week') {
                const weekDays = getDaysOfWeek(currentWeekStart);
                startDate = formatDate(weekDays[0]);
                endDate = formatDate(weekDays[6]);
            } else if (view === 'day') {
                startDate = formatDate(currentDay);
                endDate = formatDate(currentDay);
            } else { // month
                const monthDays = getDaysOfMonth(currentMonth);
                startDate = formatDate(monthDays[0]);
                endDate = formatDate(monthDays[monthDays.length - 1]);
            }

            const all: Appointment[] = [];

            // 1. Leer de 'appointments' (agendados por el profesional)
            try {
                const q = query(
                    collection(db, "appointments"),
                    where("professionalId", "==", professionalId),
                    where("date", ">=", startDate),
                    where("date", "<=", endDate)
                );
                const snap = await getDocs(q);
                snap.forEach((doc) => {
                    const data = doc.data();
                    all.push({
                        id: doc.id,
                        source: 'appointment',
                        patientName: data.patientName || "Paciente",
                        patientEmail: data.patientEmail || "",
                        service: data.service || data.treatmentType || "Consulta",
                        date: data.date,
                        time: data.time,
                        duration: data.duration || 60,
                        status: data.status || 'confirmed',
                        notes: data.notes || "",
                    });
                });
            } catch (e) { console.warn("appointments:", e); }

            // 2. Leer de 'bookings' (reservas hechas por usuarios)
            try {
                const q = query(
                    collection(db, "bookings"),
                    where("professionalId", "==", professionalId),
                    where("date", ">=", startDate),
                    where("date", "<=", endDate)
                );
                const snap = await getDocs(q);
                snap.forEach((doc) => {
                    const data = doc.data();
                    all.push({
                        id: doc.id,
                        source: 'booking',
                        patientName: data.user?.name || data.patientName || "Paciente",
                        patientEmail: data.user?.email || data.patientEmail || "",
                        service: data.serviceName || data.service || "Consulta",
                        date: data.date,
                        time: data.time,
                        duration: data.duration || 50,
                        status: data.status || 'pending',
                        notes: data.notes || "",
                    });
                });
            } catch (e) { console.warn("bookings:", e); }

            setAppointments(all);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            setLoading(false);
        }
    };

    const goToPreviousWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeekStart(newDate);
    };

    const goToNextWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeekStart(newDate);
    };

    const goToPreviousDay = () => {
        const newDate = new Date(currentDay);
        newDate.setDate(newDate.getDate() - 1);
        setCurrentDay(newDate);
    };

    const goToNextDay = () => {
        const newDate = new Date(currentDay);
        newDate.setDate(newDate.getDate() + 1);
        setCurrentDay(newDate);
    };

    const goToPreviousMonth = () => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentMonth(newDate);
    };

    const goToNextMonth = () => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentMonth(newDate);
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentWeekStart(getMonday(today));
        setCurrentDay(today);
        setCurrentMonth(today);
    };

    const handleSlotClick = (date: Date, hour: number) => {
        const dateStr = formatDate(date);
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;

        const existingAppt = appointments.find(apt =>
            apt.date === dateStr && apt.time.startsWith(timeStr.substring(0, 2))
        );

        if (existingAppt) {
            // Abrir modal de detalle
            setSelectedAppointment(existingAppt);
            setRescheduleDate(existingAppt.date);
            setRescheduleTime(existingAppt.time);
            setIsRescheduling(false);
            setShowDetailModal(true);
        } else {
            setSelectedSlot({ date: dateStr, time: timeStr });
            setShowCreateModal(true);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!selectedAppointment || !user) return;
        setUpdatingStatus(true);
        try {
            const col = selectedAppointment.source === 'booking' ? 'bookings' : 'appointments';
            const { doc, updateDoc } = await import('firebase/firestore');
            await updateDoc(doc(db, col, selectedAppointment.id), { status: newStatus });
            // Actualizar localmente
            setAppointments(prev => prev.map(a =>
                a.id === selectedAppointment.id ? { ...a, status: newStatus as any } : a
            ));
            setSelectedAppointment(prev => prev ? { ...prev, status: newStatus as any } : null);
            await fetchAppointments(user.uid);
        } catch (e) {
            console.error('Error updating status:', e);
            alert('Error al actualizar el estado');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleReschedule = async () => {
        if (!selectedAppointment || !user || !rescheduleDate || !rescheduleTime) return;
        setRescheduling(true);
        try {
            const col = selectedAppointment.source === 'booking' ? 'bookings' : 'appointments';
            const { doc, updateDoc } = await import('firebase/firestore');
            await updateDoc(doc(db, col, selectedAppointment.id), {
                date: rescheduleDate,
                time: rescheduleTime,
                rescheduledAt: new Date().toISOString(),
                rescheduledBy: 'professional',
            });
            setIsRescheduling(false);
            setShowDetailModal(false);
            await fetchAppointments(user.uid);
        } catch (e) {
            console.error('Error rescheduling:', e);
            alert('Error al reagendar el turno');
        } finally {
            setRescheduling(false);
        }
    };

    const handleCreateAppointment = async () => {
        if (!user || !selectedSlot) return;

        if (!newAppointment.patientName || !newAppointment.service) {
            alert("Por favor completa el nombre del paciente y el servicio");
            return;
        }

        setCreating(true);
        console.log("Creating appointment...", { selectedSlot, newAppointment, userId: user.uid });

        try {
            const docRef = await addDoc(collection(db, "appointments"), {
                professionalId: user.uid,
                patientName: newAppointment.patientName,
                patientEmail: newAppointment.patientEmail || "",
                service: newAppointment.service,
                date: selectedSlot.date,
                time: selectedSlot.time,
                duration: newAppointment.duration,
                status: 'confirmed',
                notes: newAppointment.notes,
                createdAt: Timestamp.now(),
                createdBy: 'professional'
            });

            console.log("Appointment created successfully with ID:", docRef.id);

            // Refresh appointments
            await fetchAppointments(user.uid);

            // Reset form
            setShowCreateModal(false);
            setSelectedSlot(null);
            setNewAppointment({
                patientName: "",
                patientEmail: "",
                service: "",
                duration: 60,
                notes: ""
            });

            alert("✅ Turno creado correctamente");
        } catch (error: any) {
            console.error("Error creating appointment:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            alert(`❌ Error al crear el turno: ${error.message || error}`);
        } finally {
            setCreating(false);
        }
    };

    const getAppointmentForSlot = (day: Date, hour: number): Appointment | null => {
        const dateStr = formatDate(day);
        const hourStr = `${hour.toString().padStart(2, '0')}:00`;

        return appointments.find(apt => {
            if (apt.date !== dateStr) return false;
            const aptHour = parseInt(apt.time.split(':')[0]);
            return aptHour === hour;
        }) || null;
    };

    const getAppointmentsForDay = (date: Date): Appointment[] => {
        const dateStr = formatDate(date);
        return appointments.filter(apt => apt.date === dateStr);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed':
                return 'border-primary bg-primary/5 text-primary-dark';
            case 'pending':
                return 'border-yellow-500 bg-yellow-50 text-yellow-700';
            case 'cancelled':
                return 'border-neutral-300 bg-neutral-100 text-text-muted';
            case 'completed':
                return 'border-blue-400 bg-blue-50 text-blue-700';
            default:
                return 'border-neutral-300 bg-neutral-50 text-text-secondary';
        }
    };

    /**
     * Devuelve true si el slot (día + hora) está FUERA de la disponibilidad
     * configurada por el profesional.
     * 
     * Reglas:
     *  - Si no hay disponibilidad configurada → false (no pintar nada)
     *  - Si el día no está habilitado → true (fuera)
     *  - Si el día está habilitado pero sin slots → false (disponible todo el día)
     *  - Si hay slots → true solo si la hora no cae en ningún bloque
     */
    const isSlotOutsideAvailability = (day: Date, hour: number): boolean => {
        if (!availability) return false; // Sin config → no marcar nada

        // Usamos getDay() que devuelve 0=Dom, 1=Lun, ..., 6=Sáb
        const dowIndex = day.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        const dayKey = DOW_MAP[dowIndex] as keyof WeekAvailability;
        const dayAvail = availability[dayKey];

        // Día no habilitado → fuera de disponibilidad
        if (!dayAvail || !dayAvail.enabled) return true;

        // Día habilitado pero sin slots configurados → disponible todo el día
        if (!dayAvail.slots || dayAvail.slots.length === 0) return false;

        // Verificar si la hora cae dentro de algún bloque
        const slotStart = hour * 60;       // inicio del slot en minutos
        const slotEnd = slotStart + 60;    // fin del slot (1 hora)

        const covered = dayAvail.slots.some(s => {
            if (!s.start || !s.end) return false;
            const blockStart = parseMinutes(s.start);
            const blockEnd = parseMinutes(s.end);
            if (blockStart >= blockEnd) return false; // rango inválido
            // El slot está cubierto si hay solapamiento
            return slotStart < blockEnd && slotEnd > blockStart;
        });

        return !covered;
    };

    /** Devuelve true si el día completo está fuera de disponibilidad */
    const isDayUnavailable = (day: Date): boolean => {
        if (!availability) return false;
        const dayKey = DOW_MAP[day.getDay()] as keyof WeekAvailability;
        const dayAvail = availability[dayKey];
        return !dayAvail || !dayAvail.enabled;
    };

    /** Devuelve true si hay disponibilidad configurada */
    const hasAvailabilityConfigured = availability !== null;

    const getCurrentTime = () => {
        const now = new Date();
        return now.getHours() + now.getMinutes() / 60;
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSameMonth = (date: Date, referenceMonth: Date) => {
        return date.getMonth() === referenceMonth.getMonth() &&
            date.getFullYear() === referenceMonth.getFullYear();
    };

    const weekDays = getDaysOfWeek(currentWeekStart);
    const endOfWeek = new Date(weekDays[6]);
    const currentTime = getCurrentTime();
    const monthDays = getDaysOfMonth(currentMonth);

    const stats = {
        total: appointments.length,
        pending: appointments.filter(a => a.status === 'pending').length,
        completed: appointments.filter(a => a.status === 'confirmed').length,
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64">Cargando...</div>;
    }

    return (
        <div className="space-y-6 max-w-full">
            {/* Header with Stats */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Calendario de Turnos</h1>
                    <p className="text-text-secondary">Gestiona tu agenda {view === 'week' ? 'semanal' : view === 'day' ? 'diaria' : 'mensual'}</p>
                </div>

                {/* Stats Cards */}
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-3 rounded-lg border border-neutral-100 shadow-sm">
                        <p className="text-xs text-text-muted uppercase font-semibold">Total</p>
                        <p className="text-2xl font-bold text-secondary">{stats.total}</p>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-lg border border-neutral-100 shadow-sm">
                        <p className="text-xs text-text-muted uppercase font-semibold">Pendientes</p>
                        <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-lg border border-neutral-100 shadow-sm">
                        <p className="text-xs text-text-muted uppercase font-semibold">Confirmados</p>
                        <p className="text-2xl font-bold text-primary">{stats.completed}</p>
                    </div>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                    {/* Navigation */}
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" onClick={
                            view === 'week' ? goToPreviousWeek :
                                view === 'day' ? goToPreviousDay :
                                    goToPreviousMonth
                        }>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            <span className="font-bold text-secondary text-lg">
                                {view === 'week' && `Semana del ${currentWeekStart.getDate()} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`}
                                {view === 'day' && `${FULL_DAYS[currentDay.getDay() === 0 ? 6 : currentDay.getDay() - 1]} ${currentDay.getDate()} de ${MONTHS[currentDay.getMonth()]} ${currentDay.getFullYear()}`}
                                {view === 'month' && `${MONTHS[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`}
                            </span>
                        </div>
                        <Button variant="outline" size="icon" onClick={
                            view === 'week' ? goToNextWeek :
                                view === 'day' ? goToNextDay :
                                    goToNextMonth
                        }>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* View Controls */}
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={goToToday}>
                            Hoy
                        </Button>
                        <div className="flex gap-1 bg-neutral-50 rounded-lg p-1">
                            <button
                                onClick={() => setView('day')}
                                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${view === 'day' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-secondary'
                                    }`}
                            >
                                Día
                            </button>
                            <button
                                onClick={() => setView('week')}
                                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${view === 'week' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-secondary'
                                    }`}
                            >
                                Semana
                            </button>
                            <button
                                onClick={() => setView('month')}
                                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${view === 'month' ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-secondary'
                                    }`}
                            >
                                Mes
                            </button>
                        </div>
                    </div>
                </div>

                {/* Banner: sin disponibilidad configurada */}
                {!hasAvailabilityConfigured && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 text-sm">
                        <span className="text-amber-600 font-semibold">⚠️ No tenés disponibilidad configurada.</span>
                        <a href="/panel-profesional/disponibilidad" className="text-primary underline font-medium hover:text-primary-dark">
                            Configurar disponibilidad →
                        </a>
                    </div>
                )}


                {/* Week View */}
                {view === 'week' && (
                    <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
                        {/* Day Headers */}
                        <div className="grid grid-cols-8 border-b border-neutral-200 bg-neutral-50">
                            <div className="p-3 text-xs font-semibold text-text-muted uppercase">Hora</div>
                            {weekDays.map((day, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 text-center border-l border-neutral-200 ${isToday(day) ? 'bg-primary/10' : ''
                                        }`}
                                >
                                    <div className="text-xs font-semibold text-text-muted uppercase">{DAYS[idx]}</div>
                                    <div className={`text-lg font-bold ${isToday(day) ? 'text-primary' : 'text-secondary'}`}>
                                        {day.getDate()}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Time Slots */}
                        <div className="relative">
                            {HOURS.map((hour) => (
                                <div key={hour} className="grid grid-cols-8 border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors">
                                    <div className="p-3 text-sm font-medium text-text-secondary border-r border-neutral-200">
                                        {hour.toString().padStart(2, '0')}:00
                                    </div>

                                    {weekDays.map((day, dayIdx) => {
                                        const appointment = getAppointmentForSlot(day, hour);
                                        const outsideAvail = isSlotOutsideAvailability(day, hour);
                                        return (
                                            <div
                                                key={dayIdx}
                                                onClick={() => handleSlotClick(day, hour)}
                                                className={`p-2 border-l border-neutral-100 min-h-[80px] cursor-pointer transition-colors
                                                    ${outsideAvail
                                                        ? 'bg-amber-50/70 hover:bg-amber-100/60'
                                                        : isToday(day)
                                                            ? 'bg-primary/5 hover:bg-primary/10'
                                                            : 'hover:bg-primary/5'
                                                    }`}
                                            >
                                                {appointment ? (
                                                    <div className={`p-2 rounded-lg border-l-4 ${getStatusColor(appointment.status)} h-full hover:shadow-md transition-shadow`}>
                                                        <p className="text-xs font-bold truncate">{appointment.patientName}</p>
                                                        <p className="text-xs truncate">{appointment.service}</p>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Clock className="h-3 w-3 opacity-60" />
                                                            <span className="text-xs opacity-75">{appointment.duration}min</span>
                                                        </div>
                                                    </div>
                                                ) : outsideAvail ? (
                                                    <div className="h-full flex items-center justify-center">
                                                        <span className="text-xs text-amber-400 opacity-60 select-none">—</span>
                                                    </div>
                                                ) : (
                                                    <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                        <Plus className="h-4 w-4 text-primary" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}

                            {/* Current Time Indicator */}
                            {isToday(new Date()) && currentTime >= 7 && currentTime <= 21 && (
                                <div
                                    className="absolute left-20 right-0 h-0.5 bg-accent pointer-events-none z-10"
                                    style={{ top: `${((currentTime - 7) / 14) * 100}%` }}
                                >
                                    <div className="absolute -left-2 -top-1.5 w-3 h-3 rounded-full bg-accent"></div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Day View */}
                {view === 'day' && (
                    <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
                        <div className="bg-neutral-50 p-4 border-b border-neutral-200">
                            <h3 className="font-bold text-lg text-secondary">
                                {FULL_DAYS[currentDay.getDay() === 0 ? 6 : currentDay.getDay() - 1]} {currentDay.getDate()}
                            </h3>
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {HOURS.map((hour) => {
                                const appointment = getAppointmentForSlot(currentDay, hour);
                                const outsideAvail = isSlotOutsideAvailability(currentDay, hour);
                                return (
                                    <div
                                        key={hour}
                                        onClick={() => handleSlotClick(currentDay, hour)}
                                        className={`p-4 cursor-pointer transition-colors flex items-center gap-4 border-b border-neutral-100
                                            ${outsideAvail
                                                ? 'bg-amber-50/70 hover:bg-amber-100/60'
                                                : 'hover:bg-neutral-50'
                                            }`}
                                    >
                                        <div className="w-20 text-sm font-medium text-text-secondary">
                                            {hour.toString().padStart(2, '0')}:00
                                        </div>
                                        <div className="flex-1">
                                            {appointment ? (
                                                <div className={`p-3 rounded-lg border-l-4 ${getStatusColor(appointment.status)}`}>
                                                    <p className="font-bold">{appointment.patientName}</p>
                                                    <p className="text-sm">{appointment.service}</p>
                                                    <div className="flex items-center gap-2 mt-1 text-xs opacity-75">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{appointment.duration} minutos</span>
                                                    </div>
                                                </div>
                                            ) : outsideAvail ? (
                                                <div className="text-amber-400 text-sm flex items-center gap-2 opacity-60">
                                                    <span>— Fuera de disponibilidad</span>
                                                </div>
                                            ) : (
                                                <div className="text-text-muted text-sm flex items-center gap-2">
                                                    <Plus className="h-4 w-4 text-primary" />
                                                    <span>Disponible - Click para agendar</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Month View */}
                {view === 'month' && (
                    <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
                        {/* Day Names Header */}
                        <div className="grid grid-cols-7 bg-neutral-50 border-b border-neutral-200">
                            {DAYS.map((day, idx) => (
                                <div key={idx} className="p-2 text-center text-xs font-semibold text-text-muted uppercase border-r border-neutral-100 last:border-r-0">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Month Days Grid */}
                        <div className="grid grid-cols-7">
                            {monthDays.map((day, idx) => {
                                const dayAppts = getAppointmentsForDay(day);
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const dayUnavail = isDayUnavailable(day);

                                return (
                                    <div
                                        key={idx}
                                        className={`min-h-[100px] p-2 border-r border-b border-neutral-100
                                            ${!isCurrentMonth ? 'bg-neutral-50/50' : ''}
                                            ${isToday(day) ? 'bg-primary/5' : ''}
                                            ${dayUnavail && isCurrentMonth ? 'bg-amber-50/60' : ''}
                                        `}
                                    >
                                        <div className={`text-sm font-semibold mb-1 flex items-center justify-between ${isToday(day) ? 'text-primary' :
                                            !isCurrentMonth ? 'text-text-muted' : 'text-secondary'
                                            }`}>
                                            <span>{day.getDate()}</span>
                                            {dayUnavail && isCurrentMonth && (
                                                <span className="text-[9px] font-normal text-amber-500 bg-amber-100 px-1 rounded">
                                                    No disponible
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            {dayAppts.slice(0, 3).map((apt, aptIdx) => (
                                                <div
                                                    key={aptIdx}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedAppointment(apt);
                                                        setRescheduleDate(apt.date);
                                                        setRescheduleTime(apt.time);
                                                        setIsRescheduling(false);
                                                        setShowDetailModal(true);
                                                    }}
                                                    className={`text-xs p-1 rounded border-l-2 cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(apt.status)}`}
                                                >
                                                    <div className="font-medium truncate">{apt.time} - {apt.patientName}</div>
                                                </div>
                                            ))}
                                            {dayAppts.length > 3 && (
                                                <div className="text-xs text-text-muted">
                                                    +{dayAppts.length - 3} más
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Legend */}
                <div className="flex items-center gap-6 mt-4 text-sm flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-l-4 border-primary bg-primary/5"></div>
                        <span className="text-text-secondary">Confirmado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-l-4 border-yellow-500 bg-yellow-50"></div>
                        <span className="text-text-secondary">Pendiente</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-l-4 border-blue-400 bg-blue-50"></div>
                        <span className="text-text-secondary">Completado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-l-4 border-neutral-300 bg-neutral-100"></div>
                        <span className="text-text-secondary">Cancelado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-50 border border-amber-200"></div>
                        <span className="text-text-secondary">Fuera de disponibilidad</span>
                    </div>
                </div>

                {/* Empty State */}
                {appointments.length === 0 && (
                    <div className="text-center py-12 text-text-muted">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-lg font-medium">No hay turnos programados</p>
                        <p className="text-sm">Haz click en un horario para crear un turno</p>
                    </div>
                )}
            </div>

            {/* ── Modal Detalle / Edición de Turno ── */}
            {showDetailModal && selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                        {/* Header con color según estado */}
                        <div className={`p-5 ${selectedAppointment.status === 'confirmed' ? 'bg-primary/10 border-b border-primary/20' :
                            selectedAppointment.status === 'pending' ? 'bg-amber-50 border-b border-amber-200' :
                                selectedAppointment.status === 'completed' ? 'bg-blue-50 border-b border-blue-200' :
                                    'bg-neutral-100 border-b border-neutral-200'
                            }`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selectedAppointment.status === 'confirmed' ? 'bg-primary text-white' :
                                            selectedAppointment.status === 'pending' ? 'bg-amber-500 text-white' :
                                                selectedAppointment.status === 'completed' ? 'bg-blue-500 text-white' :
                                                    'bg-neutral-400 text-white'
                                            }`}>
                                            {selectedAppointment.status === 'confirmed' ? 'Confirmado' :
                                                selectedAppointment.status === 'pending' ? 'Pendiente' :
                                                    selectedAppointment.status === 'completed' ? 'Completado' : 'Cancelado'}
                                        </span>
                                        <span className="text-xs text-text-muted capitalize">
                                            {selectedAppointment.source === 'booking' ? '· Reserva de usuario' : '· Agendado por vos'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-secondary">{selectedAppointment.patientName}</h3>
                                    <p className="text-sm text-text-secondary">{selectedAppointment.service}</p>
                                </div>
                                <button
                                    onClick={() => { setShowDetailModal(false); setIsRescheduling(false); }}
                                    className="text-text-muted hover:text-secondary p-1"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Info del turno */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-neutral-50 rounded-lg p-3">
                                    <p className="text-xs text-text-muted mb-1">Fecha</p>
                                    <p className="font-semibold text-secondary text-sm">{selectedAppointment.date}</p>
                                </div>
                                <div className="bg-neutral-50 rounded-lg p-3">
                                    <p className="text-xs text-text-muted mb-1">Hora</p>
                                    <p className="font-semibold text-secondary text-sm">{selectedAppointment.time}hs · {selectedAppointment.duration}min</p>
                                </div>
                                {selectedAppointment.patientEmail && (
                                    <div className="bg-neutral-50 rounded-lg p-3 col-span-2">
                                        <p className="text-xs text-text-muted mb-1">Email del paciente</p>
                                        <p className="font-semibold text-secondary text-sm">{selectedAppointment.patientEmail}</p>
                                    </div>
                                )}
                                {selectedAppointment.notes && (
                                    <div className="bg-neutral-50 rounded-lg p-3 col-span-2">
                                        <p className="text-xs text-text-muted mb-1">Notas</p>
                                        <p className="text-secondary text-sm">{selectedAppointment.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Cambiar Estado */}
                            {!isRescheduling && (
                                <div>
                                    <p className="text-xs font-semibold text-text-muted uppercase mb-2">Cambiar Estado</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {selectedAppointment.status !== 'confirmed' && (
                                            <button
                                                onClick={() => handleUpdateStatus('confirmed')}
                                                disabled={updatingStatus}
                                                className="flex items-center justify-center gap-2 px-3 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors disabled:opacity-50"
                                            >
                                                ✓ Confirmar
                                            </button>
                                        )}
                                        {selectedAppointment.status !== 'completed' && (
                                            <button
                                                onClick={() => handleUpdateStatus('completed')}
                                                disabled={updatingStatus}
                                                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50"
                                            >
                                                ✓ Completar
                                            </button>
                                        )}
                                        {selectedAppointment.status !== 'pending' && (
                                            <button
                                                onClick={() => handleUpdateStatus('pending')}
                                                disabled={updatingStatus}
                                                className="flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
                                            >
                                                ⏳ Pendiente
                                            </button>
                                        )}
                                        {selectedAppointment.status !== 'cancelled' && (
                                            <button
                                                onClick={() => handleUpdateStatus('cancelled')}
                                                disabled={updatingStatus}
                                                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                                            >
                                                ✕ Cancelar
                                            </button>
                                        )}
                                    </div>
                                    {updatingStatus && (
                                        <p className="text-xs text-text-muted text-center mt-2">Actualizando...</p>
                                    )}
                                </div>
                            )}

                            {/* Reagendar */}
                            {!isRescheduling ? (
                                <button
                                    onClick={() => setIsRescheduling(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-primary/40 text-primary rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors"
                                >
                                    <Clock className="h-4 w-4" />
                                    Reagendar turno
                                </button>
                            ) : (
                                <div className="border border-primary/30 rounded-xl p-4 bg-primary/5">
                                    <p className="text-sm font-bold text-secondary mb-3 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-primary" />
                                        Nueva fecha y hora
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="text-xs text-text-muted mb-1 block">Fecha</label>
                                            <input
                                                type="date"
                                                value={rescheduleDate}
                                                onChange={(e) => setRescheduleDate(e.target.value)}
                                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-text-muted mb-1 block">Hora</label>
                                            <input
                                                type="time"
                                                value={rescheduleTime}
                                                onChange={(e) => setRescheduleTime(e.target.value)}
                                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsRescheduling(false)}
                                            className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-text-secondary hover:bg-neutral-50 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleReschedule}
                                            disabled={rescheduling || !rescheduleDate || !rescheduleTime}
                                            className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                                        >
                                            {rescheduling ? 'Guardando...' : 'Confirmar reagenda'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Appointment Modal */}
            {showCreateModal && selectedSlot && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-secondary">Crear Turno</h3>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setSelectedSlot(null);
                                }}
                                className="text-text-muted hover:text-secondary"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                    Fecha y Hora
                                </label>
                                <div className="p-3 bg-neutral-50 rounded-lg text-sm text-secondary font-medium">
                                    {selectedSlot.date} a las {selectedSlot.time}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                    Nombre del Paciente *
                                </label>
                                <input
                                    type="text"
                                    value={newAppointment.patientName}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, patientName: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Juan Pérez"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                    Email del Paciente (opcional)
                                </label>
                                <input
                                    type="email"
                                    value={newAppointment.patientEmail}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, patientEmail: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="paciente@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                    Servicio *
                                </label>
                                <input
                                    type="text"
                                    value={newAppointment.service}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, service: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Consulta general, Masaje, etc."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                    Duración (minutos)
                                </label>
                                <select
                                    value={newAppointment.duration}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, duration: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value={30}>30 minutos</option>
                                    <option value={45}>45 minutos</option>
                                    <option value={60}>60 minutos</option>
                                    <option value={90}>90 minutos</option>
                                    <option value={120}>120 minutos</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                    Notas (opcional)
                                </label>
                                <textarea
                                    value={newAppointment.notes}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                    rows={3}
                                    placeholder="Notas adicionales sobre el turno..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setSelectedSlot(null);
                                    }}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleCreateAppointment}
                                    disabled={creating}
                                    className="flex-1"
                                >
                                    {creating ? "Creando..." : "Crear Turno"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
