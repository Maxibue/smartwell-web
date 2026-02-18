"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { approveProfessional, rejectProfessional } from "@/lib/admin-api";
import {
    ArrowLeft,
    Mail,
    Phone,
    Award,
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Calendar,
    User
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ProfessionalAvatar } from "@/components/ui/ProfessionalAvatar";

interface ProfessionalDetail {
    id: string;
    name: string;
    email: string;
    phone?: string;
    title: string;
    bio?: string;
    specialty: string;
    category: string;
    price: number;
    duration: number;
    image?: string;
    status: "pending" | "under_review" | "approved" | "rejected";
    createdAt: Date;
    reviewRequestedAt?: Date;
    reviewedAt?: Date;
}

export default function ProfessionalDetailPage() {
    const params = useParams();
    const router = useRouter();
    const professionalId = params.id as string;

    const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
    const [professional, setProfessional] = useState<ProfessionalDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            if (professionalId) {
                fetchProfessional();
            }
        });
        return () => unsubscribe();
    }, [professionalId]);

    const fetchProfessional = async () => {
        try {
            const profDoc = await getDoc(doc(db, "professionals", professionalId));

            if (!profDoc.exists()) {
                alert("Profesional no encontrado");
                router.push("/panel-admin/profesionales");
                return;
            }

            const data = profDoc.data();
            setProfessional({
                id: profDoc.id,
                name: data.name || "Sin nombre",
                email: data.email || "",
                phone: data.phone,
                title: data.title || "Sin título",
                bio: data.description || data.bio,
                specialty: data.specialty || "Sin especialidad",
                category: data.category || "Sin categoría",
                price: data.price || 0,
                duration: data.duration || 50,
                image: data.image,
                status: data.status || "pending",
                createdAt: data.createdAt?.toDate() || new Date(),
                reviewRequestedAt: data.reviewRequestedAt?.toDate(),
                reviewedAt: data.reviewedAt?.toDate(),
            });
        } catch (error) {
            console.error("Error fetching professional:", error);
            alert("Error al cargar los datos del profesional");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: "approved" | "rejected") => {
        if (!currentUser) {
            alert("Debes estar autenticado para realizar esta acción.");
            return;
        }

        const confirmed = confirm(
            `¿Estás seguro que querés ${newStatus === "approved" ? "aprobar" : "rechazar"} a ${professional?.name}?`
        );

        if (!confirmed) return;

        setUpdating(true);
        try {
            // ✅ SEGURO: Usar API route protegida con audit logging
            if (newStatus === "approved") {
                await approveProfessional(currentUser, professionalId);
            } else {
                await rejectProfessional(currentUser, professionalId);
            }

            alert(`Profesional ${newStatus === "approved" ? "aprobado" : "rechazado"} correctamente.`);
            fetchProfessional();
        } catch (error: any) {
            console.error("Error updating professional status:", error);
            alert(error.message || "Hubo un error al actualizar el estado.");
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: { label: "Pendiente", color: "bg-amber-100 text-amber-800 border-amber-200" },
            under_review: { label: "En Revisión", color: "bg-blue-100 text-blue-800 border-blue-200" },
            approved: { label: "Aprobado", color: "bg-green-100 text-green-800 border-green-200" },
            rejected: { label: "Rechazado", color: "bg-red-100 text-red-800 border-red-200" },
        };

        const badge = badges[status as keyof typeof badges] || badges.pending;

        return (
            <span className={`px-4 py-2 rounded-lg text-sm font-semibold border ${badge.color}`}>
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

    if (!professional) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/panel-admin/profesionales"
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-secondary">Detalle del Profesional</h1>
                        <p className="text-text-secondary mt-1">Revisar información y aprobar cuenta</p>
                    </div>
                </div>
                {getStatusBadge(professional.status)}
            </div>

            {/* Main Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Profile Image */}
                    <div className="flex-shrink-0">
                        <ProfessionalAvatar
                            name={professional.name}
                            imageUrl={professional.image}
                            size="xl"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-secondary">{professional.name}</h2>
                            <p className="text-lg text-primary font-medium">{professional.title}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-text-secondary" />
                                <div>
                                    <p className="text-xs text-text-muted">Email</p>
                                    <p className="text-sm font-medium text-secondary">{professional.email}</p>
                                </div>
                            </div>

                            {professional.phone && (
                                <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-text-secondary" />
                                    <div>
                                        <p className="text-xs text-text-muted">Teléfono</p>
                                        <p className="text-sm font-medium text-secondary">{professional.phone}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <Award className="h-5 w-5 text-text-secondary" />
                                <div>
                                    <p className="text-xs text-text-muted">Especialidad</p>
                                    <p className="text-sm font-medium text-secondary">{professional.specialty}</p>
                                    <p className="text-xs text-text-muted">{professional.category}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <DollarSign className="h-5 w-5 text-text-secondary" />
                                <div>
                                    <p className="text-xs text-text-muted">Precio por Sesión</p>
                                    <p className="text-sm font-medium text-secondary">${professional.price}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-text-secondary" />
                                <div>
                                    <p className="text-xs text-text-muted">Duración</p>
                                    <p className="text-sm font-medium text-secondary">{professional.duration} min</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-text-secondary" />
                                <div>
                                    <p className="text-xs text-text-muted">Fecha de Registro</p>
                                    <p className="text-sm font-medium text-secondary">
                                        {professional.createdAt.toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bio */}
                {professional.bio && (
                    <div className="mt-6 pt-6 border-t border-neutral-200">
                        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-2">
                            Biografía
                        </h3>
                        <p className="text-secondary leading-relaxed">{professional.bio}</p>
                    </div>
                )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                <h3 className="text-lg font-bold text-secondary mb-4">Historial de Estado</h3>
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-medium text-secondary">Registro completado</p>
                            <p className="text-sm text-text-muted">
                                {professional.createdAt.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {professional.reviewRequestedAt && (
                        <div className="flex items-start gap-4">
                            <div className="bg-amber-100 p-2 rounded-lg">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="font-medium text-secondary">Revisión solicitada</p>
                                <p className="text-sm text-text-muted">
                                    {professional.reviewRequestedAt.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}

                    {professional.reviewedAt && (
                        <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-lg ${professional.status === "approved" ? "bg-green-100" : "bg-red-100"
                                }`}>
                                {professional.status === "approved" ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-secondary">
                                    {professional.status === "approved" ? "Aprobado" : "Rechazado"}
                                </p>
                                <p className="text-sm text-text-muted">
                                    {professional.reviewedAt.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            {(professional.status === "pending" || professional.status === "under_review") && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                    <h3 className="text-lg font-bold text-secondary mb-4">Acciones</h3>
                    <div className="flex gap-4">
                        <Button
                            onClick={() => handleStatusChange("approved")}
                            disabled={updating}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                            {updating ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                                <CheckCircle className="h-5 w-5 mr-2" />
                            )}
                            Aprobar Profesional
                        </Button>
                        <Button
                            onClick={() => handleStatusChange("rejected")}
                            disabled={updating}
                            className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                            {updating ? (
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            ) : (
                                <XCircle className="h-5 w-5 mr-2" />
                            )}
                            Rechazar Profesional
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
