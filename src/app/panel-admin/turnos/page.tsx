"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { cancelAppointmentAdmin } from "@/lib/admin-api";
import { Search, Calendar, Filter, Loader2, XCircle, Eye } from "lucide-react";

interface Appointment {
    id: string;
    userId: string;
    userName: string;
    professionalId: string;
    professionalName: string;
    date: Date;
    time: string;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    price: number;
    createdAt: Date;
}

export default function TurnosPage() {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            fetchAppointments();
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        filterAppointments();
    }, [searchTerm, statusFilter, appointments]);

    const fetchAppointments = async () => {
        try {
            // Intentar obtener turnos
            const appointmentsSnap = await getDocs(
                query(collection(db, "appointments"), orderBy("createdAt", "desc"))
            );

            const appointmentsData: Appointment[] = [];

            for (const appointmentDoc of appointmentsSnap.docs) {
                const data = appointmentDoc.data();

                // Obtener nombre del usuario
                let userName = "Usuario desconocido";
                try {
                    const userDoc = await getDocs(query(collection(db, "users")));
                    const user = userDoc.docs.find(d => d.id === data.userId);
                    if (user) userName = user.data().name || userName;
                } catch (e) {
                    console.error("Error fetching user:", e);
                }

                // Obtener nombre del profesional
                let professionalName = "Profesional desconocido";
                try {
                    const profDoc = await getDocs(query(collection(db, "professionals")));
                    const prof = profDoc.docs.find(d => d.id === data.professionalId);
                    if (prof) professionalName = prof.data().name || professionalName;
                } catch (e) {
                    console.error("Error fetching professional:", e);
                }

                appointmentsData.push({
                    id: appointmentDoc.id,
                    userId: data.userId || "",
                    userName,
                    professionalId: data.professionalId || "",
                    professionalName,
                    date: data.date?.toDate() || new Date(),
                    time: data.time || "",
                    status: data.status || "pending",
                    price: data.price || 0,
                    createdAt: data.createdAt?.toDate() || new Date(),
                });
            }

            setAppointments(appointmentsData);
        } catch (error) {
            console.error("Error fetching appointments:", error);
            // Si la colección no existe, dejar vacío
            setAppointments([]);
        } finally {
            setLoading(false);
        }
    };

    const filterAppointments = () => {
        let filtered = appointments;

        if (searchTerm) {
            filtered = filtered.filter(
                (apt) =>
                    apt.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    apt.professionalName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter((apt) => apt.status === statusFilter);
        }

        setFilteredAppointments(filtered);
    };

    const handleCancelAppointment = async (appointmentId: string) => {
        if (!currentUser) {
            alert("Debes estar autenticado para realizar esta acción.");
            return;
        }

        const confirmed = confirm("¿Estás seguro que querés cancelar este turno?");
        if (!confirmed) return;

        try {
            // ✅ SEGURO: Usar API route protegida con audit logging
            await cancelAppointmentAdmin(currentUser, appointmentId, "Cancelado por administrador");

            alert("Turno cancelado correctamente.");
            fetchAppointments();
        } catch (error: any) {
            console.error("Error cancelling appointment:", error);
            alert(error.message || "Hubo un error al cancelar el turno.");
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: { label: "Pendiente", color: "bg-amber-100 text-amber-800" },
            confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-800" },
            completed: { label: "Completado", color: "bg-green-100 text-green-800" },
            cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
        };

        const badge = badges[status as keyof typeof badges] || badges.pending;

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                {badge.label}
            </span>
        );
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
                <p className="text-text-secondary mt-1">Ver y gestionar todos los turnos de la plataforma</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: "Todos", value: stats.all, filter: "all" },
                    { label: "Pendientes", value: stats.pending, filter: "pending" },
                    { label: "Confirmados", value: stats.confirmed, filter: "confirmed" },
                    { label: "Completados", value: stats.completed, filter: "completed" },
                    { label: "Cancelados", value: stats.cancelled, filter: "cancelled" },
                ].map((stat) => (
                    <button
                        key={stat.filter}
                        onClick={() => setStatusFilter(stat.filter)}
                        className={`p-4 rounded-lg border-2 transition-all ${statusFilter === stat.filter
                            ? "border-primary bg-primary/5"
                            : "border-neutral-200 hover:border-neutral-300"
                            }`}
                    >
                        <p className="text-2xl font-bold text-secondary">{stat.value}</p>
                        <p className="text-sm text-text-secondary">{stat.label}</p>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Buscar por usuario o profesional..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                {appointments.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
                        <p className="text-text-muted">No hay turnos registrados aún</p>
                        <p className="text-sm text-text-muted mt-2">
                            Los turnos aparecerán aquí cuando los usuarios comiencen a reservar
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Usuario
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Profesional
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
                            <tbody className="divide-y divide-neutral-200">
                                {filteredAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                                            No se encontraron turnos
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAppointments.map((apt) => (
                                        <tr key={apt.id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-secondary">{apt.userName}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-secondary">{apt.professionalName}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-secondary">
                                                    {apt.date.toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-text-muted">{apt.time}</p>
                                            </td>
                                            <td className="px-6 py-4">{getStatusBadge(apt.status)}</td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-secondary">${apt.price}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {apt.status !== "cancelled" && apt.status !== "completed" && (
                                                        <button
                                                            onClick={() => handleCancelAppointment(apt.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Cancelar turno"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
