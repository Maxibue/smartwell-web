"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Menu, User, LogOut, LayoutDashboard } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export function Navbar() {
    const router = useRouter();
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userRole, setUserRole] = useState<"professional" | "user" | "admin" | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Detectar rol
                const proDoc = await getDoc(doc(db, "professionals", currentUser.uid));

                if (proDoc.exists()) {
                    setUserRole("professional");
                } else {
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
                    const userData = userDoc.data();

                    if (userData?.role === "admin") {
                        setUserRole("admin");
                    } else {
                        setUserRole("user");
                    }
                }
            } else {
                setUserRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push("/");
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    const getDashboardLink = () => {
        switch (userRole) {
            case "professional":
                return "/panel-profesional";
            case "admin":
                return "/panel-admin";
            case "user":
                return "/panel-usuario";
            default:
                return "/login";
        }
    };

    const getDashboardLabel = () => {
        switch (userRole) {
            case "professional":
                return "Panel Profesional";
            case "admin":
                return "Panel Admin";
            case "user":
                return "Mi Panel";
            default:
                return "Ingresar";
        }
    };

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [router]);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-2xl font-bold font-display text-secondary">SmartWell</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-secondary">
                    <Link href="/como-funciona" className="hover:text-primary transition-colors">Cómo funciona</Link>
                    <Link href="/profesionales" className="hover:text-primary transition-colors">Profesionales</Link>
                    {!user && (
                        <Link href="/para-profesionales" className="hover:text-primary transition-colors">Soy Profesional</Link>
                    )}
                </nav>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {loading ? (
                        <div className="w-20 h-10 bg-neutral-100 animate-pulse rounded-lg"></div>
                    ) : user ? (
                        <>
                            <Button variant="ghost" asChild>
                                <Link href={getDashboardLink()} className="flex items-center gap-2">
                                    <LayoutDashboard className="h-4 w-4" />
                                    {getDashboardLabel()}
                                </Link>
                            </Button>
                            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                                <LogOut className="h-4 w-4" />
                                Salir
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" asChild>
                                <Link href="/login">Ingresar</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/comenzar">Buscar Profesional</Link>
                            </Button>
                        </>
                    )}
                </div>

                {/* Mobile Menu Trigger */}
                <button
                    className="md:hidden p-2 text-secondary hover:bg-neutral-100 rounded-lg transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <LogOut className="h-6 w-6 rotate-45" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="absolute top-16 left-0 w-full bg-white border-b shadow-lg md:hidden animate-in slide-in-from-top-2 z-40">
                    <div className="flex flex-col p-4 gap-4">
                        <Link
                            href="/como-funciona"
                            className="p-3 hover:bg-neutral-50 rounded-lg text-secondary font-medium transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Cómo funciona
                        </Link>
                        <Link
                            href="/profesionales"
                            className="p-3 hover:bg-neutral-50 rounded-lg text-secondary font-medium transition-colors"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Profesionales
                        </Link>
                        {!user && (
                            <Link
                                href="/para-profesionales"
                                className="p-3 hover:bg-neutral-50 rounded-lg text-secondary font-medium transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Soy Profesional
                            </Link>
                        )}

                        <div className="h-px bg-neutral-100 my-2" />

                        {user ? (
                            <>
                                <Link
                                    href={getDashboardLink()}
                                    className="p-3 bg-primary/5 rounded-lg text-primary font-bold text-center border border-primary/10"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    {getDashboardLabel()}
                                </Link>
                                <button
                                    onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                    className="p-3 text-red-600 font-medium text-center hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    Cerrar Sesión
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/login"
                                    className="p-3 text-center font-medium bg-neutral-50 hover:bg-neutral-100 rounded-lg text-secondary border border-neutral-200"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Ingresar
                                </Link>
                                <Link
                                    href="/comenzar"
                                    className="p-3 text-center font-bold bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm shadow-primary/20"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Buscar Profesional
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
