"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
    LayoutDashboard,
    Users,
    UserCheck,
    Calendar,
    DollarSign,
    LogOut,
    Loader2,
    Shield,
    FileText
} from "lucide-react";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login?redirect=/panel-admin");
                return;
            }

            setUser(currentUser);

            // Verificar si el usuario es admin
            try {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                const userData = userDoc.data();

                if (userData?.role === "admin") {
                    setIsAdmin(true);
                    setLoading(false);
                } else {
                    // No es admin, redirigir
                    alert("No tenés permisos para acceder al panel de administración.");
                    router.push("/");
                }
            } catch (error) {
                console.error("Error verificando permisos:", error);
                router.push("/");
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    const sidebarItems = [
        { icon: LayoutDashboard, label: "Resumen", href: "/panel-admin/resumen" },
        { icon: UserCheck, label: "Profesionales", href: "/panel-admin/profesionales" },
        { icon: Users, label: "Usuarios", href: "/panel-admin/usuarios" },
        { icon: Calendar, label: "Turnos", href: "/panel-admin/turnos" },
        { icon: DollarSign, label: "Financiero", href: "/panel-admin/financiero" },
        { icon: FileText, label: "Audit Logs", href: "/panel-admin/logs" },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-text-secondary">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-secondary text-white fixed h-full shadow-xl z-10">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        <div>
                            <h1 className="text-xl font-bold">SmartWell</h1>
                            <p className="text-xs text-primary-light">Panel Admin</p>
                        </div>
                    </div>
                </div>

                <nav className="p-4 space-y-2">
                    {sidebarItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? "bg-primary text-white shadow-lg"
                                    : "text-primary-light hover:bg-white/10 hover:text-white"
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 w-64 p-4 border-t border-white/10">
                    <div className="mb-3 px-4">
                        <p className="text-xs text-primary-light">Sesión iniciada como</p>
                        <p className="text-sm font-medium truncate">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-primary-light hover:bg-white/10 hover:text-white transition-all"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64">
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
