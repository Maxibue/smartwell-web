"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calendar as CalendarIcon, Clock, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

// ─── Zona horaria fija: Buenos Aires ─────────────────────────────────────────
const TZ = "America/Argentina/Buenos_Aires";

/** Retorna la fecha/hora actual en Buenos Aires */
function nowInBA(): Date {
    // Usamos Intl para obtener los componentes de fecha/hora en BA
    const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const get = (t: string) => parts.find(p => p.type === t)?.value ?? "0";
    return new Date(
        Number(get("year")),
        Number(get("month")) - 1,
        Number(get("day")),
        Number(get("hour")),
        Number(get("minute"))
    );
}

/** Retorna "YYYY-MM-DD" de una fecha interpretada en Buenos Aires */
function toDateStrBA(date: Date): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric", month: "2-digit", day: "2-digit",
    }).format(date);
}

/** Retorna el día de la semana (0=Dom…6=Sáb) de una fecha en Buenos Aires */
function getDayOfWeekBA(date: Date): number {
    const dayName = new Intl.DateTimeFormat("en-US", {
        timeZone: TZ,
        weekday: "short",
    }).format(date);
    const map: Record<string, number> = {
        Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    return map[dayName] ?? 0;
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
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
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// ─── Componente ───────────────────────────────────────────────────────────────
export default function BookingCalendar({ professionalId, onSelectSlot }: BookingCalendarProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [availability, setAvailability] = useState<WeekAvailability | null>(null);
    const [sessionDuration, setSessionDuration] = useState(50);
    const [bufferTime, setBufferTime] = useState(10);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState<Date>(() => {
        const ba = nowInBA();
        return new Date(ba.getFullYear(), ba.getMonth(), 1);
    });
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    useEffect(() => {
        loadProfessionalData();
    }, [professionalId]);

    useEffect(() => {
        if (selectedDate && availability) {
            loadAvailableSlots(selectedDate);
        }
    }, [selectedDate, availability]);

    // ── Carga datos del profesional ──────────────────────────────────────────
    const loadProfessionalData = async () => {
        try {
            setLoading(true);
            setError(null);

            if (professionalId.startsWith("mock")) {
                const defaultDay = { enabled: true, slots: [{ start: "09:00", end: "17:00" }] };
                setAvailability({
                    monday: defaultDay, tuesday: defaultDay, wednesday: defaultDay,
                    thursday: defaultDay, friday: defaultDay,
                    saturday: { enabled: false, slots: [] },
                    sunday: { enabled: false, slots: [] },
                });
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
                setBufferTime(data.bufferTime ?? 10);
            } else {
                setError("No se encontró la información del profesional");
            }
        } catch (err) {
            console.error("Error loading professional data:", err);
            setError("Error al cargar la disponibilidad. Por favor intentá nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    // ── Carga horarios disponibles para la fecha seleccionada ────────────────
    const loadAvailableSlots = async (date: Date) => {
        if (!availability) return;
        setLoadingSlots(true);
        setSelectedTime(null);

        try {
            const dayOfWeek = DAYS_MAP[getDayOfWeekBA(date)];
            const dayAvailability = availability[dayOfWeek];

            if (!dayAvailability?.enabled) {
                setAvailableSlots([]);
                return;
            }

            const dateStr = toDateStrBA(date);

            // Consultar turnos ya reservados en AMBAS colecciones
            // NOTA: No filtramos por status en Firestore para evitar requerir índices compuestos.
            // Filtramos en memoria.
            const [apptSnap, bookSnap] = await Promise.all([
                getDocs(query(
                    collection(db, "appointments"),
                    where("professionalId", "==", professionalId),
                    where("date", "==", dateStr),
                )),
                getDocs(query(
                    collection(db, "bookings"),
                    where("professionalId", "==", professionalId),
                    where("date", "==", dateStr),
                )),
            ]);

            // Filtrar en memoria: solo los que bloquean horario (no cancelados)
            const BLOCKING_STATUSES = new Set(["pending", "confirmed", "completed"]);
            const booked = new Set<string>([
                ...apptSnap.docs
                    .filter(d => BLOCKING_STATUSES.has(d.data().status))
                    .map(d => d.data().time as string),
                ...bookSnap.docs
                    .filter(d => BLOCKING_STATUSES.has(d.data().status))
                    .map(d => d.data().time as string),
            ]);


            // Hora actual en BA (para filtrar slots pasados si es hoy)
            const nowBA = nowInBA();
            const todayStr = toDateStrBA(nowBA);
            const isToday = dateStr === todayStr;
            const nowMinutes = nowBA.getHours() * 60 + nowBA.getMinutes();

            // Generar slots — ordenar intervalos por hora de inicio y filtrar inválidos
            const validSlots = [...dayAvailability.slots]
                .filter(slot => slot.start < slot.end)           // descartar slots con start >= end
                .filter(slot => parseTime(slot.start) >= 6 * 60) // descartar horarios de madrugada (antes de 06:00)
                .sort((a, b) => parseTime(a.start) - parseTime(b.start)); // ordenar por inicio

            const slots: AvailableSlot[] = [];
            validSlots.forEach((slot) => {
                const startMin = parseTime(slot.start);
                const endMin = parseTime(slot.end);
                let cur = startMin;

                while (cur + sessionDuration <= endMin) {
                    const timeStr = formatTime(cur);
                    const isPast = isToday && cur <= nowMinutes;
                    slots.push({
                        time: timeStr,
                        available: !booked.has(timeStr) && !isPast,
                    });
                    cur += sessionDuration + bufferTime;
                }
            });


            setAvailableSlots(slots);
        } catch (err) {
            console.error("Error loading available slots:", err);
            setError("Error al cargar los horarios disponibles");
        } finally {
            setLoadingSlots(false);
        }
    };

    // ── Helpers de tiempo ────────────────────────────────────────────────────
    const parseTime = (timeStr: string): number => {
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
    };

    const formatTime = (minutes: number): string => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    };

    // ── Helpers de calendario ────────────────────────────────────────────────
    const getDaysInMonth = (monthDate: Date): (Date | null)[] => {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDow = firstDay.getDay(); // 0=Dom

        const days: (Date | null)[] = [];
        for (let i = 0; i < startDow; i++) days.push(null);
        for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
        return days;
    };

    const isDayAvailable = (date: Date): boolean => {
        if (!availability) return false;
        return availability[DAYS_MAP[getDayOfWeekBA(date)]]?.enabled ?? false;
    };

    /** Un día es "pasado" si en Buenos Aires ya terminó ese día */
    const isPastDate = (date: Date): boolean => {
        const nowBA = nowInBA();
        const todayBA = new Date(nowBA.getFullYear(), nowBA.getMonth(), nowBA.getDate());
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return d < todayBA;
    };

    const isSelectedDate = (date: Date): boolean =>
        selectedDate?.getFullYear() === date.getFullYear() &&
        selectedDate?.getMonth() === date.getMonth() &&
        selectedDate?.getDate() === date.getDate();

    const isTodayBA = (date: Date): boolean => {
        const nowBA = nowInBA();
        return date.getFullYear() === nowBA.getFullYear() &&
            date.getMonth() === nowBA.getMonth() &&
            date.getDate() === nowBA.getDate();
    };

    const previousMonth = () =>
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

    const nextMonth = () =>
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

    // ── Render ───────────────────────────────────────────────────────────────
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
                <Button onClick={loadProfessionalData} variant="outline" className="mt-4">
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
            {/* Timezone notice */}
            <div className="flex items-center gap-2 text-xs text-text-muted bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
                <Clock className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                <span>Todos los horarios están en <strong>hora de Buenos Aires (ART, UTC-3)</strong></span>
            </div>

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
                        <div key={day} className="text-center text-sm font-semibold text-text-secondary py-1">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {days.map((date, index) => {
                        if (!date) return <div key={`empty-${index}`} />;

                        const isAvailable = isDayAvailable(date);
                        const isPast = isPastDate(date);
                        const isSelected = isSelectedDate(date);
                        const isToday = isTodayBA(date);
                        const isDisabled = !isAvailable || isPast;

                        return (
                            <button
                                key={index}
                                onClick={() => !isDisabled && setSelectedDate(date)}
                                disabled={isDisabled}
                                className={`
                                    aspect-square rounded-lg text-sm font-medium transition-all relative
                                    ${isSelected
                                        ? "bg-primary text-white shadow-md scale-105"
                                        : isDisabled
                                            ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                                            : "bg-white hover:bg-primary/10 text-secondary border border-neutral-200 hover:border-primary"
                                    }
                                `}
                            >
                                {date.getDate()}
                                {isToday && !isSelected && (
                                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-text-muted">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded border border-primary bg-white" />
                    <span>Disponible</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-neutral-200" />
                    <span>No disponible</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded bg-primary" />
                    <span>Seleccionado</span>
                </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h3 className="text-lg font-bold text-secondary mb-1 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Horarios Disponibles
                    </h3>
                    <p className="text-sm text-text-muted mb-4 capitalize">
                        {selectedDate.toLocaleDateString("es-AR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            timeZone: TZ,
                        })}
                    </p>

                    {loadingSlots ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                            <span className="text-text-secondary">Cargando horarios...</span>
                        </div>
                    ) : availableSlots.length === 0 ? (
                        <div className="text-center py-8">
                            <Clock className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
                            <p className="text-text-secondary font-medium">No hay horarios disponibles para este día</p>
                            <p className="text-sm text-text-muted mt-1">Probá con otra fecha</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {availableSlots.map((slot) => (
                                    <button
                                        key={slot.time}
                                        onClick={() => {
                                            if (!slot.available) return;
                                            setSelectedTime(slot.time);
                                            onSelectSlot(selectedDate, slot.time);
                                        }}
                                        disabled={!slot.available}
                                        className={`
                                            px-4 py-3 rounded-lg text-sm font-semibold transition-all
                                            ${!slot.available
                                                ? "bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200 line-through"
                                                : selectedTime === slot.time
                                                    ? "bg-primary text-white shadow-md scale-105 border border-primary"
                                                    : "bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/40 hover:scale-105"
                                            }
                                        `}
                                    >
                                        {slot.time}
                                        {!slot.available && (
                                            <span className="block text-xs font-normal mt-0.5">Ocupado</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {selectedTime && (
                                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2 text-sm text-primary font-semibold">
                                    <Clock className="h-4 w-4" />
                                    Horario seleccionado: <strong>{selectedTime} hs</strong>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
