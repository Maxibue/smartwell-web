"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Calendar, Users, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PROFESSIONAL_CATEGORIES } from "@/lib/categories";
import * as LucideIcons from "lucide-react";

export default function ProfessionalLandingPage() {
    return (
        <div className="min-h-screen bg-white font-sans text-text-primary">
            <Navbar />

            {/* --- HERO SECTION --- */}
            <section className="relative overflow-hidden pt-12 pb-20 lg:pt-24 lg:pb-32 bg-white">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8 max-w-2xl relative z-10">
                            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary shadow-sm">
                                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                                RED PROFESIONAL
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight text-secondary leading-[1.15]">
                                Formá parte de la Red Profesional Curada de Bienestar en LATAM.
                            </h1>
                            <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
                                Conectamos especialistas en salud mental, nutrición y desarrollo humano con personas que buscan acompañamiento real y confiable.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Button
                                    className="bg-primary hover:bg-primary-active text-white text-lg px-8 h-14 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5 tracking-wide uppercase font-semibold"
                                    asChild
                                >
                                    <Link href="/postulacion">
                                        POSTULARME A LA RED
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="text-secondary border-2 border-secondary/20 hover:bg-neutral-50 h-14 px-8 rounded-xl text-lg font-semibold tracking-wide uppercase"
                                    asChild
                                >
                                    <Link href="#proceso-seleccion">
                                        CONOCER EL PROCESO
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        <div className="relative h-[500px] w-full max-w-[520px] mx-auto lg:mx-0 rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform transition-transform hover:scale-[1.01] duration-500">
                            <Image
                                src="/professional_hero.png"
                                alt="Profesional SmartWell en consulta"
                                fill
                                className="object-cover bg-neutral-50"
                                priority
                            />
                            {/* Decorative blob background (matching Home) */}
                            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none -z-10"></div>
                            <div className="absolute -bottom-24 -left-12 w-80 h-80 bg-secondary/5 rounded-full blur-3xl opacity-50 pointer-events-none -z-10"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- QUÉ ES SMARTWELL --- */}
            <section className="py-24 bg-background relative overflow-hidden">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center space-y-8 relative z-10">
                    <span className="text-primary font-semibold tracking-wider text-sm uppercase mb-2 block">CURADURÍA Y CONFIANZA</span>
                    <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary">
                        No somos un directorio. Somos una red seleccionada.
                    </h2>
                    <div className="space-y-6 text-lg text-text-secondary leading-relaxed">
                        <p>
                            SmartWell es una plataforma tecnológica que conecta personas con profesionales del bienestar cuidadosamente validados.
                        </p>
                        <p className="font-medium text-primary">
                            Priorizamos calidad, ética y experiencia.
                        </p>
                        <p>
                            Cada profesional pasa por un proceso de revisión antes de ser activado.
                            Nuestro objetivo no es volumen. Es confianza.
                        </p>
                    </div>
                </div>
            </section>

            {/* --- BENEFICIOS --- */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary mb-4">Beneficios de sumarte</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-12">
                        {/* Benefit 1 */}
                        <div className="flex flex-col items-start space-y-4 p-8 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-300 group bg-white">
                            <div className="p-4 bg-primary/10 text-primary rounded-xl mb-2 group-hover:scale-110 transition-transform duration-300">
                                <Users className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-secondary font-display">Más visibilidad profesional</h3>
                            <p className="text-text-secondary leading-relaxed">
                                Conectamos con personas que ya están buscando acompañamiento calificado, reduciendo tu esfuerzo en marketing.
                            </p>
                        </div>

                        {/* Benefit 2 */}
                        <div className="flex flex-col items-start space-y-4 p-8 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-300 group bg-white">
                            <div className="p-4 bg-accent/10 text-accent rounded-xl mb-2 group-hover:scale-110 transition-transform duration-300">
                                <Calendar className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-secondary font-display">Gestión simplificada</h3>
                            <p className="text-text-secondary leading-relaxed">
                                Centralizá reservas, pagos y coordinación de agenda en un solo lugar diseñado para tu práctica.
                            </p>
                        </div>

                        {/* Benefit 3 */}
                        <div className="flex flex-col items-start space-y-4 p-8 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-300 group bg-white">
                            <div className="p-4 bg-secondary/10 text-secondary rounded-xl mb-2 group-hover:scale-110 transition-transform duration-300">
                                <ShieldCheck className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-bold text-secondary font-display">Pertenencia a una red curada</h3>
                            <p className="text-text-secondary leading-relaxed">
                                No cualquiera entra. Formás parte de un estándar profesional que te posiciona y avala.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- MODELO Y COMISIÓN --- */}
            <section className="py-24 bg-secondary text-white">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-3xl mx-auto text-center space-y-12">
                        <div className="space-y-4">
                            <h2 className="text-3xl md:text-4xl font-bold font-display">Modelo claro y transparente</h2>
                            <p className="text-lg text-blue-100/80">SmartWell funciona bajo un modelo de intermediación tecnológica simple.</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
                            <ul className="space-y-6 text-left inline-block mx-auto">
                                <li className="flex items-start gap-4">
                                    <div className="mt-1 bg-primary rounded-full p-1 opacity-100 shadow-lg shadow-primary/20"><CheckCircle className="h-4 w-4 text-white" /></div>
                                    <span className="text-lg md:text-xl font-medium">Comisión del 10% <span className="text-primary font-bold">únicamente sobre clientes derivados</span>.</span>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="bg-primary rounded-full p-1 opacity-100 shadow-lg shadow-primary/20"><CheckCircle className="h-4 w-4 text-white" /></div>
                                    <span className="text-lg md:text-xl">No se aplica sobre tus clientes propios.</span>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="bg-primary rounded-full p-1 opacity-100 shadow-lg shadow-primary/20"><CheckCircle className="h-4 w-4 text-white" /></div>
                                    <span className="text-lg md:text-xl">Sin costos fijos mensuales.</span>
                                </li>
                                <li className="flex items-center gap-4">
                                    <div className="bg-primary rounded-full p-1 opacity-100 shadow-lg shadow-primary/20"><CheckCircle className="h-4 w-4 text-white" /></div>
                                    <span className="text-lg md:text-xl">Sin suscripciones ocultas.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-4">
                            <p className="text-xl font-semibold tracking-wide uppercase text-primary">
                                Creemos en un modelo alineado a resultados.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PROCESO DE VALIDACIÓN --- */}
            <section id="proceso-seleccion" className="py-24 bg-white relative">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <span className="text-primary font-semibold tracking-wider text-sm uppercase mb-2 block">CÓMO UNIRSE</span>
                        <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary mb-4">Nuestro proceso de selección</h2>
                        <p className="text-text-secondary max-w-2xl mx-auto text-lg">
                            Buscamos profesionales con formación acreditable, ética sólida y compromiso real con sus consultantes.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-8 left-[12%] right-[12%] h-0.5 bg-neutral-100 -z-10" />

                        {[
                            { step: "01", title: "Postulación online", desc: "Completás un formulario simple con tus datos." },
                            { step: "02", title: "Revisión de perfil", desc: "Evaluamos tu formación y experiencia clínica." },
                            { step: "03", title: "Breve entrevista", desc: "Validamos identidad y alineación de valores." },
                            { step: "04", title: "Activación", desc: "Tu perfil profesional queda visible en la red." }
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center space-y-4 bg-white p-4">
                                <div className="h-16 w-16 rounded-full bg-white border-4 border-primary text-primary flex items-center justify-center text-xl font-bold shadow-lg shadow-primary/10 z-10 font-display">
                                    {item.step}
                                </div>
                                <h3 className="text-lg font-bold text-secondary">{item.title}</h3>
                                <p className="text-sm text-text-secondary">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- ÁREAS --- */}
            <section className="py-24 bg-background">
                <div className="container mx-auto px-4 md:px-6">
                    <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary text-center mb-12">
                        Áreas que estamos incorporando
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {PROFESSIONAL_CATEGORIES.map((area) => {
                            // Dynamically get the icon component from lucide-react
                            const IconComponent = (LucideIcons as any)[area.icon];

                            // Map category colors to Tailwind classes
                            const colorMap: Record<string, string> = {
                                'primary': 'text-blue-600 bg-blue-50',
                                'accent': 'text-red-600 bg-red-50',
                                'secondary': 'text-green-600 bg-green-50',
                            };

                            return (
                                <div key={area.id} className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-neutral-100 hover:shadow-lg hover:border-primary/20 transition-all group">
                                    <div className={`p-4 rounded-full mb-4 group-hover:scale-110 transition-transform ${colorMap[area.color] || 'text-indigo-600 bg-indigo-50'}`}>
                                        {IconComponent && <IconComponent className="h-8 w-8" />}
                                    </div>
                                    <span className="font-bold text-secondary font-display">{area.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* --- FAQ --- */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold font-display text-secondary">Preguntas Frecuentes</h2>
                    </div>
                    <div className="space-y-4">
                        <FAQItem
                            question="¿Tiene costo formar parte?"
                            answer="No hay costos de inscripción ni mantenimiento. Solo aplicamos la comisión del 10% sobre los clientes que la plataforma te deriva."
                        />
                        <FAQItem
                            question="¿Puedo elegir mis horarios?"
                            answer="Absolutamente. Vos gestionás tu disponibilidad al 100%. Podes abrir y cerrar agenda cuando quieras desde tu panel."
                        />
                        <FAQItem
                            question="¿Debo tener matrícula habilitante?"
                            answer="Sí, para todas las especialidades reguladas (Psicología, Nutrición, Psiquiatría, etc.) es requisito excluyente contar con matrícula vigente."
                        />
                        <FAQItem
                            question="¿Qué pasa si no soy aceptado?"
                            answer="Evaluamos cada perfil según nuestros estándares actuales y demanda. Si no ingresás ahora, podés volver a postularte en 6 meses."
                        />
                    </div>
                </div>
            </section>

            {/* --- CTA FINAL --- */}
            <section className="py-24 bg-secondary text-white text-center relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <svg width="200" height="200" viewBox="0 0 100 100" fill="currentColor">
                        <circle cx="50" cy="50" r="40" />
                    </svg>
                </div>

                <div className="container mx-auto px-4 md:px-6 space-y-8 relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold font-display leading-tight max-w-4xl mx-auto">
                        ¿Querés formar parte de una red profesional con estándar real?
                    </h2>
                    <div className="flex flex-col items-center gap-4 pt-4">
                        <Button
                            className="bg-primary hover:bg-primary-active text-white h-16 px-12 rounded-xl text-xl font-bold tracking-wide uppercase transition-all shadow-xl shadow-primary/30 hover:shadow-2xl hover:-translate-y-1"
                            asChild
                        >
                            <Link href="/postulacion">
                                INICIAR POSTULACIÓN
                            </Link>
                        </Button>
                        <p className="text-sm text-white/60">Tiempo estimado: 3 minutos</p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-neutral-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-6 bg-white hover:bg-neutral-50 text-left transition-colors"
            >
                <span className="font-bold text-secondary text-lg font-display">{question}</span>
                {isOpen ? <ChevronUp className="h-5 w-5 text-primary" /> : <ChevronDown className="h-5 w-5 text-neutral-400" />}
            </button>
            {isOpen && (
                <div className="p-6 pt-0 bg-white border-t border-neutral-50 text-text-secondary leading-relaxed animate-in slide-in-from-top-2">
                    {answer}
                </div>
            )}
        </div>
    );
}
