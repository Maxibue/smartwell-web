"use client";

import { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { callProtectedAPI } from "@/lib/admin-api";
import { Search, Mail, Calendar, Loader2, Eye, ChevronDown, Check, Users, Shield, Stethoscope } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type UserStatus = "active" | "under_review" | "rejected" | "inactive";
type UserRole = "user" | "admin" | "professional";

interface UserData {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    image?: string;
    phone?: string;
    createdAt: Date;
}

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string; dot: string }> = {
    active: { label: "Activo", color: "text-green-700 bg-green-50 border-green-200", dot: "bg-green-500" },
    under_review: { label: "En Revisión", color: "text-blue-700 bg-blue-50 border-blue-200", dot: "bg-blue-500" },
    rejected: { label: "Rechazado", color: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500" },
    inactive: { label: "Inactivo", color: "text-neutral-600 bg-neutral-100 border-neutral-300", dot: "bg-neutral-400" },
};

const ROLE_CONFIG: Record<UserRole, { label: string; icon: any; color: string }> = {
    user: { label: "Usuario", icon: Users, color: "text-blue-600 bg-blue-50" },
    admin: { label: "Admin", icon: Shield, color: "text-purple-600 bg-purple-50" },
    professional: { label: "Profesional", icon: Stethoscope, color: "text-teal-600 bg-teal-50" },
};

const ALL_STATUSES: UserStatus[] = ["active", "under_review", "rejected", "inactive"];

function StatusDropdown({
    userId,
    currentStatus,
    currentUser,
    onChanged,
}: {
    userId: string;
    currentStatus: UserStatus;
    currentUser: FirebaseUser;
    onChanged: (s: UserStatus) => void;
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50 cursor-pointer ${cfg.color}`}
            >
                {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                    <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
                )}
                {cfg.label}
                <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute z-50 mt-1 left-0 w-44 bg-white rounded-xl shadow-lg border border-neutral-200 py-1">
                    {ALL_STATUSES.map((s) => {
                        const c = STATUS_CONFIG[s];
                        return (
                            <button
                                key={s}
                                onClick={() => handleSelect(s)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-neutral-50 transition-colors text-left"
                            >
                                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${c.dot}`} />
                                <span className={`font-medium`}>{c.label}</span>
                                {s === currentStatus && <Check className="h-3 w-3 ml-auto text-neutral-400" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function UsuariosPage() {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [users, setUsers] = useState<UserData[]>([]);
    const [filtered, setFiltered] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => { setCurrentUser(u); fetchUsers(); });
        return () => unsub();
    }, []);

    useEffect(() => {
        let result = users;
        if (searchTerm) {
            const t = searchTerm.toLowerCase();
            result = result.filter(
                (u) => u.name.toLowerCase().includes(t) || u.email.toLowerCase().includes(t)
            );
        }
        if (statusFilter !== "all") result = result.filter((u) => u.status === statusFilter);
        if (roleFilter !== "all") result = result.filter((u) => u.role === roleFilter);
        setFiltered(result);
    }, [searchTerm, statusFilter, roleFilter, users]);

    const fetchUsers = async () => {
        try {
            const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
            const data: UserData[] = snap.docs.map((d) => {
                const u = d.data();
                return {
                    id: d.id,
                    name: u.name || "Sin nombre",
                    email: u.email || "",
                    role: u.role || "user",
                    status: u.status || "active",
                    image: u.image || u.photoURL,
                    phone: u.phone,
                    createdAt: u.createdAt?.toDate() || new Date(),
                };
            });
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChanged = (userId: string, newStatus: UserStatus) => {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
    };

    const now = new Date();
    const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const stats = {
        total: users.length,
        newThisMonth: users.filter((u) => u.createdAt >= firstThisMonth).length,
        active: users.filter((u) => u.status === "active").length,
        under_review: users.filter((u) => u.status === "under_review").length,
        rejected: users.filter((u) => u.status === "rejected").length,
        inactive: users.filter((u) => u.status === "inactive").length,
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
                <h1 className="text-3xl font-bold text-secondary">Gestión de Usuarios</h1>
                <p className="text-text-secondary mt-1">Ver y gestionar todos los usuarios de la plataforma</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-neutral-100 p-5 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-text-secondary">Total Usuarios</p>
                        <p className="text-3xl font-bold text-secondary mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl"><Mail className="h-6 w-6 text-blue-600" /></div>
                </div>
                <div className="bg-white rounded-xl border border-neutral-100 p-5 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-text-secondary">Nuevos Este Mes</p>
                        <p className="text-3xl font-bold text-secondary mt-1">{stats.newThisMonth}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-xl"><Calendar className="h-6 w-6 text-green-600" /></div>
                </div>
                <div className="bg-white rounded-xl border border-neutral-100 p-5 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-text-secondary">Activos</p>
                        <p className="text-3xl font-bold text-secondary mt-1">{stats.active}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl"><Users className="h-6 w-6 text-emerald-600" /></div>
                </div>
            </div>

            {/* Status filter pills */}
            <div className="flex flex-wrap gap-2">
                {[
                    { label: "Todos", value: "all", count: stats.total, dot: "bg-neutral-400" },
                    { label: "Activos", value: "active", count: stats.active, dot: "bg-green-500" },
                    { label: "En Revisión", value: "under_review", count: stats.under_review, dot: "bg-blue-500" },
                    { label: "Rechazados", value: "rejected", count: stats.rejected, dot: "bg-red-500" },
                    { label: "Inactivos", value: "inactive", count: stats.inactive, dot: "bg-neutral-400" },
                ].map((s) => (
                    <button
                        key={s.value}
                        onClick={() => setStatusFilter(s.value)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${statusFilter === s.value
                                ? "bg-secondary text-white border-secondary"
                                : "bg-white text-text-secondary border-neutral-200 hover:border-neutral-300"
                            }`}
                    >
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                        <span className={`ml-0.5 ${statusFilter === s.value ? "text-white/70" : "text-text-muted"}`}>
                            ({s.count})
                        </span>
                    </button>
                ))}

                <div className="ml-auto flex gap-2">
                    {(["all", "user", "admin", "professional"] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRoleFilter(r)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${roleFilter === r
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-text-secondary border-neutral-200 hover:border-neutral-300"
                                }`}
                        >
                            {r === "all" ? "Todos los roles" : ROLE_CONFIG[r as UserRole]?.label ?? r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Registro</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((user) => {
                                    const roleCfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.user;
                                    const RoleIcon = roleCfg.icon;
                                    return (
                                        <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                                            {/* Usuario */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {user.image ? (
                                                        <img
                                                            src={user.image}
                                                            alt={user.name}
                                                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-secondary text-sm">{user.name}</p>
                                                        <p className="text-xs text-text-muted">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Rol */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleCfg.color}`}>
                                                    <RoleIcon className="h-3 w-3" />
                                                    {roleCfg.label}
                                                </span>
                                            </td>
                                            {/* Estado */}
                                            <td className="px-6 py-4">
                                                {currentUser ? (
                                                    <StatusDropdown
                                                        userId={user.id}
                                                        currentStatus={user.status}
                                                        currentUser={currentUser}
                                                        onChanged={(s) => handleStatusChanged(user.id, s)}
                                                    />
                                                ) : (
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${STATUS_CONFIG[user.status].color}`}>
                                                        {STATUS_CONFIG[user.status].label}
                                                    </span>
                                                )}
                                            </td>
                                            {/* Registro */}
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-text-secondary">
                                                    {user.createdAt.toLocaleDateString("es-AR")}
                                                </p>
                                            </td>
                                            {/* Acciones */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end">
                                                    <Link
                                                        href={`/panel-admin/usuarios/${user.id}`}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Ver ficha del usuario"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
