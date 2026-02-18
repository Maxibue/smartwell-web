"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    DollarSign, TrendingUp, Calendar, Download, Loader2,
    ArrowUpRight, ArrowDownRight, User, Stethoscope, Clock
} from "lucide-react";

interface FinancialRecord {
    id: string;
    source: "bookings" | "appointments";
    patientName: string;
    patientEmail: string;
    professionalName: string;
    service: string;
    date: string;
    time: string;
    status: string;
    price: number;
    createdAt: Date;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    pending: { label: "Pendiente", color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-400" },
    confirmed: { label: "Confirmado", color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
    completed: { label: "Completado", color: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500" },
    cancelled: { label: "Cancelado", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
};

function formatARS(amount: number) {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string) {
    if (!dateStr) return "-";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
}

export default function FinancieroPage() {
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        const all: FinancialRecord[] = [];

        // ── 1. Bookings (tienen precio) ──
        try {
            const snap = await getDocs(query(collection(db, "bookings"), orderBy("createdAt", "desc")));
            for (const d of snap.docs) {
                const data = d.data();
                const price = data.servicePrice ?? data.price ?? 0;
                all.push({
                    id: d.id,
                    source: "bookings",
                    patientName: data.user?.name || data.patientName || "Paciente",
                    patientEmail: data.user?.email || data.patientEmail || "",
                    professionalName: data.professionalName || "Profesional",
                    service: data.serviceName || data.service || "Consulta",
                    date: data.date || "",
                    time: data.time || "",
                    status: data.status || "pending",
                    price,
                    createdAt: data.createdAt?.toDate() || new Date(),
                });
            }
        } catch (e) { console.warn("bookings:", e); }

        // ── 2. Appointments (algunos tienen precio) ──
        try {
            const snap = await getDocs(query(collection(db, "appointments"), orderBy("createdAt", "desc")));
            for (const d of snap.docs) {
                const data = d.data();
                const price = data.price ?? data.servicePrice ?? 0;
                all.push({
                    id: d.id,
                    source: "appointments",
                    patientName: data.patientName || "Paciente",
                    patientEmail: data.patientEmail || "",
                    professionalName: data.professionalName || "Profesional",
                    service: data.service || data.serviceName || "Consulta",
                    date: data.date || "",
                    time: data.time || "",
                    status: data.status || "confirmed",
                    price,
                    createdAt: data.createdAt?.toDate() || new Date(),
                });
            }
        } catch (e) { console.warn("appointments:", e); }

        all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setRecords(all);
        setLoading(false);
    };

    // ── Métricas ──
    const now = new Date();
    const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const activeRecords = records.filter((r) => r.status !== "cancelled");
    const totalRevenue = activeRecords.reduce((s, r) => s + r.price, 0);
    const thisMonthRev = activeRecords.filter((r) => r.createdAt >= firstThisMonth).reduce((s, r) => s + r.price, 0);
    const lastMonthRev = activeRecords.filter((r) => r.createdAt >= firstLastMonth && r.createdAt <= lastLastMonth).reduce((s, r) => s + r.price, 0);
    const growth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;

    const totalBookings = records.length;
    const withPrice = records.filter((r) => r.price > 0).length;
    const avgPrice = withPrice > 0 ? totalRevenue / withPrice : 0;

    const lastMonthName = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toLocaleDateString("es-AR", { month: "long", year: "numeric" });

    const handleExport = () => {
        const rows = [
            ["Fecha", "Paciente", "Email", "Profesional", "Servicio", "Hora", "Estado", "Precio"],
            ...records.map((r) => [
                formatDate(r.date),
                r.patientName,
                r.patientEmail,
                r.professionalName,
                r.service,
                r.time,
                r.status,
                r.price.toString(),
            ]),
        ];
        const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `smartwell-financiero-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-secondary">Panel Financiero</h1>
                    <p className="text-text-secondary mt-1">
                        Resumen de ingresos basado en turnos reales ({records.length} registros)
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                >
                    <Download className="h-4 w-4" />
                    Exportar CSV
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-sm text-text-secondary mb-1">Ingresos Totales</p>
                            <p className="text-3xl font-bold text-secondary">{formatARS(totalRevenue)}</p>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-xl">
                            <DollarSign className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-xs text-text-muted">
                        {totalBookings} turnos · {withPrice} con precio registrado
                    </p>
                </div>

                {/* Este mes */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-sm text-text-secondary mb-1">Este Mes</p>
                            <p className="text-3xl font-bold text-secondary">{formatARS(thisMonthRev)}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl">
                            <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {growth >= 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                        <p className={`text-xs font-medium ${growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {Math.abs(growth).toFixed(1)}% vs mes anterior
                        </p>
                    </div>
                </div>

                {/* Mes anterior */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-sm text-text-secondary mb-1">Mes Anterior</p>
                            <p className="text-3xl font-bold text-secondary">{formatARS(lastMonthRev)}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-xl">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-xs text-text-muted capitalize">{lastMonthName}</p>
                </div>
            </div>

            {/* Segunda fila: stats rápidos */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Pendientes", value: records.filter((r) => r.status === "pending").length, color: "text-amber-600" },
                    { label: "Confirmados", value: records.filter((r) => r.status === "confirmed").length, color: "text-blue-600" },
                    { label: "Completados", value: records.filter((r) => r.status === "completed").length, color: "text-green-600" },
                    { label: "Cancelados", value: records.filter((r) => r.status === "cancelled").length, color: "text-red-500" },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl border border-neutral-100 p-4 text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-text-secondary mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Tabla de registros */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-secondary">Todos los Turnos</h2>
                    <span className="text-xs text-text-muted bg-neutral-100 px-2 py-1 rounded-full">
                        {records.length} registros
                    </span>
                </div>

                {records.length === 0 ? (
                    <div className="text-center py-16">
                        <DollarSign className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
                        <p className="text-text-muted font-medium">No hay registros aún</p>
                        <p className="text-sm text-text-muted mt-1">
                            Los datos aparecerán cuando los usuarios comiencen a reservar turnos
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Paciente</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Profesional / Servicio</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Precio</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {records.map((r) => {
                                    const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
                                    return (
                                        <tr key={`${r.source}-${r.id}`} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-sm text-secondary font-medium">{formatDate(r.date)}</p>
                                                        <p className="text-xs text-text-muted">{r.time}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-sm text-secondary font-medium">{r.patientName}</p>
                                                        {r.patientEmail && (
                                                            <p className="text-xs text-text-muted">{r.patientEmail}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <Stethoscope className="h-3.5 w-3.5 text-neutral-400 flex-shrink-0" />
                                                    <div>
                                                        <p className="text-sm text-secondary font-medium">{r.professionalName}</p>
                                                        <p className="text-xs text-text-muted">{r.service}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.color}`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {r.price > 0 ? (
                                                    <p className="text-sm font-bold text-secondary">{formatARS(r.price)}</p>
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
