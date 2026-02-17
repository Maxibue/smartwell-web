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

                {/* Actions */}
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
                <button className="md:hidden p-2 text-secondary">
                    <Menu className="h-6 w-6" />
                </button>
            </div>
        </header>
    );
}
