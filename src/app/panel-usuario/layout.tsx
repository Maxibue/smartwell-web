

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Calendar,
    Clock,
    User as UserIcon,
    LogOut,
    Home,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const sidebarItems = [
    { icon: Calendar, label: "Mis Turnos", href: "/panel-usuario/turnos" },
    { icon: UserIcon, label: "Mis Datos", href: "/panel-usuario/perfil" },
    // { icon: Clock, label: "Historial", href: "/panel-usuario/historial" }, // Future
];

import { NotificationsDropdown } from "@/components/NotificationsDropdown";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            // ✅ MEJORADO: Solo redirigir si definitivamente NO hay usuario
            if (!currentUser) {
                const hasGuestBookings = typeof window !== 'undefined' && localStorage.getItem("guest_bookings");

                if (hasGuestBookings) {
                    // Usuario invitado con turnos guardados
                    setIsGuest(true);
                } else {
                    // Sin usuario Y sin datos de invitado → redirigir a login
                    router.push("/login?redirect=/panel-usuario");
                }
            } else {
                // Usuario autenticado correctamente
                setIsGuest(false);
            }

            setLoading(false);
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    // ✅ Mostrar estado de carga más agradable mientras verificamos autenticación
    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-secondary">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-neutral-200 flex flex-col md:fixed md:h-full md:inset-y-0 z-50">
                <div className="p-4 md:p-6 border-b border-neutral-100 flex items-center justify-between md:justify-start gap-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                            SW
                        </div>
                        <div>
                            <Link href="/" className="font-bold font-display text-secondary">SmartWell</Link>
                            <p className="text-xs text-text-muted">Mi Panel</p>
                        </div>
                    </div>
                    {/* Mobile Menu Button could go here */}
                </div>

                <nav className="hidden md:flex flex-1 p-4 flex-col space-y-1">
                    {sidebarItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-text-secondary hover:bg-neutral-50 hover:text-secondary"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="hidden md:block p-4 border-t border-neutral-100">
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary transition-colors mb-1">
                        <Home className="h-5 w-5" />
                        Volver al Inicio
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors text-left"
                    >
                        <LogOut className="h-5 w-5" />
                        {user ? "Cerrar Sesión" : "Salir"}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
                {/* Desktop Header */}
                <header className="hidden md:flex bg-white border-b border-neutral-200 p-4 items-center justify-between sticky top-0 z-40">
                    <div>
                        <h1 className="text-xl font-bold text-secondary">Mi Panel</h1>
                        <p className="text-sm text-text-muted">Bienvenido{user?.displayName ? `, ${user.displayName}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationsDropdown />
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="md:hidden bg-secondary text-white p-4 flex justify-between items-center sticky top-0 z-40">
                    <span className="font-bold">SmartWell</span>
                    <div className="flex items-center gap-2">
                        <div className="text-white">
                            <NotificationsDropdown />
                        </div>
                    </div>
                </header>

                {/* Guest Banner */}
                {isGuest && !user && (
                    <div className="bg-orange-50 border-b border-orange-100 p-4">
                        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
                                <p className="text-sm text-orange-800">
                                    Estás viendo tus turnos como <strong>invitado</strong>. Creá una cuenta para asegurarlos y acceder desde cualquier dispositivo.
                                </p>
                            </div>
                            <Link href="/registro?redirect=/panel-usuario/asociar">
                                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white border-none whitespace-nowrap">
                                    Crear Cuenta
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}

