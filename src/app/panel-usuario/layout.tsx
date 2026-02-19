"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Calendar,
    UserIcon,
    LogOut,
    Home,
    AlertCircle,
} from "lucide-react";
import { User as UserIconLucide } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";

const navItems = [
    { icon: Calendar, label: "Mis Turnos", href: "/panel-usuario/turnos" },
    { icon: UserIconLucide, label: "Mis Datos", href: "/panel-usuario/perfil" },
];

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

            if (!currentUser) {
                const hasGuestBookings =
                    typeof window !== "undefined" &&
                    localStorage.getItem("guest_bookings");

                if (hasGuestBookings) {
                    setIsGuest(true);
                } else {
                    router.push("/login?redirect=/panel-usuario");
                }
            } else {
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

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-text-secondary">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row">

            {/* ── Desktop Sidebar ────────────────────────────────────────── */}
            <aside className="hidden md:flex w-64 bg-white border-r border-neutral-200 flex-col fixed h-full inset-y-0 z-50">
                {/* Logo */}
                <div className="p-6 border-b border-neutral-100 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
                        SW
                    </div>
                    <div>
                        <Link href="/" className="font-bold font-display text-secondary">
                            SmartWell
                        </Link>
                        <p className="text-xs text-text-muted">Mi Panel</p>
                    </div>
                </div>

                {/* Nav links */}
                <nav className="flex-1 p-4 flex flex-col space-y-1">
                    {navItems.map((item) => {
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

                {/* Footer links */}
                <div className="p-4 border-t border-neutral-100">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary transition-colors mb-1"
                    >
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

            {/* ── Main column ───────────────────────────────────────────── */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen">

                {/* Desktop top header */}
                <header className="hidden md:flex bg-white border-b border-neutral-200 p-4 items-center justify-between sticky top-0 z-40">
                    <div>
                        <h1 className="text-xl font-bold text-secondary">Mi Panel</h1>
                        <p className="text-sm text-text-muted">
                            Bienvenido{user?.displayName ? `, ${user.displayName}` : ""}
                        </p>
                    </div>
                    <NotificationsDropdown />
                </header>

                {/* Mobile top header */}
                <header className="md:hidden bg-secondary text-white px-4 flex items-center justify-between sticky top-0 z-40 h-14">
                    <span className="font-bold text-base tracking-tight">SmartWell</span>
                    <div className="flex items-center gap-2">
                        <div className="text-white">
                            <NotificationsDropdown />
                        </div>
                    </div>
                </header>

                {/* Guest banner */}
                {isGuest && !user && (
                    <div className="bg-orange-50 border-b border-orange-100 p-4">
                        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
                                <p className="text-sm text-orange-800">
                                    Estás viendo tus turnos como{" "}
                                    <strong>invitado</strong>. Creá una cuenta para
                                    asegurarlos.
                                </p>
                            </div>
                            <Link href="/registro?redirect=/panel-usuario/asociar">
                                <Button
                                    size="sm"
                                    className="bg-orange-600 hover:bg-orange-700 text-white border-none whitespace-nowrap"
                                >
                                    Crear Cuenta
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Page content — add pb-20 on mobile so bottom nav doesn't overlap */}
                <main className="flex-1 p-4 pb-24 md:pb-8 md:p-8 max-w-5xl mx-auto w-full">
                    {children}
                </main>
            </div>

            {/* ── Mobile Bottom Navigation Bar ─────────────────────────── */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-neutral-200 safe-area-bottom">
                <div className="flex">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px]",
                                    isActive
                                        ? "text-primary"
                                        : "text-text-muted hover:text-secondary"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "h-5 w-5 transition-all",
                                        isActive && "scale-110"
                                    )}
                                />
                                <span
                                    className={cn(
                                        "text-[10px] font-medium leading-tight",
                                        isActive ? "text-primary" : "text-text-muted"
                                    )}
                                >
                                    {item.label}
                                </span>
                                {/* Active indicator dot */}
                                {isActive && (
                                    <span className="absolute top-1 w-1 h-1 rounded-full bg-primary" />
                                )}
                            </Link>
                        );
                    })}

                    {/* Logout tab on mobile */}
                    <button
                        onClick={handleLogout}
                        className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-text-muted hover:text-red-500 transition-colors min-h-[56px]"
                    >
                        <LogOut className="h-5 w-5" />
                        <span className="text-[10px] font-medium leading-tight">Salir</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
