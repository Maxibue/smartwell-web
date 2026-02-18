"use client";

import { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { updateProfessionalStatus } from "@/lib/admin-api";
import { Search, Eye, Loader2, ChevronDown, Check } from "lucide-react";
import Link from "next/link";

type ProfessionalStatus = "pending" | "under_review" | "approved" | "rejected";

interface Professional {
    id: string;
    name: string;
    email: string;
    title: string;
    specialty: string;
    category: string;
    status: ProfessionalStatus;
    createdAt: Date;
    reviewRequestedAt?: Date;
}

const STATUS_CONFIG: Record<ProfessionalStatus, { label: string; color: string; bg: string; dot: string }> = {
    pending: { label: "Pendiente", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-400" },
    under_review: { label: "En Revisión", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", dot: "bg-blue-400" },
    approved: { label: "Aprobado", color: "text-green-700", bg: "bg-green-50 border-green-200", dot: "bg-green-500" },
    rejected: { label: "Rechazado", color: "text-red-700", bg: "bg-red-50 border-red-200", dot: "bg-red-500" },
};

const ALL_STATUSES: ProfessionalStatus[] = ["pending", "under_review", "approved", "rejected"];

// Dropdown de cambio de estado inline
function StatusDropdown({
    professionalId,
    currentStatus,
    currentUser,
    onStatusChanged,
}: {
    professionalId: string;
    currentStatus: ProfessionalStatus;
    currentUser: FirebaseUser;
    onStatusChanged: (newStatus: ProfessionalStatus) => void;
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Cerrar al hacer click fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleSelect = async (newStatus: ProfessionalStatus) => {
        if (newStatus === currentStatus) { setOpen(false); return; }
        setOpen(false);
        setLoading(true);
        try {
            await updateProfessionalStatus(currentUser, professionalId, newStatus);
            onStatusChanged(newStatus);
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
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all ${cfg.bg} ${cfg.color} hover:opacity-80 disabled:opacity-50 cursor-pointer select-none`}
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
                <div className="absolute z-50 mt-1 left-0 w-44 bg-white rounded-xl shadow-lg border border-neutral-200 py-1 overflow-hidden">
                    {ALL_STATUSES.map((s) => {
                        const c = STATUS_CONFIG[s];
                        return (
                            <button
                                key={s}
                                onClick={() => handleSelect(s)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-neutral-50 transition-colors text-left"
                            >
                                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${c.dot}`} />
                                <span className={`font-medium ${c.color}`}>{c.label}</span>
                                {s === currentStatus && (
                                    <Check className="h-3 w-3 ml-auto text-neutral-400" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function ProfessionalesPage() {
    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            fetchProfessionals();
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        filterProfessionals();
    }, [searchTerm, statusFilter, professionals]);

    const fetchProfessionals = async () => {
        try {
            const snap = await getDocs(
                query(collection(db, "professionals"), orderBy("createdAt", "desc"))
            );
            const data: Professional[] = snap.docs.map((doc) => {
                const d = doc.data();
                return {
                    id: doc.id,
                    name: d.name || "Sin nombre",
                    email: d.email || "",
                    title: d.title || "Sin título",
                    specialty: d.specialty || "Sin especialidad",
                    category: d.category || "Sin categoría",
                    status: d.status || "pending",
                    createdAt: d.createdAt?.toDate() || new Date(),
                    reviewRequestedAt: d.reviewRequestedAt?.toDate(),
                };
            });
            setProfessionals(data);
        } catch (error) {
            console.error("Error fetching professionals:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterProfessionals = () => {
        let filtered = professionals;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.name.toLowerCase().includes(term) ||
                    p.email.toLowerCase().includes(term) ||
                    p.specialty.toLowerCase().includes(term)
            );
        }
        if (statusFilter !== "all") {
            filtered = filtered.filter((p) => p.status === statusFilter);
        }
        setFilteredProfessionals(filtered);
    };

    // Actualiza el estado localmente sin re-fetch
    const handleStatusChanged = (professionalId: string, newStatus: ProfessionalStatus) => {
        setProfessionals((prev) =>
            prev.map((p) => (p.id === professionalId ? { ...p, status: newStatus } : p))
        );
    };

    const stats = {
        all: professionals.length,
        pending: professionals.filter((p) => p.status === "pending").length,
        under_review: professionals.filter((p) => p.status === "under_review").length,
        approved: professionals.filter((p) => p.status === "approved").length,
        rejected: professionals.filter((p) => p.status === "rejected").length,
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
                <h1 className="text-3xl font-bold text-secondary">Gestión de Profesionales</h1>
                <p className="text-text-secondary mt-1">
                    Gestiona el estado de los profesionales registrados en la plataforma
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: "Todos", value: stats.all, filter: "all", dot: "bg-neutral-400" },
                    { label: "Pendientes", value: stats.pending, filter: "pending", dot: "bg-amber-400" },
                    { label: "En Revisión", value: stats.under_review, filter: "under_review", dot: "bg-blue-400" },
                    { label: "Aprobados", value: stats.approved, filter: "approved", dot: "bg-green-500" },
                    { label: "Rechazados", value: stats.rejected, filter: "rejected", dot: "bg-red-500" },
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
                        placeholder="Buscar por nombre, email o especialidad..."
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
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Profesional
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Especialidad
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Registro
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {filteredProfessionals.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                                        No se encontraron profesionales
                                    </td>
                                </tr>
                            ) : (
                                filteredProfessionals.map((prof) => (
                                    <tr key={prof.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-secondary">{prof.name}</p>
                                                <p className="text-sm text-text-secondary">{prof.email}</p>
                                                <p className="text-xs text-text-muted">{prof.title}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-medium text-secondary">{prof.specialty}</p>
                                                <p className="text-xs text-text-muted">{prof.category}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {currentUser ? (
                                                <StatusDropdown
                                                    professionalId={prof.id}
                                                    currentStatus={prof.status}
                                                    currentUser={currentUser}
                                                    onStatusChanged={(newStatus) =>
                                                        handleStatusChanged(prof.id, newStatus)
                                                    }
                                                />
                                            ) : (
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_CONFIG[prof.status].bg} ${STATUS_CONFIG[prof.status].color}`}>
                                                    {STATUS_CONFIG[prof.status].label}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-text-secondary">
                                                {prof.createdAt.toLocaleDateString("es-AR")}
                                            </p>
                                            {prof.reviewRequestedAt && (
                                                <p className="text-xs text-text-muted">
                                                    Solicitó: {prof.reviewRequestedAt.toLocaleDateString("es-AR")}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end">
                                                <Link
                                                    href={`/panel-admin/profesionales/${prof.id}`}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Ver detalle"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
