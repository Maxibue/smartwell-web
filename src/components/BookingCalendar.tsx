"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calendar as CalendarIcon, Clock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface TimeSlot {
    start: string;
    end: string;
}

interface DayAvailability {
    enabled: boolean;
    slots: TimeSlot[];
}

interface WeekAvailability {
    monday: DayAvailability;
    tuesday: DayAvailability;
    wednesday: DayAvailability;
    thursday: DayAvailability;
    friday: DayAvailability;
    saturday: DayAvailability;
    sunday: DayAvailability;
}

interface AvailableSlot {
    time: string;
    available: boolean;
}

interface BookingCalendarProps {
    professionalId: string;
    onSelectSlot: (date: Date, time: string) => void;
}

const DAYS_MAP: { [key: number]: keyof WeekAvailability } = {
    0: "sunday",
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
};

const MONTHS_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function BookingCalendar({ professionalId, onSelectSlot }: BookingCalendarProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [availability, setAvailability] = useState<WeekAvailability | null>(null);
    const [sessionDuration, setSessionDuration] = useState(50);
    const [bufferTime, setBufferTime] = useState(10);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        loadProfessionalData();
    }, [professionalId]);

    useEffect(() => {
        if (selectedDate && availability) {
            loadAvailableSlots(selectedDate);
        }
    }, [selectedDate, availability]);

    const loadProfessionalData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Mock Data Fallback
            if (professionalId.startsWith("mock")) {
                const defaultDay = {
                    enabled: true,
                    slots: [{ start: "09:00", end: "17:00" }]
                };

                const mockAvailability: WeekAvailability = {
                    monday: defaultDay,
                    tuesday: defaultDay,
                    wednesday: defaultDay,
                    thursday: defaultDay,
                    friday: defaultDay,
                    saturday: { enabled: false, slots: [] },
                    sunday: { enabled: false, slots: [] }
                };

                setAvailability(mockAvailability);
                setSessionDuration(50);
                setBufferTime(10);
                setLoading(false);
                return;
            }

            const profDoc = await getDoc(doc(db, "professionals", professionalId));
            if (profDoc.exists()) {
                const data = profDoc.data();
                setAvailability(data.availability || null);
                setSessionDuration(data.sessionDuration || 50);
                setBufferTime(data.bufferTime || 10);
            } else {
                setError("No se encontró la información del profesional");
            }
        } catch (error) {
            console.error("Error loading professional data:", error);
            setError("Error al cargar la disponibilidad. Por favor intentá nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableSlots = async (date: Date) => {
        if (!availability) return;

        setLoadingSlots(true);
        try {
            const dayOfWeek = DAYS_MAP[date.getDay()];
            const dayAvailability = availability[dayOfWeek];

            if (!dayAvailability || !dayAvailability.enabled) {
                setAvailableSlots([]);
                setLoadingSlots(false);
                return;
            }

            // Load booked appointments for this date
            const dateStr = date.toISOString().split("T")[0];
            const appointmentsQuery = query(
                collection(db, "appointments"),
                where("professionalId", "==", professionalId),
                where("date", "==", dateStr),
                where("status", "in", ["pending", "confirmed"])
            );

            const appointmentsSnap = await getDocs(appointmentsQuery);
            const booked = appointmentsSnap.docs.map((doc) => doc.data().time);
            setBookedSlots(booked);

            // Generate available time slots
            const slots: AvailableSlot[] = [];
            dayAvailability.slots.forEach((slot) => {
                const startTime = parseTime(slot.start);
                const endTime = parseTime(slot.end);
                let currentTime = startTime;

                while (currentTime + sessionDuration <= endTime) {
                    const timeStr = formatTime(currentTime);
                    slots.push({
                        time: timeStr,
                        available: !booked.includes(timeStr),
                    });
                    currentTime += sessionDuration + bufferTime;
                }
            });

            setAvailableSlots(slots);
        } catch (error) {
            console.error("Error loading available slots:", error);
            setError("Error al cargar los horarios disponibles");
        } finally {
            setLoadingSlots(false);
        }
    };

    const parseTime = (timeStr: string): number => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 60 + minutes;
    };

    const formatTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const isDayAvailable = (date: Date): boolean => {
        if (!availability) return false;
        const dayOfWeek = DAYS_MAP[date.getDay()];
        return availability[dayOfWeek]?.enabled || false;
    };

    const isPastDate = (date: Date): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <CalendarIcon className="h-12 w-12 text-red-600 mx-auto mb-3" />
                <p className="text-red-900 font-semibold mb-2">Error al cargar disponibilidad</p>
                <p className="text-red-700 text-sm">{error}</p>
                <Button
                    onClick={loadProfessionalData}
                    variant="outline"
                    className="mt-4"
                >
                    Reintentar
                </Button>
            </div>
        );
    }

    if (!availability) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                <CalendarIcon className="h-12 w-12 text-amber-600 mx-auto mb-3" />
                <p className="text-amber-900 font-semibold">
                    Este profesional aún no ha configurado su disponibilidad
                </p>
            </div>
        );
    }

    const days = getDaysInMonth(currentMonth);

    return (
        <div className="space-y-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-secondary">Seleccionar Fecha</h3>
                <div className="flex items-center gap-2">
                    <Button onClick={previousMonth} variant="outline" size="sm">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold text-secondary min-w-[180px] text-center">
                        {MONTHS_ES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <Button onClick={nextMonth} variant="outline" size="sm">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
                        <div key={day} className="text-center text-sm font-semibold text-text-secondary">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {days.map((date, index) => {
                        if (!date) {
                            return <div key={`empty-${index}`} />;
                        }

                        const isAvailable = isDayAvailable(date);
                        const isPast = isPastDate(date);
                        const isSelected = selectedDate?.toDateString() === date.toDateString();
                        const isDisabled = !isAvailable || isPast;

                        return (
                            <button
                                key={index}
                                onClick={() => !isDisabled && setSelectedDate(date)}
                                disabled={isDisabled}
                                className={`
                                    aspect-square rounded-lg text-sm font-medium transition-all
                                    ${isSelected
                                        ? "bg-primary text-white shadow-md"
                                        : isDisabled
                                            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                                            : "bg-white hover:bg-primary/10 text-secondary border border-neutral-200"
                                    }
                                `}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h3 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Horarios Disponibles - {selectedDate.toLocaleDateString("es-AR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long"
                        })}
                    </h3>

                    {loadingSlots ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                            <span className="text-text-secondary">Cargando horarios...</span>
                        </div>
                    ) : availableSlots.length === 0 ? (
                        <p className="text-text-secondary text-center py-8">
                            No hay horarios disponibles para este día
                        </p>
                    ) : (
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {availableSlots.map((slot) => (
                                <button
                                    key={slot.time}
                                    onClick={() => slot.available && onSelectSlot(selectedDate, slot.time)}
                                    disabled={!slot.available}
                                    className={`
                                        px-4 py-3 rounded-lg text-sm font-medium transition-all
                                        ${slot.available
                                            ? "bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary"
                                            : "bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200"
                                        }
                                    `}
                                >
                                    {slot.time}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
