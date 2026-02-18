"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Users, UserCheck, Calendar, DollarSign, TrendingUp,
    Clock, Loader2, Shield, Stethoscope, CheckCircle,
    XCircle, AlertCircle, RefreshCw, Activity
} from "lucide-react";
import Link from "next/link";

interface Metrics {
    // Usuarios
    totalUsers: number;
    newUsersThisMonth: number;
    // Profesionales
    totalProfessionals: number;
    professionalsPending: number;
    professionalsUnderReview: number;
    professionalsApproved: number;
    professionalsRejected: number;
    // Turnos (bookings + appointments)
    totalAppointments: number;
    appointmentsThisMonth: number;
    appointmentsPending: number;
    appointmentsConfirmed: number;
    appointmentsCompleted: number;
    appointmentsCancelled: number;
    // Ingresos (de bookings con servicePrice)
    totalRevenue: number;
    revenueThisMonth: number;
}

interface AuditEntry {
    id: string;
    action: string;
    adminEmail: string;
    targetType: string;
    details: any;
    timestamp: Date;
}

const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string; dot: string }> = {
    approve_professional: { label: "Profesional aprobado", icon: CheckCircle, color: "text-green-600", dot: "bg-green-500" },
    reject_professional: { label: "Profesional rechazado", icon: XCircle, color: "text-red-600", dot: "bg-red-500" },
    UPDATE_PROFESSIONAL_STATUS: { label: "Estado de profesional", icon: RefreshCw, color: "text-blue-600", dot: "bg-blue-500" },
    UPDATE_USER_STATUS: { label: "Estado de usuario", icon: Users, color: "text-purple-600", dot: "bg-purple-500" },
    CANCEL_APPOINTMENT: { label: "Turno cancelado", icon: XCircle, color: "text-red-600", dot: "bg-red-500" },
};

function formatARS(n: number) {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);
}

function timeAgo(date: Date): string {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "hace un momento";
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `hace ${days}d`;
}

