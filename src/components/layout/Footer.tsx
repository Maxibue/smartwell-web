
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-white border-t border-neutral-200">
            <div className="container mx-auto px-4 py-12 md:px-6 lg:py-16">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold font-display text-secondary">SmartWell</h3>
                        <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                            Conectamos personas con profesionales validados para acompañarte en cada etapa de tu vida.
                        </p>
                        <div className="flex space-x-4 pt-2">
                            <Link href="#" className="text-neutral-400 hover:text-primary transition-colors">
                                <Instagram className="h-5 w-5" />
                                <span className="sr-only">Instagram</span>
                            </Link>
                            <Link href="#" className="text-neutral-400 hover:text-primary transition-colors">
                                <Linkedin className="h-5 w-5" />
                                <span className="sr-only">LinkedIn</span>
                            </Link>
                            <Link href="#" className="text-neutral-400 hover:text-primary transition-colors">
                                <Facebook className="h-5 w-5" />
                                <span className="sr-only">Facebook</span>
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-secondary uppercase tracking-wider">Plataforma</h4>
                        <ul className="space-y-2 text-sm text-text-secondary">
                            <li><Link href="/comenzar" className="hover:text-primary">Buscar Profesional</Link></li>
                            <li><Link href="/profesionales" className="hover:text-primary">Profesionales</Link></li>
                            <li><Link href="/blog" className="hover:text-primary">Blog</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-secondary uppercase tracking-wider">Empresa</h4>
                        <ul className="space-y-2 text-sm text-text-secondary">
                            <li><Link href="/sobre-nosotros" className="hover:text-primary">Sobre Nosotros</Link></li>
                            <li><Link href="/para-profesionales" className="hover:text-primary">Sumate como profesional</Link></li>
                            <li><Link href="/contacto" className="hover:text-primary">Contacto</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-secondary uppercase tracking-wider">Legales</h4>
                        <ul className="space-y-2 text-sm text-text-secondary">
                            <li><Link href="/terminos" className="hover:text-primary">Términos y Condiciones</Link></li>
                            <li><Link href="/terminos-profesionales" className="hover:text-primary">Términos para Profesionales</Link></li>
                            <li><Link href="/privacidad" className="hover:text-primary">Política de Privacidad</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted">
                    <p>&copy; {new Date().getFullYear()} SmartWell. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
}
