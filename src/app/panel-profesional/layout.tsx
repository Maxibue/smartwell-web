
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
    { icon: CreditCard, label: "Cobros", href: "/panel-profesional/pagos" },
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

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-secondary text-white">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                    <Link href="/" className="text-2xl font-bold font-display text-white">SmartWell</Link>
                    <p className="text-xs text-primary-light mt-1">Panel Profesional</p>
                </div>
                {/* Mobile Close Button */}
                <button
                    className="md:hidden p-2 text-white/70 hover:text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                <div className="md:hidden px-4 py-2 mb-4">
                    <p className="text-sm font-medium text-white/50 uppercase tracking-wider">Menú</p>
                </div>
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                isActive
                                    ? "bg-primary text-white shadow-sm"
                                    : "text-neutral-300 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10 mt-auto">
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
        </div>
    );

    return (
        <div className="min-h-screen bg-neutral-50 flex overflow-hidden">
            {/* Desktop Sidebar (Fixed) */}
            <aside className="hidden md:flex flex-col w-64 bg-secondary text-white fixed h-full inset-y-0 z-50 shadow-xl">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar (Overlay) */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />

                    {/* Drawer */}
                    <aside className="relative w-[80%] max-w-sm bg-secondary h-full shadow-2xl animate-in slide-in-from-left w-64">
                        <SidebarContent />
                    </aside>
                </div>
            )}

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 md:pl-64 h-screen overflow-hidden">

                {/* Mobile Header */}
                <header className="md:hidden bg-secondary text-white p-4 flex justify-between items-center shadow-md z-40 sticky top-0 shrink-0">
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <span className="font-bold text-lg">SmartWell Pro</span>

                    <div className="flex items-center gap-2">
                        <div className="text-white relative">
                            <NotificationsDropdown />
                        </div>
                    </div>
                </header>

                {/* Desktop Header */}
                <header className="hidden md:flex bg-white border-b border-neutral-200 px-8 py-4 items-center justify-between sticky top-0 z-40 shrink-0">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary">Panel Profesional</h1>
                        <p className="text-sm text-text-muted mt-1">Bienvenido, {user?.displayName || user?.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationsDropdown />
                    </div>
                </header>

                {/* Main Scrollable Area */}
                <main className="flex-1 overflow-y-auto p-4 pb-8 md:p-8 space-y-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
