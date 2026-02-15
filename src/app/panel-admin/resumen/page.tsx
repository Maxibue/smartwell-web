"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, UserCheck, Calendar, DollarSign, TrendingUp, Clock, Loader2 } from "lucide-react";

interface Metrics {
    totalUsers: number;
    totalProfessionals: number;
    professionalsPending: number;
    professionalsUnderReview: number;
    professionalsApproved: number;
    totalAppointments: number;
    appointmentsThisMonth: number;
    totalRevenue: number;
    revenueThisMonth: number;
}

export default function ResumenPage() {
    const [metrics, setMetrics] = useState<Metrics>({
        totalUsers: 0,
        totalProfessionals: 0,
        professionalsPending: 0,
        professionalsUnderReview: 0,
        professionalsApproved: 0,
        totalAppointments: 0,
        appointmentsThisMonth: 0,
        totalRevenue: 0,
        revenueThisMonth: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            // Obtener usuarios
            const usersSnap = await getDocs(collection(db, "users"));
            const totalUsers = usersSnap.size;

            // Obtener profesionales
            const professionalsSnap = await getDocs(collection(db, "professionals"));
            const totalProfessionals = professionalsSnap.size;

            let pending = 0;
            let underReview = 0;
            let approved = 0;

            professionalsSnap.forEach((doc) => {
                const status = doc.data().status || "pending";
                if (status === "pending") pending++;
                else if (status === "under_review") underReview++;
                else if (status === "approved") approved++;
            });

            // Obtener turnos (si existe la colección)
            let totalAppointments = 0;
            let appointmentsThisMonth = 0;

            try {
                const appointmentsSnap = await getDocs(collection(db, "appointments"));
                totalAppointments = appointmentsSnap.size;

                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                appointmentsSnap.forEach((doc) => {
                    const data = doc.data();
                    const createdAt = data.createdAt?.toDate();
                    if (createdAt && createdAt >= firstDayOfMonth) {
                        appointmentsThisMonth++;
                    }
                });
            } catch (e) {
                // Colección no existe aún
            }

            // Obtener transacciones (si existe la colección)
            let totalRevenue = 0;
            let revenueThisMonth = 0;

            try {
                const transactionsSnap = await getDocs(collection(db, "transactions"));
                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                transactionsSnap.forEach((doc) => {
                    const data = doc.data();
                    const amount = data.amount || 0;
                    totalRevenue += amount;

                    const createdAt = data.createdAt?.toDate();
                    if (createdAt && createdAt >= firstDayOfMonth) {
                        revenueThisMonth += amount;
                    }
                });
            } catch (e) {
                // Colección no existe aún
            }

            setMetrics({
                totalUsers,
                totalProfessionals,
                professionalsPending: pending,
                professionalsUnderReview: underReview,
                professionalsApproved: approved,
                totalAppointments,
                appointmentsThisMonth,
                totalRevenue,
                revenueThisMonth,
            });
        } catch (error) {
            console.error("Error fetching metrics:", error);
        } finally {
            setLoading(false);
        }
    };

    const metricCards = [
        {
            title: "Usuarios Totales",
            value: metrics.totalUsers,
            icon: Users,
            color: "bg-blue-500",
            textColor: "text-blue-600",
            bgLight: "bg-blue-50",
        },
        {
            title: "Profesionales Totales",
            value: metrics.totalProfessionals,
            icon: UserCheck,
            color: "bg-green-500",
            textColor: "text-green-600",
            bgLight: "bg-green-50",
            subtitle: `${metrics.professionalsApproved} aprobados`,
        },
        {
            title: "Pendientes de Aprobación",
            value: metrics.professionalsPending + metrics.professionalsUnderReview,
            icon: Clock,
            color: "bg-amber-500",
            textColor: "text-amber-600",
            bgLight: "bg-amber-50",
            subtitle: `${metrics.professionalsUnderReview} en revisión`,
        },
        {
            title: "Turnos Este Mes",
            value: metrics.appointmentsThisMonth,
            icon: Calendar,
            color: "bg-purple-500",
            textColor: "text-purple-600",
            bgLight: "bg-purple-50",
            subtitle: `${metrics.totalAppointments} totales`,
        },
        {
            title: "Ingresos Este Mes",
            value: `$${metrics.revenueThisMonth.toLocaleString()}`,
            icon: DollarSign,
            color: "bg-emerald-500",
            textColor: "text-emerald-600",
            bgLight: "bg-emerald-50",
            subtitle: `$${metrics.totalRevenue.toLocaleString()} totales`,
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-secondary">Panel de Administración</h1>
                <p className="text-text-secondary mt-1">Resumen general de la plataforma</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {metricCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-text-secondary mb-1">
                                        {card.title}
                                    </p>
                                    <p className="text-3xl font-bold text-secondary mb-2">
                                        {card.value}
                                    </p>
                                    {card.subtitle && (
                                        <p className="text-xs text-text-muted">{card.subtitle}</p>
                                    )}
                                </div>
                                <div className={`${card.bgLight} p-3 rounded-lg`}>
                                    <Icon className={`h-6 w-6 ${card.textColor}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                <h2 className="text-xl font-bold text-secondary mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a
                        href="/panel-admin/profesionales"
                        className="flex items-center gap-4 p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                        <div className="bg-amber-50 p-3 rounded-lg group-hover:bg-amber-100 transition-colors">
                            <Clock className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-secondary">Revisar Profesionales</p>
                            <p className="text-sm text-text-secondary">
                                {metrics.professionalsPending + metrics.professionalsUnderReview} pendientes
                            </p>
                        </div>
                    </a>

                    <a
                        href="/panel-admin/turnos"
                        className="flex items-center gap-4 p-4 border border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                        <div className="bg-purple-50 p-3 rounded-lg group-hover:bg-purple-100 transition-colors">
                            <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-secondary">Gestionar Turnos</p>
                            <p className="text-sm text-text-secondary">
                                {metrics.appointmentsThisMonth} este mes
                            </p>
                        </div>
                    </a>
                </div>
            </div>

            {/* Actividad Reciente - Placeholder */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                <h2 className="text-xl font-bold text-secondary mb-4">Actividad Reciente</h2>
                <div className="text-center py-8 text-text-muted">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Los registros de actividad aparecerán aquí</p>
                </div>
            </div>
        </div>
    );
}
