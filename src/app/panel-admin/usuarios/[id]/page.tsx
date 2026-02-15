"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Mail, Calendar, Loader2, User as UserIcon } from "lucide-react";
import Link from "next/link";

interface UserDetail {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
}

interface UserAppointment {
    id: string;
    professionalName: string;
    date: Date;
    time: string;
    status: string;
    price: number;
}

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [user, setUser] = useState<UserDetail | null>(null);
    const [appointments, setAppointments] = useState<UserAppointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchUserData();
        }
    }, [userId]);

    const fetchUserData = async () => {
        try {
            // Obtener datos del usuario
            const userDoc = await getDoc(doc(db, "users", userId));

            if (!userDoc.exists()) {
                alert("Usuario no encontrado");
                router.push("/panel-admin/usuarios");
                return;
            }

            const userData = userDoc.data();
            setUser({
                id: userDoc.id,
                name: userData.name || "Sin nombre",
                email: userData.email || "",
                role: userData.role || "user",
                createdAt: userData.createdAt?.toDate() || new Date(),
            });

            // Obtener turnos del usuario
            try {
                const appointmentsQuery = query(
                    collection(db, "appointments"),
                    where("userId", "==", userId)
                );
                const appointmentsSnap = await getDocs(appointmentsQuery);

                const appointmentsData: UserAppointment[] = [];
                for (const appointmentDoc of appointmentsSnap.docs) {
                    const data = appointmentDoc.data();

                    // Obtener nombre del profesional
                    let professionalName = "Profesional desconocido";
                    try {
                        const profDoc = await getDoc(doc(db, "professionals", data.professionalId));
                        if (profDoc.exists()) {
                            professionalName = profDoc.data().name || professionalName;
                        }
                    } catch (e) {
                        console.error("Error fetching professional:", e);
                    }

                    appointmentsData.push({
                        id: appointmentDoc.id,
                        professionalName,
                        date: data.date?.toDate() || new Date(),
                        time: data.time || "",
                        status: data.status || "pending",
                        price: data.price || 0,
                    });
                }

                setAppointments(appointmentsData);
            } catch (e) {
                console.error("Error fetching appointments:", e);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            alert("Error al cargar los datos del usuario");
        } finally {
            setLoading(false);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/panel-admin/usuarios"
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-secondary">Detalle del Usuario</h1>
                    <p className="text-text-secondary mt-1">Información y actividad del usuario</p>
                </div>
            </div>

            {/* User Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-8">
                <div className="flex items-start gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-secondary mb-4">{user.name}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-text-secondary" />
                                <div>
                                    <p className="text-xs text-text-muted">Email</p>
                                    <p className="text-sm font-medium text-secondary">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-text-secondary" />
                                <div>
                                    <p className="text-xs text-text-muted">Fecha de Registro</p>
                                    <p className="text-sm font-medium text-secondary">
                                        {user.createdAt.toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <UserIcon className="h-5 w-5 text-text-secondary" />
                                <div>
                                    <p className="text-xs text-text-muted">Rol</p>
                                    <p className="text-sm font-medium text-secondary capitalize">{user.role}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-text-secondary" />
                                <div>
                                    <p className="text-xs text-text-muted">Turnos Totales</p>
                                    <p className="text-sm font-medium text-secondary">{appointments.length}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointments History */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                <div className="p-6 border-b border-neutral-200">
                    <h2 className="text-xl font-bold text-secondary">Historial de Turnos</h2>
                </div>

                {appointments.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
                        <p className="text-text-muted">Este usuario no tiene turnos registrados</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {appointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-neutral-50 transition-colors">
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
