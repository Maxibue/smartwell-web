
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Calendar,
    Clock,
    Users,
    MessageSquare,
    CreditCard,
    Settings,
    LogOut,
    UserCircle,
    Loader2,
    BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";


const sidebarItems = [
    { icon: LayoutDashboard, label: "Resumen", href: "/panel-profesional" },
    { icon: Calendar, label: "Calendario", href: "/panel-profesional/calendario" },
    { icon: Clock, label: "Disponibilidad", href: "/panel-profesional/disponibilidad" },
    { icon: BarChart3, label: "Estadísticas", href: "/panel-profesional/estadisticas" },
    { icon: Users, label: "Pacientes", href: "/panel-profesional/pacientes" },
    { icon: Settings, label: "Mis Servicios", href: "/panel-profesional/servicios" },
    { icon: UserCircle, label: "Mi Perfil", href: "/panel-profesional/perfil" },
];


export default function ProfessionalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                router.push("/login");
            } else {
                setUser(currentUser);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-neutral-50"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    if (!user) return null; // Should redirect

    return (
        <div className="min-h-screen bg-neutral-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-secondary text-white hidden md:flex flex-col fixed h-full inset-y-0 z-50">
                <div className="p-6 border-b border-primary/20">
                    <Link href="/" className="text-2xl font-bold font-display text-white">SmartWell</Link>
                    <p className="text-xs text-primary-light mt-1">Panel Profesional</p>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                    isActive
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-neutral-300 hover:bg-secondary-light hover:text-white"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-primary/20">
                    <Link
                        href={`/profesionales/${user.uid}`}
                        target="_blank"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-neutral-300 hover:text-white transition-colors mb-2"
                    >
                        <UserCircle className="h-5 w-5" />
                        Mi Perfil Público
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-900/20 hover:text-red-200 rounded-lg transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                {/* Desktop Header */}
                <header className="hidden md:flex bg-white border-b border-neutral-200 p-4 items-center justify-between sticky top-0 z-40">
                    <div>
                        <h1 className="text-xl font-bold text-secondary">Panel Profesional</h1>
                        <p className="text-sm text-text-muted">Bienvenido, {user?.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationsDropdown />
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="md:hidden bg-secondary text-white p-4 flex justify-between items-center sticky top-0 z-40">
                    <span className="font-bold">SmartWell Pro</span>
                    <div className="flex items-center gap-2">
                        <div className="text-white">
                            <NotificationsDropdown />
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
