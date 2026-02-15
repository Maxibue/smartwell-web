"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { Calendar, Clock, Save, Loader2, Plus, Trash2, Info } from "lucide-react";

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

const DAYS_ES = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
};

const DEFAULT_AVAILABILITY: WeekAvailability = {
    monday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    tuesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    wednesday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    thursday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    friday: { enabled: true, slots: [{ start: "09:00", end: "17:00" }] },
    saturday: { enabled: false, slots: [] },
    sunday: { enabled: false, slots: [] },
};

export default function DisponibilidadPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [availability, setAvailability] = useState<WeekAvailability>(DEFAULT_AVAILABILITY);
    const [sessionDuration, setSessionDuration] = useState(50);
    const [bufferTime, setBufferTime] = useState(10);
    const [professionalId, setProfessionalId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setProfessionalId(user.uid);
                await loadAvailability(user.uid);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loadAvailability = async (uid: string) => {
        try {
            const profDoc = await getDoc(doc(db, "professionals", uid));
            if (profDoc.exists()) {
                const data = profDoc.data();
                if (data.availability) {
                    setAvailability(data.availability);
                }
                if (data.sessionDuration) {
                    setSessionDuration(data.sessionDuration);
                }
                if (data.bufferTime !== undefined) {
                    setBufferTime(data.bufferTime);
                }
            }
        } catch (error) {
            console.error("Error loading availability:", error);
        }
    };

    const toggleDay = (day: keyof WeekAvailability) => {
        setAvailability((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                enabled: !prev[day].enabled,
            },
        }));
    };

    const addTimeSlot = (day: keyof WeekAvailability) => {
        setAvailability((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                slots: [...prev[day].slots, { start: "09:00", end: "17:00" }],
            },
        }));
    };

    const removeTimeSlot = (day: keyof WeekAvailability, index: number) => {
        setAvailability((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                slots: prev[day].slots.filter((_, i) => i !== index),
            },
        }));
    };

    const updateTimeSlot = (
        day: keyof WeekAvailability,
        index: number,
        field: "start" | "end",
        value: string
    ) => {
        setAvailability((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                slots: prev[day].slots.map((slot, i) =>
                    i === index ? { ...slot, [field]: value } : slot
                ),
            },
        }));
    };

    const handleSave = async () => {
        if (!professionalId) return;

        setSaving(true);
        try {
            await updateDoc(doc(db, "professionals", professionalId), {
                availability,
                sessionDuration,
                bufferTime,
                updatedAt: new Date(),
            });

            alert("✅ Disponibilidad guardada correctamente");
        } catch (error) {
            console.error("Error saving availability:", error);
            alert("❌ Error al guardar la disponibilidad");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-secondary">Configurar Disponibilidad</h1>
                <p className="text-text-secondary mt-1">
                    Define tus horarios de atención para que los pacientes puedan reservar turnos
                </p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">¿Cómo funciona?</p>
                    <ul className="space-y-1 text-blue-800">
                        <li>• Activá los días que querés trabajar</li>
                        <li>• Configurá tus horarios de atención</li>
                        <li>• Podés tener múltiples bloques horarios por día</li>
                        <li>• Los pacientes solo verán los horarios disponibles</li>
                    </ul>
                </div>
            </div>

            {/* Session Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Configuración de Sesiones
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-secondary mb-2">
                            Duración de Sesión (minutos)
                        </label>
                        <select
                            value={sessionDuration}
                            onChange={(e) => setSessionDuration(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value={30}>30 minutos</option>
                            <option value={45}>45 minutos</option>
                            <option value={50}>50 minutos</option>
                            <option value={60}>60 minutos</option>
                            <option value={90}>90 minutos</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-secondary mb-2">
                            Tiempo de Descanso (minutos)
                        </label>
                        <select
                            value={bufferTime}
                            onChange={(e) => setBufferTime(Number(e.target.value))}
                            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value={0}>Sin descanso</option>
                            <option value={5}>5 minutos</option>
                            <option value={10}>10 minutos</option>
                            <option value={15}>15 minutos</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Weekly Availability */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Horarios por Día
                </h2>

                <div className="space-y-4">
                    {(Object.keys(availability) as Array<keyof WeekAvailability>).map((day) => (
                        <div
                            key={day}
                            className={`border rounded-lg p-4 transition-all ${availability[day].enabled
                                    ? "border-primary bg-primary/5"
                                    : "border-neutral-200 bg-neutral-50"
                                }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={availability[day].enabled}
                                        onChange={() => toggleDay(day)}
                                        className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary"
                                    />
                                    <span className="font-semibold text-secondary">
                                        {DAYS_ES[day]}
                                    </span>
                                </div>

                                {availability[day].enabled && (
                                    <Button
                                        onClick={() => addTimeSlot(day)}
                                        size="sm"
                                        variant="outline"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Agregar Horario
                                    </Button>
                                )}
                            </div>

                            {availability[day].enabled && (
                                <div className="space-y-2 ml-8">
                                    {availability[day].slots.map((slot, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <input
                                                type="time"
                                                value={slot.start}
                                                onChange={(e) =>
                                                    updateTimeSlot(day, index, "start", e.target.value)
                                                }
                                                className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            <span className="text-text-secondary">a</span>
                                            <input
                                                type="time"
                                                value={slot.end}
                                                onChange={(e) =>
                                                    updateTimeSlot(day, index, "end", e.target.value)
                                                }
                                                className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                            />
                                            {availability[day].slots.length > 1 && (
                                                <button
                                                    onClick={() => removeTimeSlot(day, index)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg">
                    {saving ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="h-5 w-5 mr-2" />
                            Guardar Disponibilidad
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
