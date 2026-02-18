"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { callProtectedAPI } from "@/lib/admin-api";
import {
    ArrowLeft, Mail, Calendar, Loader2, User as UserIcon,
    Phone, Shield, Stethoscope, Users, ChevronDown, Check,
    Clock, MapPin, FileText, Activity
} from "lucide-react";
import Link from "next/link";

type UserStatus = "active" | "under_review" | "rejected" | "inactive";
type UserRole = "user" | "admin" | "professional";

interface UserDetail {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    image?: string;
    phone?: string;
    address?: string;
    bio?: string;
    createdAt: Date;
    statusUpdatedAt?: Date;
}

interface UserBooking {
    id: string;
    professionalName: string;
    service: string;
    date: string;
    time: string;
    status: string;
    price?: number;
    source: string;
}

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; dot: string }> = {
    active: { label: "Activo", color: "text-green-700 bg-green-50 border-green-200", dot: "bg-green-500" },
    under_review: { label: "En Revisión", color: "text-blue-700 bg-blue-50 border-blue-200", dot: "bg-blue-500" },
    rejected: { label: "Rechazado", color: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500" },
    inactive: { label: "Inactivo", color: "text-neutral-600 bg-neutral-100 border-neutral-300", dot: "bg-neutral-400" },
};

const BOOKING_STATUS: Record<string, { label: string; color: string }> = {
    pending: { label: "Pendiente", color: "bg-amber-50 text-amber-700 border-amber-200" },
    confirmed: { label: "Confirmado", color: "bg-blue-50 text-blue-700 border-blue-200" },
    completed: { label: "Completado", color: "bg-green-50 text-green-700 border-green-200" },
    cancelled: { label: "Cancelado", color: "bg-red-50 text-red-700 border-red-200" },
};

const ROLE_CONFIG: Record<UserRole, { label: string; icon: any; color: string }> = {
    user: { label: "Usuario", icon: Users, color: "text-blue-600 bg-blue-50" },
    admin: { label: "Admin", icon: Shield, color: "text-purple-600 bg-purple-50" },
    professional: { label: "Profesional", icon: Stethoscope, color: "text-teal-600 bg-teal-50" },
};

const ALL_STATUSES: UserStatus[] = ["active", "under_review", "rejected", "inactive"];

function StatusDropdown({
    userId, currentStatus, currentUser, onChanged,
}: {
    userId: string; currentStatus: UserStatus; currentUser: FirebaseUser; onChanged: (s: UserStatus) => void;
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSelect = async (newStatus: UserStatus) => {
        if (newStatus === currentStatus) { setOpen(false); return; }
        setOpen(false);
        setLoading(true);
        try {
            const res = await callProtectedAPI(
                currentUser,
                `/api/admin/users/${userId}/status`,
                { method: "POST", body: { status: newStatus } }
            );
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Error al actualizar");
            }
            onChanged(newStatus);
        } catch (error: any) {
            alert(error.message || "Error al actualizar el estado.");
        } finally {
            setLoading(false);
        }
    };

    const cfg = STATUS_CONFIG[currentStatus];

    return (
        <div ref={ref} className="relative inline-block">
            <button
                onClick={() => setOpen((v) => !v)}
                disabled={loading}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50 cursor-pointer ${cfg.color}`}
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />}
                {cfg.label}
                <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute z-50 mt-2 left-0 w-48 bg-white rounded-xl shadow-xl border border-neutral-200 py-1">
                    {ALL_STATUSES.map((s) => {
                        const c = STATUS_CONFIG[s];
                        return (
                            <button
                                key={s}
                                onClick={() => handleSelect(s)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-neutral-50 transition-colors text-left"
                            >
                                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${c.dot}`} />
                                <span className="font-medium">{c.label}</span>
                                {s === currentStatus && <Check className="h-3.5 w-3.5 ml-auto text-neutral-400" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
}

export default function UserDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.id as string;

    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [user, setUser] = useState<UserDetail | null>(null);
    const [bookings, setBookings] = useState<UserBooking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setCurrentUser(u));
        return () => unsub();
    }, []);

    useEffect(() => {
        if (userId) fetchUserData();
    }, [userId]);

    const fetchUserData = async () => {
        try {
            // Datos del usuario
            const userDoc = await getDoc(doc(db, "users", userId));
            if (!userDoc.exists()) {
                alert("Usuario no encontrado");
                router.push("/panel-admin/usuarios");
                return;
            }
            const d = userDoc.data();
            setUser({
                id: userDoc.id,
                name: d.name || "Sin nombre",
                email: d.email || "",
                role: d.role || "user",
                status: d.status || "active",
                image: d.image || d.photoURL,
                phone: d.phone,
                address: d.address,
                bio: d.bio,
                createdAt: d.createdAt?.toDate() || new Date(),
                statusUpdatedAt: d.statusUpdatedAt?.toDate(),
            });

            // Turnos del usuario (bookings con userId)
            const allBookings: UserBooking[] = [];
            try {
                const bSnap = await getDocs(query(collection(db, "bookings"), where("userId", "==", userId)));
                bSnap.forEach((bd) => {
                    const bData = bd.data();
                    allBookings.push({
                        id: bd.id,
                        source: "bookings",
                        professionalName: bData.professionalName || "Profesional",
                        service: bData.serviceName || bData.service || "Consulta",
                        date: bData.date || "",
                        time: bData.time || "",
                        status: bData.status || "pending",
                        price: bData.servicePrice || bData.price,
                    });
                });
            } catch (e) { /* sin bookings */ }

            // Appointments del usuario
            try {
                const aSnap = await getDocs(query(collection(db, "appointments"), where("userId", "==", userId)));
                aSnap.forEach((ad) => {
                    const aData = ad.data();
                    allBookings.push({
                        id: ad.id,
                        source: "appointments",
                        professionalName: aData.professionalName || "Profesional",
                        service: aData.service || aData.serviceName || "Consulta",
                        date: aData.date || "",
                        time: aData.time || "",
                        status: aData.status || "confirmed",
                        price: aData.price,
                    });
                });
            } catch (e) { /* sin appointments */ }

            allBookings.sort((a, b) => b.date.localeCompare(a.date));
            setBookings(allBookings);
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    const roleCfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.user;
    const RoleIcon = roleCfg.icon;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/panel-admin/usuarios" className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-secondary">Ficha del Usuario</h1>
                    <p className="text-text-secondary mt-1">Información completa y actividad</p>
                </div>
            </div>

            {/* Ficha principal */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                {/* Banner */}
                <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/5" />

                <div className="px-8 pb-8">
                    {/* Avatar + nombre */}
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 -mt-12 mb-6">
                        <div className="flex items-end gap-4">
                            {user.image ? (
                                <img
                                    src={user.image}
                                    alt={user.name}
                                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-md">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="mb-1">
                                <h2 className="text-2xl font-bold text-secondary">{user.name}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleCfg.color}`}>
                                        <RoleIcon className="h-3 w-3" />
                                        {roleCfg.label}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Selector de estado */}
                        <div className="flex flex-col gap-1">
                            <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Estado de la cuenta</p>
                            {currentUser ? (
                                <StatusDropdown
                                    userId={user.id}
                                    currentStatus={user.status}
                                    currentUser={currentUser}
                                    onChanged={(s) => setUser((prev) => prev ? { ...prev, status: s } : prev)}
                                />
                            ) : (
                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${STATUS_CONFIG[user.status].color}`}>
                                    <span className={`h-2.5 w-2.5 rounded-full ${STATUS_CONFIG[user.status].dot}`} />
                                    {STATUS_CONFIG[user.status].label}
                                </span>
                            )}
                            {user.statusUpdatedAt && (
                                <p className="text-xs text-text-muted">
                                    Actualizado: {user.statusUpdatedAt.toLocaleDateString("es-AR")}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Datos de contacto y registro */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="bg-neutral-100 p-2 rounded-lg flex-shrink-0">
                                <Mail className="h-4 w-4 text-neutral-500" />
                            </div>
                            <div>
                                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Email</p>
                                <p className="text-sm font-medium text-secondary mt-0.5">{user.email}</p>
                            </div>
                        </div>

                        {user.phone && (
                            <div className="flex items-start gap-3">
                                <div className="bg-neutral-100 p-2 rounded-lg flex-shrink-0">
                                    <Phone className="h-4 w-4 text-neutral-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Teléfono</p>
                                    <p className="text-sm font-medium text-secondary mt-0.5">{user.phone}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-3">
                            <div className="bg-neutral-100 p-2 rounded-lg flex-shrink-0">
                                <Calendar className="h-4 w-4 text-neutral-500" />
                            </div>
                            <div>
                                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Fecha de Registro</p>
                                <p className="text-sm font-medium text-secondary mt-0.5">
                                    {user.createdAt.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                                </p>
                            </div>
                        </div>

                        {user.address && (
                            <div className="flex items-start gap-3">
                                <div className="bg-neutral-100 p-2 rounded-lg flex-shrink-0">
                                    <MapPin className="h-4 w-4 text-neutral-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Dirección</p>
                                    <p className="text-sm font-medium text-secondary mt-0.5">{user.address}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-start gap-3">
                            <div className="bg-neutral-100 p-2 rounded-lg flex-shrink-0">
                                <Activity className="h-4 w-4 text-neutral-500" />
                            </div>
                            <div>
                                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">Turnos Totales</p>
                                <p className="text-sm font-medium text-secondary mt-0.5">{bookings.length}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="bg-neutral-100 p-2 rounded-lg flex-shrink-0">
                                <UserIcon className="h-4 w-4 text-neutral-500" />
                            </div>
                            <div>
                                <p className="text-xs text-text-muted font-medium uppercase tracking-wider">ID de Usuario</p>
                                <p className="text-xs font-mono text-text-muted mt-0.5 break-all">{user.id}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {user.bio && (
                        <div className="mt-6 pt-6 border-t border-neutral-100">
                            <div className="flex items-start gap-3">
                                <div className="bg-neutral-100 p-2 rounded-lg flex-shrink-0">
                                    <FileText className="h-4 w-4 text-neutral-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted font-medium uppercase tracking-wider mb-1">Descripción</p>
                                    <p className="text-sm text-secondary">{user.bio}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Historial de turnos */}
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-secondary">Historial de Turnos</h2>
                    <span className="text-xs text-text-muted bg-neutral-100 px-2 py-1 rounded-full">
                        {bookings.length} turnos
                    </span>
                </div>

                {bookings.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
                        <p className="text-text-muted">Este usuario no tiene turnos registrados</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Profesional / Servicio</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Fecha y Hora</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Precio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {bookings.map((b) => {
                                    const bCfg = BOOKING_STATUS[b.status] ?? BOOKING_STATUS.pending;
                                    return (
                                        <tr key={`${b.source}-${b.id}`} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-secondary text-sm">{b.professionalName}</p>
                                                <p className="text-xs text-text-muted">{b.service}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-neutral-400" />
                                                    <div>
                                                        <p className="text-sm text-secondary">{formatDate(b.date)}</p>
                                                        <p className="text-xs text-text-muted">{b.time}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold ${bCfg.color}`}>
                                                    {bCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {b.price != null ? (
                                                    <p className="text-sm font-bold text-secondary">
                                                        ${b.price.toLocaleString("es-AR")}
                                                    </p>
                                                ) : (
                                                    <p className="text-xs text-text-muted">—</p>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
