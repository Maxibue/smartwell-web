"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Filter } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

interface Appointment {
    id: string;
    patientName: string;
    service: string;
    date: string;
    time: string;
    duration: number; // in minutes
    status: 'confirmed' | 'pending' | 'cancelled';
}

export default function CalendarPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [view, setView] = useState<'week' | 'day' | 'month'>('week');

    // Get Monday of current week
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await fetchAppointments(currentUser.uid);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [currentWeekStart]);

    const fetchAppointments = async (professionalId: string) => {
        try {
            const weekDays = getDaysOfWeek(currentWeekStart);
            const startDate = formatDate(weekDays[0]);
            const endDate = formatDate(weekDays[6]);

            const q = query(
                collection(db, "appointments"),
                where("professionalId", "==", professionalId),
                where("date", ">=", startDate),
                where("date", "<=", endDate)
            );

            const querySnapshot = await getDocs(q);
            const appts: Appointment[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                appts.push({
                    id: doc.id,
                    patientName: data.patientName || "Paciente",
                    service: data.service || data.treatmentType || "Consulta",
                    date: data.date,
                    time: data.time,
                    duration: data.duration || 60,
                    status: data.status || 'confirmed',
                });
            });

            setAppointments(appts);
        } catch (error) {
            console.error("Error fetching appointments:", error);
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

    const goToToday = () => {
        setCurrentWeekStart(getMonday(new Date()));
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

    const weekDays = getDaysOfWeek(currentWeekStart);
    const endOfWeek = new Date(weekDays[6]);
    const currentTime = getCurrentTime();

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
                    <p className="text-text-secondary">Gestiona tu agenda semanal</p>
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
                    {/* Week Navigation */}
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            <span className="font-bold text-secondary text-lg">
                                Semana del {currentWeekStart.getDate()} - {endOfWeek.getDate()} {endOfWeek.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                            </span>
                        </div>
                        <Button variant="outline" size="icon" onClick={goToNextWeek}>
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

                {/* Calendar Grid */}
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
                                {/* Time Label */}
                                <div className="p-3 text-sm font-medium text-text-secondary border-r border-neutral-200">
                                    {hour.toString().padStart(2, '0')}:00
                                </div>

                                {/* Day Cells */}
                                {weekDays.map((day, dayIdx) => {
                                    const appointment = getAppointmentForSlot(day, hour);

                                    return (
                                        <div
                                            key={dayIdx}
                                            className={`p-2 border-l border-neutral-100 min-h-[80px] ${isToday(day) ? 'bg-primary/5' : ''
                                                }`}
                                        >
                                            {appointment && (
                                                <div
                                                    className={`p-2 rounded-lg border-l-4 ${getStatusColor(appointment.status)} h-full cursor-pointer hover:shadow-md transition-shadow`}
                                                >
                                                    <p className="text-xs font-bold truncate">{appointment.patientName}</p>
                                                    <p className="text-xs truncate">{appointment.service}</p>
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Clock className="h-3 w-3 opacity-60" />
                                                        <span className="text-xs opacity-75">{appointment.duration}min</span>
                                                    </div>
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
                                style={{
                                    top: `${((currentTime - 7) / 14) * 100}%`,
                                }}
                            >
                                <div className="absolute -left-2 -top-1.5 w-3 h-3 rounded-full bg-accent"></div>
                            </div>
                        )}
                    </div>
                </div>

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
                        <p className="text-sm">Los turnos de esta semana aparecerán aquí</p>
                    </div>
                )}
            </div>
        </div>
    );
}