export default function ResumenPage() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        const now = new Date();
        const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // ── Usuarios ──
        let totalUsers = 0, newUsersThisMonth = 0;
        try {
            const snap = await getDocs(collection(db, "users"));
            totalUsers = snap.size;
            snap.forEach((d) => {
                const t = d.data().createdAt?.toDate();
                if (t && t >= firstThisMonth) newUsersThisMonth++;
            });
        } catch (e) { console.warn("users:", e); }

        // ── Profesionales ──
        let totalProfessionals = 0, pending = 0, underReview = 0, approved = 0, rejected = 0;
        try {
            const snap = await getDocs(collection(db, "professionals"));
            totalProfessionals = snap.size;
            snap.forEach((d) => {
                const s = d.data().status || "pending";
                if (s === "pending") pending++;
                else if (s === "under_review") underReview++;
                else if (s === "approved") approved++;
                else if (s === "rejected") rejected++;
            });
        } catch (e) { console.warn("professionals:", e); }

        // ── Turnos: bookings + appointments ──
        let totalAppointments = 0, appointmentsThisMonth = 0;
        let apPending = 0, apConfirmed = 0, apCompleted = 0, apCancelled = 0;
        let totalRevenue = 0, revenueThisMonth = 0;

        try {
            const snap = await getDocs(collection(db, "bookings"));
            totalAppointments += snap.size;
            snap.forEach((d) => {
                const data = d.data();
                const t = data.createdAt?.toDate();
                if (t && t >= firstThisMonth) appointmentsThisMonth++;
                const s = data.status || "pending";
                if (s === "pending") apPending++;
                else if (s === "confirmed") apConfirmed++;
                else if (s === "completed") apCompleted++;
                else if (s === "cancelled") apCancelled++;
                // Ingresos de bookings (tienen precio)
                const price = data.servicePrice || data.price || 0;
                if (s !== "cancelled") {
                    totalRevenue += price;
                    if (t && t >= firstThisMonth) revenueThisMonth += price;
                }
            });
        } catch (e) { console.warn("bookings:", e); }

        try {
            const snap = await getDocs(collection(db, "appointments"));
            totalAppointments += snap.size;
            snap.forEach((d) => {
                const data = d.data();
                const t = data.createdAt?.toDate();
                if (t && t >= firstThisMonth) appointmentsThisMonth++;
                const s = data.status || "confirmed";
                if (s === "pending") apPending++;
                else if (s === "confirmed") apConfirmed++;
                else if (s === "completed") apCompleted++;
                else if (s === "cancelled") apCancelled++;
                // Appointments con precio
                const price = data.price || data.servicePrice || 0;
                if (s !== "cancelled" && price > 0) {
                    totalRevenue += price;
                    if (t && t >= firstThisMonth) revenueThisMonth += price;
                }
            });
        } catch (e) { console.warn("appointments:", e); }

        // ── Audit Logs recientes ──
        const logs: AuditEntry[] = [];
        try {
            const snap = await getDocs(
                query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(8))
            );
            snap.forEach((d) => {
                const data = d.data();
                logs.push({
                    id: d.id,
                    action: data.action || "",
                    adminEmail: data.adminEmail || "admin",
                    targetType: data.targetType || "",
                    details: data.details || {},
                    timestamp: data.timestamp?.toDate() || new Date(),
                });
            });
        } catch (e) { console.warn("audit_logs:", e); }

        setMetrics({
            totalUsers, newUsersThisMonth,
            totalProfessionals, professionalsPending: pending,
            professionalsUnderReview: underReview, professionalsApproved: approved,
            professionalsRejected: rejected,
            totalAppointments, appointmentsThisMonth,
            appointmentsPending: apPending, appointmentsConfirmed: apConfirmed,
            appointmentsCompleted: apCompleted, appointmentsCancelled: apCancelled,
            totalRevenue, revenueThisMonth,
        });
        setAuditLogs(logs);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const m = metrics!;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-secondary">Panel de Administración</h1>
                    <p className="text-text-secondary mt-1">Resumen general de la plataforma en tiempo real</p>
                </div>
                <button
                    onClick={fetchAll}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-neutral-100 rounded-lg transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                    Actualizar
                </button>
            </div>

            {/* KPI Row 1: Usuarios y Profesionales */}
            <div>
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Usuarios y Profesionales</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-neutral-100 p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="bg-blue-50 p-2.5 rounded-xl"><Users className="h-5 w-5 text-blue-600" /></div>
                        </div>
                        <p className="text-3xl font-bold text-secondary">{m.totalUsers}</p>
                        <p className="text-sm text-text-secondary mt-1">Usuarios Totales</p>
                        <p className="text-xs text-green-600 mt-1">+{m.newUsersThisMonth} este mes</p>
                    </div>

                    <div className="bg-white rounded-xl border border-neutral-100 p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="bg-teal-50 p-2.5 rounded-xl"><Stethoscope className="h-5 w-5 text-teal-600" /></div>
                        </div>
                        <p className="text-3xl font-bold text-secondary">{m.totalProfessionals}</p>
                        <p className="text-sm text-text-secondary mt-1">Profesionales</p>
                        <p className="text-xs text-text-muted mt-1">{m.professionalsApproved} aprobados</p>
                    </div>

                    <div className="bg-white rounded-xl border border-neutral-100 p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="bg-amber-50 p-2.5 rounded-xl"><Clock className="h-5 w-5 text-amber-600" /></div>
                        </div>
                        <p className="text-3xl font-bold text-secondary">{m.professionalsPending + m.professionalsUnderReview}</p>
                        <p className="text-sm text-text-secondary mt-1">Pendientes Aprobación</p>
                        <p className="text-xs text-text-muted mt-1">{m.professionalsUnderReview} en revisión</p>
                    </div>

                    <div className="bg-white rounded-xl border border-neutral-100 p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="bg-red-50 p-2.5 rounded-xl"><XCircle className="h-5 w-5 text-red-500" /></div>
                        </div>
                        <p className="text-3xl font-bold text-secondary">{m.professionalsRejected}</p>
                        <p className="text-sm text-text-secondary mt-1">Rechazados</p>
                        <p className="text-xs text-text-muted mt-1">profesionales</p>
                    </div>
                </div>
            </div>

            {/* KPI Row 2: Turnos e Ingresos */}
            <div>
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Turnos e Ingresos</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-neutral-100 p-5">
                        <div className="bg-purple-50 p-2.5 rounded-xl w-fit mb-3"><Calendar className="h-5 w-5 text-purple-600" /></div>
                        <p className="text-3xl font-bold text-secondary">{m.totalAppointments}</p>
                        <p className="text-sm text-text-secondary mt-1">Turnos Totales</p>
                        <p className="text-xs text-purple-600 mt-1">{m.appointmentsThisMonth} este mes</p>
                    </div>

                    <div className="bg-white rounded-xl border border-neutral-100 p-5">
                        <div className="bg-blue-50 p-2.5 rounded-xl w-fit mb-3"><CheckCircle className="h-5 w-5 text-blue-600" /></div>
                        <p className="text-3xl font-bold text-secondary">{m.appointmentsConfirmed}</p>
                        <p className="text-sm text-text-secondary mt-1">Confirmados</p>
                        <p className="text-xs text-text-muted mt-1">{m.appointmentsPending} pendientes</p>
                    </div>

                    <div className="bg-white rounded-xl border border-neutral-100 p-5">
                        <div className="bg-emerald-50 p-2.5 rounded-xl w-fit mb-3"><DollarSign className="h-5 w-5 text-emerald-600" /></div>
                        <p className="text-2xl font-bold text-secondary">{formatARS(m.revenueThisMonth)}</p>
                        <p className="text-sm text-text-secondary mt-1">Ingresos Este Mes</p>
                        <p className="text-xs text-text-muted mt-1">{formatARS(m.totalRevenue)} totales</p>
                    </div>

                    <div className="bg-white rounded-xl border border-neutral-100 p-5">
                        <div className="bg-red-50 p-2.5 rounded-xl w-fit mb-3"><XCircle className="h-5 w-5 text-red-500" /></div>
                        <p className="text-3xl font-bold text-secondary">{m.appointmentsCancelled}</p>
                        <p className="text-sm text-text-secondary mt-1">Cancelados</p>
                        <p className="text-xs text-text-muted mt-1">{m.appointmentsCompleted} completados</p>
                    </div>
                </div>
            </div>

            {/* Acciones Rápidas + Actividad Reciente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Acciones Rápidas */}
                <div className="bg-white rounded-xl border border-neutral-100 p-6">
                    <h2 className="text-lg font-bold text-secondary mb-4">Acciones Rápidas</h2>
                    <div className="space-y-3">
                        {[
                            {
                                href: "/panel-admin/profesionales",
                                icon: Clock,
                                iconBg: "bg-amber-50 group-hover:bg-amber-100",
                                iconColor: "text-amber-600",
                                label: "Revisar Profesionales",
                                sub: `${m.professionalsPending + m.professionalsUnderReview} pendientes de aprobación`,
                                badge: m.professionalsPending + m.professionalsUnderReview > 0 ? m.professionalsPending + m.professionalsUnderReview : null,
                            },
                            {
                                href: "/panel-admin/turnos",
                                icon: Calendar,
                                iconBg: "bg-purple-50 group-hover:bg-purple-100",
                                iconColor: "text-purple-600",
                                label: "Gestionar Turnos",
                                sub: `${m.appointmentsThisMonth} este mes · ${m.appointmentsPending} pendientes`,
                                badge: null,
                            },
                            {
                                href: "/panel-admin/usuarios",
                                icon: Users,
                                iconBg: "bg-blue-50 group-hover:bg-blue-100",
                                iconColor: "text-blue-600",
                                label: "Gestionar Usuarios",
                                sub: `${m.totalUsers} usuarios · +${m.newUsersThisMonth} este mes`,
                                badge: null,
                            },
                            {
                                href: "/panel-admin/financiero",
                                icon: DollarSign,
                                iconBg: "bg-emerald-50 group-hover:bg-emerald-100",
                                iconColor: "text-emerald-600",
                                label: "Panel Financiero",
                                sub: `${formatARS(m.revenueThisMonth)} este mes`,
                                badge: null,
                            },
                        ].map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link
                                    key={action.href}
                                    href={action.href}
                                    className="flex items-center gap-4 p-3 border border-neutral-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group"
                                >
                                    <div className={`p-2.5 rounded-lg transition-colors ${action.iconBg}`}>
                                        <Icon className={`h-5 w-5 ${action.iconColor}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-secondary text-sm">{action.label}</p>
                                        <p className="text-xs text-text-muted truncate">{action.sub}</p>
                                    </div>
                                    {action.badge != null && action.badge > 0 && (
                                        <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                            {action.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Actividad Reciente */}
                <div className="bg-white rounded-xl border border-neutral-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-secondary">Actividad Reciente</h2>
                        <Link href="/panel-admin/audit-logs" className="text-xs text-primary hover:underline">
                            Ver todo
                        </Link>
                    </div>

                    {auditLogs.length === 0 ? (
                        <div className="text-center py-8">
                            <Activity className="h-10 w-10 mx-auto text-neutral-300 mb-2" />
                            <p className="text-sm text-text-muted">Sin actividad reciente</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {auditLogs.map((log) => {
                                const cfg = ACTION_CONFIG[log.action] ?? {
                                    label: log.action.replace(/_/g, " ").toLowerCase(),
                                    icon: Activity,
                                    color: "text-neutral-500",
                                    dot: "bg-neutral-400",
                                };
                                const Icon = cfg.icon;
                                const name = log.details?.professionalName || log.details?.userName || log.details?.targetEmail || "";
                                const statusChange = log.details?.newStatus
                                    ? ` → ${log.details.newStatus}`
                                    : "";
                                return (
                                    <div key={log.id} className="flex items-start gap-3">
                                        <div className={`mt-0.5 p-1.5 rounded-lg bg-neutral-50 flex-shrink-0`}>
                                            <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-secondary font-medium leading-tight">
                                                {cfg.label}
                                                {name && <span className="text-text-muted font-normal"> — {name}</span>}
                                            </p>
                                            <p className="text-xs text-text-muted mt-0.5">
                                                {log.adminEmail}{statusChange && <span className="text-blue-600">{statusChange}</span>}
                                                {" · "}{timeAgo(log.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
