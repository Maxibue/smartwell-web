"use client";

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Users, Calendar, Activity } from 'lucide-react';
import { getMonthlyReport, getComparisonStats, MonthlyReport } from '@/lib/professionalStats';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ProfessionalStatsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
    const [comparison, setComparison] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await loadStats(currentUser.uid);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const loadStats = async (uid: string) => {
        setLoading(true);
        try {
            const [report, comp] = await Promise.all([
                getMonthlyReport(uid),
                getComparisonStats(uid),
            ]);
            setMonthlyReport(report);
            setComparison(comp);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!monthlyReport) {
        return (
            <div className="text-center py-12">
                <p className="text-text-secondary">No hay datos disponibles</p>
            </div>
        );
    }

    const StatCard = ({ title, value, change, icon: Icon, color }: any) => {
        const isPositive = change >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${color}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                    {change !== undefined && (
                        <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            <TrendIcon className="h-4 w-4" />
                            {Math.abs(change).toFixed(1)}%
                        </div>
                    )}
                </div>
                <h3 className="text-sm font-medium text-text-secondary mb-1">{title}</h3>
                <p className="text-2xl font-bold text-secondary">{value}</p>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-secondary">Estadísticas y Reportes</h1>
                <p className="text-text-secondary">Análisis detallado de tu actividad - {monthlyReport.month}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Sesiones Totales"
                    value={monthlyReport.totalSessions}
                    change={comparison?.changes.sessions}
                    icon={Calendar}
                    color="bg-blue-50 text-blue-600"
                />
                <StatCard
                    title="Sesiones Completadas"
                    value={monthlyReport.completedSessions}
                    icon={Activity}
                    color="bg-green-50 text-green-600"
                />
                <StatCard
                    title="Ingresos Totales"
                    value={`$${monthlyReport.totalRevenue.toLocaleString()}`}
                    change={comparison?.changes.revenue}
                    icon={DollarSign}
                    color="bg-emerald-50 text-emerald-600"
                />
                <StatCard
                    title="Pacientes Nuevos"
                    value={monthlyReport.newPatients}
                    icon={Users}
                    color="bg-purple-50 text-purple-600"
                />
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                    <h3 className="text-sm font-medium text-text-secondary mb-2">Precio Promedio por Sesión</h3>
                    <p className="text-3xl font-bold text-secondary">${monthlyReport.averageSessionPrice.toFixed(0)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                    <h3 className="text-sm font-medium text-text-secondary mb-2">Tasa de Cancelación</h3>
                    <p className="text-3xl font-bold text-secondary">{monthlyReport.cancellationRate.toFixed(1)}%</p>
                    <p className="text-xs text-text-muted mt-1">
                        {monthlyReport.cancelledSessions} de {monthlyReport.totalSessions} sesiones
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                    <h3 className="text-sm font-medium text-text-secondary mb-2">Tasa de Completitud</h3>
                    <p className="text-3xl font-bold text-secondary">
                        {monthlyReport.totalSessions > 0
                            ? ((monthlyReport.completedSessions / monthlyReport.totalSessions) * 100).toFixed(1)
                            : 0}%
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Sessions Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                    <h3 className="font-bold text-secondary mb-4">Sesiones por Día</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={monthlyReport.dailyStats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => new Date(value).getDate().toString()}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e5e5',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="sessions"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="Sesiones"
                                dot={{ fill: '#3b82f6', r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Daily Revenue Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                    <h3 className="font-bold text-secondary mb-4">Ingresos por Día</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyReport.dailyStats}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => new Date(value).getDate().toString()}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e5e5',
                                    borderRadius: '8px',
                                    fontSize: '12px'
                                }}
                                formatter={(value: any) => `$${value.toLocaleString()}`}
                            />
                            <Legend />
                            <Bar
                                dataKey="revenue"
                                fill="#10b981"
                                name="Ingresos"
                                radius={[8, 8, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Comparison with Previous Month */}
            {comparison && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-secondary mb-4">Comparación con Mes Anterior</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/80 backdrop-blur p-4 rounded-lg">
                            <p className="text-sm text-text-secondary mb-1">Sesiones</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-secondary">{comparison.current.totalSessions}</p>
                                <p className="text-sm text-text-muted">vs {comparison.previous.totalSessions}</p>
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-medium mt-1 ${comparison.changes.sessions >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {comparison.changes.sessions >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                {Math.abs(comparison.changes.sessions).toFixed(1)}%
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur p-4 rounded-lg">
                            <p className="text-sm text-text-secondary mb-1">Ingresos</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-secondary">${comparison.current.totalRevenue.toLocaleString()}</p>
                                <p className="text-sm text-text-muted">vs ${comparison.previous.totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-medium mt-1 ${comparison.changes.revenue >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {comparison.changes.revenue >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                                {Math.abs(comparison.changes.revenue).toFixed(1)}%
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur p-4 rounded-lg">
                            <p className="text-sm text-text-secondary mb-1">Tasa de Cancelación</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold text-secondary">{comparison.current.cancellationRate.toFixed(1)}%</p>
                                <p className="text-sm text-text-muted">vs {comparison.previous.cancellationRate.toFixed(1)}%</p>
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-medium mt-1 ${comparison.changes.cancellationRate <= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {comparison.changes.cancellationRate <= 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                                {Math.abs(comparison.changes.cancellationRate).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
