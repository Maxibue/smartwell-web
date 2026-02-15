"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DollarSign, TrendingUp, Calendar, Download, Loader2, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Transaction {
    id: string;
    type: "payment" | "commission" | "withdrawal";
    amount: number;
    professionalId?: string;
    professionalName?: string;
    userId?: string;
    userName?: string;
    appointmentId?: string;
    status: "pending" | "completed" | "failed";
    createdAt: Date;
}

export default function FinancieroPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [revenueThisMonth, setRevenueThisMonth] = useState(0);
    const [revenueLastMonth, setRevenueLastMonth] = useState(0);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const transactionsSnap = await getDocs(
                query(collection(db, "transactions"), orderBy("createdAt", "desc"))
            );

            const transactionsData: Transaction[] = [];
            let total = 0;
            let thisMonth = 0;
            let lastMonth = 0;

            const now = new Date();
            const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

            for (const transactionDoc of transactionsSnap.docs) {
                const data = transactionDoc.data();
                const createdAt = data.createdAt?.toDate() || new Date();
                const amount = data.amount || 0;

                // Calcular totales
                if (data.status === "completed") {
                    total += amount;

                    if (createdAt >= firstDayThisMonth) {
                        thisMonth += amount;
                    }

                    if (createdAt >= firstDayLastMonth && createdAt <= lastDayLastMonth) {
                        lastMonth += amount;
                    }
                }

                transactionsData.push({
                    id: transactionDoc.id,
                    type: data.type || "payment",
                    amount,
                    professionalId: data.professionalId,
                    professionalName: data.professionalName || "Profesional desconocido",
                    userId: data.userId,
                    userName: data.userName || "Usuario desconocido",
                    appointmentId: data.appointmentId,
                    status: data.status || "pending",
                    createdAt,
                });
            }

            setTransactions(transactionsData);
            setTotalRevenue(total);
            setRevenueThisMonth(thisMonth);
            setRevenueLastMonth(lastMonth);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const getTypeLabel = (type: string) => {
        const labels = {
            payment: "Pago",
            commission: "Comisión",
            withdrawal: "Retiro",
        };
        return labels[type as keyof typeof labels] || type;
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: { label: "Pendiente", color: "bg-amber-100 text-amber-800" },
            completed: { label: "Completado", color: "bg-green-100 text-green-800" },
            failed: { label: "Fallido", color: "bg-red-100 text-red-800" },
        };

        const badge = badges[status as keyof typeof badges] || badges.pending;

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    const growthPercentage = revenueLastMonth > 0
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
        : 0;

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
                    <p className="text-text-secondary mt-1">Resumen de ingresos y transacciones</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
                    <Download className="h-4 w-4" />
                    Exportar Reporte
                </button>
            </div>

            {/* Revenue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm text-text-secondary mb-1">Ingresos Totales</p>
                            <p className="text-3xl font-bold text-secondary">
                                ${totalRevenue.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-lg">
                            <DollarSign className="h-6 w-6 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-xs text-text-muted">Desde el inicio de la plataforma</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm text-text-secondary mb-1">Este Mes</p>
                            <p className="text-3xl font-bold text-secondary">
                                ${revenueThisMonth.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {growthPercentage >= 0 ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                        <p className={`text-xs font-medium ${growthPercentage >= 0 ? "text-green-600" : "text-red-600"
                            }`}>
                            {Math.abs(growthPercentage).toFixed(1)}% vs mes anterior
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm text-text-secondary mb-1">Mes Anterior</p>
                            <p className="text-3xl font-bold text-secondary">
                                ${revenueLastMonth.toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-xs text-text-muted">
                        {new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                <div className="p-6 border-b border-neutral-200">
                    <h2 className="text-xl font-bold text-secondary">Transacciones Recientes</h2>
                </div>

                {transactions.length === 0 ? (
                    <div className="text-center py-12">
                        <DollarSign className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
                        <p className="text-text-muted">No hay transacciones registradas aún</p>
                        <p className="text-sm text-text-muted mt-2">
                            Las transacciones aparecerán aquí cuando se procesen pagos
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Usuario
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Profesional
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Monto
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                        Estado
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {transactions.slice(0, 20).map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-secondary">
                                                {transaction.createdAt.toLocaleDateString()}
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                {transaction.createdAt.toLocaleTimeString()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-secondary">
                                                {getTypeLabel(transaction.type)}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-secondary">{transaction.userName}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-secondary">{transaction.professionalName}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-secondary">
                                                ${transaction.amount.toLocaleString()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(transaction.status)}
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
