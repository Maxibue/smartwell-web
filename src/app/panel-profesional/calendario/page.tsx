
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Calendar as CalendarIcon, Save, Trash2, Loader2, Plus, Clock } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

type TimeSlot = { start: string; end: string };
type Schedule = Record<string, TimeSlot[]>;

export default function AvailabilityPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [googleConnected, setGoogleConnected] = useState(false);

    const [schedule, setSchedule] = useState<Schedule>({});

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const docRef = doc(db, "professionals", currentUser.uid, "availability", "weekly");
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setSchedule(docSnap.data().schedule as Schedule);
                    }
                } catch (e) {
                    console.error("Error fetching schedule", e);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await setDoc(doc(db, "professionals", user.uid, "availability", "weekly"), {
                schedule: schedule,
                updatedAt: new Date()
            });
            // In a real app, use a Toast here
            alert("Horarios guardados correctamente.");
        } catch (e) {
            console.error("Error saving schedule", e);
            alert("Hubo un error al guardar los cambios.");
        } finally {
            setSaving(false);
        }
    };

    const handleDayToggle = (day: string) => {
        const newSchedule = { ...schedule };
        if (newSchedule[day]) {
            delete newSchedule[day];
        } else {
            newSchedule[day] = [{ start: "09:00", end: "17:00" }];
        }
        setSchedule(newSchedule);
    };

    const updateSlot = (day: string, index: number, field: keyof TimeSlot, value: string) => {
        const newSchedule = { ...schedule };
        if (newSchedule[day]) {
            newSchedule[day][index] = { ...newSchedule[day][index], [field]: value };
            setSchedule(newSchedule);
        }
    };

    const addSlot = (day: string) => {
        const newSchedule = { ...schedule };
        if (newSchedule[day]) {
            newSchedule[day].push({ start: "14:00", end: "18:00" });
            setSchedule(newSchedule);
        }
    };

    const removeSlot = (day: string, index: number) => {
        const newSchedule = { ...schedule };
        if (newSchedule[day]) {
            newSchedule[day].splice(index, 1);
            if (newSchedule[day].length === 0) {
                delete newSchedule[day];
            }
            setSchedule(newSchedule);
        }
    };

    const handleGoogleConnect = () => {
        alert("Funcionalidad de Google Calendar pendiente de configuración de credenciales API.");
        // setGoogleConnected(true);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8 max-w-4xl">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Disponibilidad Horaria</h1>
                    <p className="text-text-secondary">Configurá tus horarios de atención semanales.</p>
                </div>
            </div>

            {/* Google Calendar Integration Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                        <CalendarIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-secondary text-lg">Google Calendar (Próximamente)</h3>
                        <p className="text-sm text-text-secondary">
                            Sincronización automática para evitar superposiciones.
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleGoogleConnect} disabled>
                    Conectar Google Calendar
                </Button>
            </div>

            {/* Weekly Schedule Builder */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                    <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        <h3 className="font-bold text-secondary">Horarios Semanales</h3>
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="min-w-[140px]">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        {saving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </div>

                <div className="divide-y divide-neutral-100">
                    {DAYS.map((day) => {
                        const daySlots = schedule[day] || [];
                        const isWorking = !!schedule[day];

                        return (
                            <div key={day} className={`p-4 transition-colors ${isWorking ? 'bg-white' : 'bg-neutral-50/30'}`}>
                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                    {/* Day Checkbox */}
                                    <div className="w-32 flex items-center gap-3 pt-2">
                                        <input
                                            type="checkbox"
                                            checked={isWorking}
                                            onChange={() => handleDayToggle(day)}
                                            className="h-5 w-5 text-primary rounded border-neutral-300 focus:ring-primary cursor-pointer"
                                        />
                                        <span className={`font-medium ${isWorking ? "text-secondary" : "text-text-muted"}`}>{day}</span>
                                    </div>

                                    {/* Time Slots */}
                                    <div className="flex-1">
                                        {isWorking ? (
                                            <div className="space-y-3">
                                                {daySlots.map((slot, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                                                        <div className="relative">
                                                            <Input
                                                                type="time"
                                                                className="w-36 h-10 font-mono text-center"
                                                                value={slot.start}
                                                                onChange={(e) => updateSlot(day, idx, 'start', e.target.value)}
                                                            />
                                                        </div>
                                                        <span className="text-text-muted font-medium px-1">-</span>
                                                        <div className="relative">
                                                            <Input
                                                                type="time"
                                                                className="w-36 h-10 font-mono text-center"
                                                                value={slot.end}
                                                                onChange={(e) => updateSlot(day, idx, 'end', e.target.value)}
                                                            />
                                                        </div>

                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeSlot(day, idx)}
                                                            className="h-10 w-10 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                            title="Eliminar horario"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => addSlot(day)}
                                                    className="h-8 text-primary hover:text-primary-dark hover:bg-primary/5 pl-2 mt-2"
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Agregar intervalo
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="py-2">
                                                <span className="text-sm text-text-muted italic bg-neutral-100 px-3 py-1 rounded-full">No disponible</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
