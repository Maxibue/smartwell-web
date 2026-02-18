"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { cancelAppointmentAdmin } from "@/lib/admin-api";
import { Search, Calendar, Loader2, XCircle, Clock, User, Stethoscope } from "lucide-react";

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

interface UnifiedAppointment {
    id: string;
    source: "appointments" | "bookings";
    // Paciente
    patientName: string;
    patientEmail: string;
    // Profesional
    professionalId: string;
    professionalName: string;
    // Turno
    service: string;
    date: string;        // "YYYY-MM-DD"
    time: string;        // "HH:MM"
    duration?: number;
    status: AppointmentStatus;
    price?: number;
    notes?: string;
    createdAt: Date;
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; dot: string }> = {
    pending: { label: "Pendiente", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
    confirmed: { label: "Confirmado", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
    completed: { label: "Completado", color: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
    cancelled: { label: "Cancelado", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
}

export default function TurnosPage() {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [appointments, setAppointments] = useState<UnifiedAppointment[]>([]);
    const [filtered, setFiltered] = useState<UnifiedAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            fetchAll();
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        let result = appointments;
        if (searchTerm) {
            const t = searchTerm.toLowerCase();
            result = result.filter(
                (a) =>
                    a.patientName.toLowerCase().includes(t) ||
                    a.professionalName.toLowerCase().includes(t) ||
                    a.service.toLowerCase().includes(t) ||
                    a.patientEmail.toLowerCase().includes(t)
            );
        }
        if (statusFilter !== "all") {
            result = result.filter((a) => a.status === statusFilter);
        }
        setFiltered(result);
    }, [searchTerm, statusFilter, appointments]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const all: UnifiedAppointment[] = [];

            // ── 1. Colección "appointments" (creados por profesionales) ──
            try {
                const snap = await getDocs(
                    query(collection(db, "appointments"), orderBy("createdAt", "desc"))
                );
                for (const d of snap.docs) {
                    const data = d.data();
                    // Intentar obtener nombre del profesional si no está en el doc
                    let professionalName = data.professionalName || "";
                    if (!professionalName && data.professionalId) {
                        try {
                            const profDoc = await getDoc(doc(db, "professionals", data.professionalId));
                            if (profDoc.exists()) professionalName = profDoc.data()?.name || "Profesional";
                        } catch { /* silencioso */ }
                    }
                    all.push({
                        id: d.id,
                        source: "appointments",
                        patientName: data.patientName || "Paciente",
                        patientEmail: data.patientEmail || "",
                        professionalId: data.professionalId || "",
                        professionalName: professionalName || "Profesional",
                        service: data.service || data.serviceName || "Consulta",
                        date: data.date || "",
                        time: data.time || "",
                        duration: data.duration,
                        status: data.status || "confirmed",
                        price: data.price,
                        notes: data.notes,
                        createdAt: data.createdAt?.toDate() || new Date(),
                    });
                }
            } catch (e) {
                console.warn("No se pudo leer 'appointments':", e);
            }

            // ── 2. Colección "bookings" (creados por pacientes) ──
            try {
                const snap = await getDocs(
                    query(collection(db, "bookings"), orderBy("createdAt", "desc"))
                );
                for (const d of snap.docs) {
                    const data = d.data();
                    all.push({
                        id: d.id,
                        source: "bookings",
                        patientName: data.user?.name || data.patientName || "Paciente",
                        patientEmail: data.user?.email || data.patientEmail || "",
                        professionalId: data.professionalId || "",
                        professionalName: data.professionalName || "Profesional",
                        service: data.serviceName || data.service || "Consulta",
                        date: data.date || "",
                        time: data.time || "",
                        duration: data.duration,
                        status: data.status || "pending",
                        price: data.servicePrice || data.price,
                        notes: data.notes,
                        createdAt: data.createdAt?.toDate() || new Date(),
                    });
                }
            } catch (e) {
                console.warn("No se pudo leer 'bookings':", e);
            }

            // Ordenar por fecha de creación descendente
            all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setAppointments(all);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (apt: UnifiedAppointment) => {
        if (!currentUser) { alert("Debes estar autenticado."); return; }
        if (!confirm(`¿Cancelar el turno de ${apt.patientName}?`)) return;
        try {
            await cancelAppointmentAdmin(currentUser, apt.id, "Cancelado por administrador");
            setAppointments((prev) =>
                prev.map((a) => (a.id === apt.id ? { ...a, status: "cancelled" } : a))
            );
        } catch (error: any) {
            alert(error.message || "Error al cancelar el turno.");
        }
    };

    const stats = {
        all: appointments.length,
        pending: appointments.filter((a) => a.status === "pending").length,
        confirmed: appointments.filter((a) => a.status === "confirmed").length,
        completed: appointments.filter((a) => a.status === "completed").length,
        cancelled: appointments.filter((a) => a.status === "cancelled").length,
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
                <h1 className="text-3xl font-bold text-secondary">Gestión de Turnos</h1>
                <p className="text-text-secondary mt-1">
                    Todos los turnos de la plataforma ({appointments.length} total)
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: "Todos", value: stats.all, filter: "all", dot: "bg-neutral-400" },
                    { label: "Pendientes", value: stats.pending, filter: "pending", dot: "bg-amber-400" },
                    { label: "Confirmados", value: stats.confirmed, filter: "confirmed", dot: "bg-blue-500" },
                    { label: "Completados", value: stats.completed, filter: "completed", dot: "bg-green-500" },
                    { label: "Cancelados", value: stats.cancelled, filter: "cancelled", dot: "bg-red-500" },
                ].map((stat) => (
                    <button
                        key={stat.filter}
                        onClick={() => setStatusFilter(stat.filter)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${statusFilter === stat.filter
                                ? "border-primary bg-primary/5"
                                : "border-neutral-200 hover:border-neutral-300 bg-white"
                            }`}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`h-2 w-2 rounded-full ${stat.dot}`} />
                            <p className="text-xs text-text-secondary">{stat.label}</p>
                        </div>
                        <p className="text-2xl font-bold text-secondary">{stat.value}</p>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Buscar por paciente, profesional o servicio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                {appointments.length === 0 ? (
                    <div className="text-center py-16">
                        <Calendar className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
                        <p className="text-text-muted font-medium">No hay turnos registrados aún</p>
                        <p className="text-sm text-text-muted mt-1">
                            Los turnos aparecerán aquí cuando los usuarios comiencen a reservar
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Paciente
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Profesional / Servicio
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Fecha y Hora
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Precio
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                                            No se encontraron turnos con ese criterio
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((apt) => {
                                        const cfg = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.pending;
                                        return (
                                            <tr key={`${apt.source}-${apt.id}`} className="hover:bg-neutral-50 transition-colors">
                                                {/* Paciente */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-2">
                                                        <User className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="font-medium text-secondary text-sm">{apt.patientName}</p>
                                                            {apt.patientEmail && (
                                                                <p className="text-xs text-text-muted">{apt.patientEmail}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Profesional / Servicio */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-2">
                                                        <Stethoscope className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="font-medium text-secondary text-sm">{apt.professionalName}</p>
                                                            <p className="text-xs text-text-muted">{apt.service}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Fecha */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-2">
                                                        <Clock className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-medium text-secondary">{formatDate(apt.date)}</p>
                                                            <p className="text-xs text-text-muted">
                                                                {apt.time}
                                                                {apt.duration ? ` · ${apt.duration} min` : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {/* Estado */}
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.color}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                                        {cfg.label}
                                                    </span>
                                                </td>
                                                {/* Precio */}
                                                <td className="px-6 py-4">
                                                    {apt.price != null ? (
                                                        <p className="text-sm font-medium text-secondary">
                                                            ${apt.price.toLocaleString("es-AR")}
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-text-muted">—</p>
                                                    )}
                                                </td>
                                                {/* Acciones */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {apt.status !== "cancelled" && apt.status !== "completed" && (
                                                            <button
                                                                onClick={() => handleCancel(apt)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Cancelar turno"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
