"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, X } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const FULL_DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

interface Appointment {
    id: string;
    patientName: string;
    patientEmail?: string;
    service: string;
    date: string;
    time: string;
    duration: number;
    status: 'confirmed' | 'pending' | 'cancelled';
}

export default function CalendarPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
    const [currentDay, setCurrentDay] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [view, setView] = useState<'week' | 'day' | 'month'>('week');

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
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchAppointments(currentUser.uid);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

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
                        patientName: data.patientName || "Paciente",
                        patientEmail: data.patientEmail || "",
                        service: data.service || data.treatmentType || "Consulta",
                        date: data.date,
                        time: data.time,
                        duration: data.duration || 60,
                        status: data.status || 'confirmed',
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
                        patientName: data.user?.name || data.patientName || "Paciente",
                        patientEmail: data.user?.email || data.patientEmail || "",
                        service: data.serviceName || data.service || "Consulta",
                        date: data.date,
                        time: data.time,
                        duration: data.duration || 50,
                        status: data.status || 'pending',
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

        // Check if slot is already booked
        const existingAppt = appointments.find(apt =>
            apt.date === dateStr && apt.time === timeStr
        );

        if (!existingAppt) {
            setSelectedSlot({ date: dateStr, time: timeStr });
            setShowCreateModal(true);
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
            default:
                return 'border-neutral-300 bg-neutral-50 text-text-secondary';
        }
    };

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
                                        return (
                                            <div
                                                key={dayIdx}
                                                onClick={() => handleSlotClick(day, hour)}
                                                className={`p-2 border-l border-neutral-100 min-h-[80px] cursor-pointer hover:bg-primary/5 transition-colors ${isToday(day) ? 'bg-primary/5' : ''
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
                                return (
                                    <div
                                        key={hour}
                                        onClick={() => handleSlotClick(currentDay, hour)}
                                        className="p-4 hover:bg-neutral-50 cursor-pointer transition-colors flex items-center gap-4"
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

                                return (
                                    <div
                                        key={idx}
                                        className={`min-h-[100px] p-2 border-r border-b border-neutral-100 ${!isCurrentMonth ? 'bg-neutral-50/50' : ''
                                            } ${isToday(day) ? 'bg-primary/5' : ''}`}
                                    >
                                        <div className={`text-sm font-semibold mb-1 ${isToday(day) ? 'text-primary' :
                                            !isCurrentMonth ? 'text-text-muted' : 'text-secondary'
                                            }`}>
                                            {day.getDate()}
                                        </div>
                                        <div className="space-y-1">
                                            {dayAppts.slice(0, 3).map((apt, aptIdx) => (
                                                <div
                                                    key={aptIdx}
                                                    className={`text-xs p-1 rounded border-l-2 ${getStatusColor(apt.status)}`}
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
                <div className="flex items-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-l-4 border-primary bg-primary/5"></div>
                        <span className="text-text-secondary">Confirmado</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-l-4 border-yellow-500 bg-yellow-50"></div>
                        <span className="text-text-secondary">Pendiente</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-l-4 border-neutral-300 bg-neutral-100"></div>
                        <span className="text-text-secondary">Cancelado</span>
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
