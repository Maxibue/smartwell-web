
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Menu } from "lucide-react";

export function Navbar() {
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
                    <Link href="/para-profesionales" className="hover:text-primary transition-colors">Soy Profesional</Link>
                </nav>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <Button variant="ghost" asChild>
                        <Link href="/login">Ingresar</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/comenzar">Buscar Profesional</Link>
                    </Button>
                </div>

                {/* Mobile Menu Trigger */}
                <button className="md:hidden p-2 text-secondary">
                    <Menu className="h-6 w-6" />
                </button>
            </div>
        </header>
    );
}
