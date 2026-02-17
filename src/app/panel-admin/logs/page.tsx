"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Shield, Search, Filter, Loader2, Calendar, User as UserIcon, Activity, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AuditLog {
    id: string;
    adminUid: string;
    adminEmail: string;
    action: string;
    targetId: string;
    metadata: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
    APPROVE_PROFESSIONAL: { label: "Aprobar Profesional", color: "bg-green-100 text-green-800" },
    REJECT_PROFESSIONAL: { label: "Rechazar Profesional", color: "bg-red-100 text-red-800" },
    CANCEL_APPOINTMENT: { label: "Cancelar Turno", color: "bg-orange-100 text-orange-800" },
};

export default function AuditLogsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionFilter, setActionFilter] = useState<string>("all");
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchLogs();
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        filterLogs();
    }, [searchTerm, actionFilter, logs]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const logsQuery = query(
                collection(db, "audit_logs"),
                orderBy("timestamp", "desc"),
                limit(100)
            );

            const querySnapshot = await getDocs(logsQuery);
            const logsData: AuditLog[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                logsData.push({
                    id: doc.id,
                    adminUid: data.adminUid || "",
                    adminEmail: data.adminEmail || "",
                    action: data.action || "",
                    targetId: data.targetId || "",
                    metadata: data.metadata || {},
                    timestamp: data.timestamp?.toDate() || new Date(),
                    ipAddress: data.ipAddress || "",
                });
            });

            setLogs(logsData);
            setFilteredLogs(logsData);
        } catch (error) {
            console.error("Error fetching audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterLogs = () => {
        let filtered = logs;

        // Filtrar por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(
                (log) =>
                    log.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    log.targetId.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrar por acción
        if (actionFilter !== "all") {
            filtered = filtered.filter((log) => log.action === actionFilter);
        }

        setFilteredLogs(filtered);
    };

    const getActionBadge = (action: string) => {
        const actionInfo = ACTION_LABELS[action] || { label: action, color: "bg-gray-100 text-gray-800" };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${actionInfo.color}`}>
                {actionInfo.label}
            </span>
        );
    };

    const stats = {
        total: logs.length,
        approvals: logs.filter((l) => l.action === "APPROVE_PROFESSIONAL").length,
        rejections: logs.filter((l) => l.action === "REJECT_PROFESSIONAL").length,
        cancellations: logs.filter((l) => l.action === "CANCEL_APPOINTMENT").length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-12 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <p className="text-text-muted">Debes estar autenticado para ver los logs de auditoría.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-secondary flex items-center gap-2">
                        <Shield className="h-8 w-8 text-primary" />
                        Audit Logs
                    </h1>
                    <p className="text-text-secondary mt-1">
                        Registro completo de todas las acciones administrativas
                    </p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-600 mb-1">
                        <Activity className="h-4 w-4" />
                        <p className="text-xs font-medium">Total de Acciones</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                        <UserIcon className="h-4 w-4" />
                        <p className="text-xs font-medium">Aprobaciones</p>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{stats.approvals}</p>
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 text-red-600 mb-1">
                        <UserIcon className="h-4 w-4" />
                        <p className="text-xs font-medium">Rechazos</p>
                    </div>
                    <p className="text-2xl font-bold text-red-900">{stats.rejections}</p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 text-orange-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        <p className="text-xs font-medium">Cancelaciones</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">{stats.cancellations}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Buscar por email, acción o ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* Action Filter */}
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="all">Todas las Acciones</option>
                        <option value="APPROVE_PROFESSIONAL">Aprobaciones</option>
                        <option value="REJECT_PROFESSIONAL">Rechazos</option>
                        <option value="CANCEL_APPOINTMENT">Cancelaciones</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Fecha y Hora
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Administrador
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Acción
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Detalles
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Ver Más
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                                        No se encontraron logs de auditoría
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-secondary">
                                                {format(log.timestamp, "dd/MM/yyyy")}
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                {format(log.timestamp, "HH:mm:ss")}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-secondary">{log.adminEmail}</p>
                                            <p className="text-xs text-text-muted font-mono">{log.adminUid.slice(0, 8)}...</p>
                                        </td>
                                        <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-secondary">
                                                {log.metadata.professionalName || log.metadata.appointmentId || log.targetId}
                                            </p>
                                            {log.metadata.previousStatus && (
                                                <p className="text-xs text-text-muted">
                                                    {log.metadata.previousStatus} → {log.metadata.newStatus}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="text-primary hover:text-primary-dark text-sm font-medium"
                                            >
                                                Ver Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedLog(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-neutral-200">
                            <h3 className="text-xl font-bold text-secondary">Detalles del Log</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-text-secondary uppercase mb-1">Timestamp</p>
                                <p className="text-sm text-secondary">
                                    {format(selectedLog.timestamp, "dd/MM/yyyy HH:mm:ss")}
                                </p>
                                <p className="text-xs text-text-muted">
                                    {format(selectedLog.timestamp, "EEEE d 'de' MMMM 'de' yyyy")}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-text-secondary uppercase mb-1">Administrador</p>
                                <p className="text-sm text-secondary font-medium">{selectedLog.adminEmail}</p>
                                <p className="text-xs text-text-muted font-mono">{selectedLog.adminUid}</p>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-text-secondary uppercase mb-1">Acción</p>
                                {getActionBadge(selectedLog.action)}
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-text-secondary uppercase mb-1">Target ID</p>
                                <p className="text-sm text-secondary font-mono">{selectedLog.targetId}</p>
                            </div>

                            {selectedLog.ipAddress && (
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase mb-1">IP Address</p>
                                    <p className="text-sm text-secondary font-mono">{selectedLog.ipAddress}</p>
                                </div>
                            )}

                            <div>
                                <p className="text-xs font-semibold text-text-secondary uppercase mb-2">Metadata</p>
                                <pre className="bg-neutral-50 rounded-lg p-4 text-xs overflow-x-auto">
                                    {JSON.stringify(selectedLog.metadata, null, 2)}
                                </pre>
                            </div>
                        </div>
                        <div className="p-6 border-t border-neutral-200">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
