"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { approveProfessional, rejectProfessional } from "@/lib/admin-api";
import { Search, Filter, CheckCircle, XCircle, Eye, Loader2, Clock, UserCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface Professional {
    id: string;
    name: string;
    email: string;
    title: string;
    specialty: string;
    category: string;
    status: "pending" | "under_review" | "approved" | "rejected";
    createdAt: Date;
    reviewRequestedAt?: Date;
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
            const professionalsSnap = await getDocs(
                query(collection(db, "professionals"), orderBy("createdAt", "desc"))
            );

            const profsData: Professional[] = [];
            professionalsSnap.forEach((doc) => {
                const data = doc.data();
                profsData.push({
                    id: doc.id,
                    name: data.name || "Sin nombre",
                    email: data.email || "",
                    title: data.title || "Sin título",
                    specialty: data.specialty || "Sin especialidad",
                    category: data.category || "Sin categoría",
                    status: data.status || "pending",
                    createdAt: data.createdAt?.toDate() || new Date(),
                    reviewRequestedAt: data.reviewRequestedAt?.toDate(),
                });
            });

            setProfessionals(profsData);
        } catch (error) {
            console.error("Error fetching professionals:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterProfessionals = () => {
        let filtered = professionals;

        // Filtrar por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(
                (prof) =>
                    prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    prof.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    prof.specialty.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrar por estado
        if (statusFilter !== "all") {
            filtered = filtered.filter((prof) => prof.status === statusFilter);
        }

        setFilteredProfessionals(filtered);
    };

    const handleStatusChange = async (professionalId: string, newStatus: "approved" | "rejected") => {
        if (!currentUser) {
            alert("Debes estar autenticado para realizar esta acción.");
            return;
        }

        const confirmed = confirm(
            `¿Estás seguro que querés ${newStatus === "approved" ? "aprobar" : "rechazar"} este profesional?`
        );

        if (!confirmed) return;

        try {
            // ✅ SEGURO: Usar API route protegida con audit logging
            if (newStatus === "approved") {
                await approveProfessional(currentUser, professionalId);
            } else {
                await rejectProfessional(currentUser, professionalId);
            }

            alert(`Profesional ${newStatus === "approved" ? "aprobado" : "rechazado"} correctamente.`);
            fetchProfessionals();
        } catch (error: any) {
            console.error("Error updating professional status:", error);
            alert(error.message || "Hubo un error al actualizar el estado.");
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: { label: "Pendiente", color: "bg-amber-100 text-amber-800" },
            under_review: { label: "En Revisión", color: "bg-blue-100 text-blue-800" },
            approved: { label: "Aprobado", color: "bg-green-100 text-green-800" },
            rejected: { label: "Rechazado", color: "bg-red-100 text-red-800" },
        };

        const badge = badges[status as keyof typeof badges] || badges.pending;

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                {badge.label}
            </span>
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
                <p className="text-text-secondary mt-1">Aprobar, rechazar y gestionar profesionales</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: "Todos", value: stats.all, filter: "all" },
                    { label: "Pendientes", value: stats.pending, filter: "pending" },
                    { label: "En Revisión", value: stats.under_review, filter: "under_review" },
                    { label: "Aprobados", value: stats.approved, filter: "approved" },
                    { label: "Rechazados", value: stats.rejected, filter: "rejected" },
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

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o especialidad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
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
                        <tbody className="divide-y divide-neutral-200">
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
                                        <td className="px-6 py-4">{getStatusBadge(prof.status)}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-text-secondary">
                                                {prof.createdAt.toLocaleDateString()}
                                            </p>
                                            {prof.reviewRequestedAt && (
                                                <p className="text-xs text-text-muted">
                                                    Solicitó: {prof.reviewRequestedAt.toLocaleDateString()}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/panel-admin/profesionales/${prof.id}`}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Ver detalle"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                {(prof.status === "pending" || prof.status === "under_review") && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusChange(prof.id, "approved")}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Aprobar"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(prof.id, "rejected")}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Rechazar"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}
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
