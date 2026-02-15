"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Mail, Calendar, Loader2, Eye } from "lucide-react";
import Link from "next/link";

interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
    appointmentsCount: number;
}

export default function UsuariosPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        try {
            const usersSnap = await getDocs(
                query(collection(db, "users"), orderBy("createdAt", "desc"))
            );

            const usersData: UserData[] = [];
            usersSnap.forEach((doc) => {
                const data = doc.data();
                // Solo mostrar usuarios regulares (no admins ni profesionales)
                if (data.role === "user" || !data.role) {
                    usersData.push({
                        id: doc.id,
                        name: data.name || "Sin nombre",
                        email: data.email || "",
                        role: data.role || "user",
                        createdAt: data.createdAt?.toDate() || new Date(),
                        appointmentsCount: 0, // TODO: Calcular desde appointments
                    });
                }
            });

            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = users;

        if (searchTerm) {
            filtered = filtered.filter(
                (user) =>
                    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredUsers(filtered);
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
                <p className="text-text-secondary mt-1">Ver y gestionar usuarios de la plataforma</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary mb-1">Total de Usuarios</p>
                            <p className="text-3xl font-bold text-secondary">{users.length}</p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <Mail className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary mb-1">Nuevos Este Mes</p>
                            <p className="text-3xl font-bold text-secondary">
                                {users.filter(u => {
                                    const now = new Date();
                                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                                    return u.createdAt >= firstDay;
                                }).length}
                            </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                            <Calendar className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary mb-1">Con Turnos</p>
                            <p className="text-3xl font-bold text-secondary">
                                {users.filter(u => u.appointmentsCount > 0).length}
                            </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                            <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
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
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Usuario
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                    Turnos
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
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <p className="font-semibold text-secondary">{user.name}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-text-secondary">{user.email}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-secondary">
                                                {user.appointmentsCount}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-text-secondary">
                                                {user.createdAt.toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/panel-admin/usuarios/${user.id}`}
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
