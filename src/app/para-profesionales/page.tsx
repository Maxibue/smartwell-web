"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Calendar, Users, ShieldCheck, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
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
                                Formá parte de una red profesional validada en Latinoamérica.
                            </h1>
                            <p className="text-lg md:text-xl text-text-secondary leading-relaxed">
                                Conectamos profesionales comprometidos con personas que buscan acompañamiento real, confidencial y de calidad.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Button
                                    className="bg-primary hover:bg-primary-active text-white text-lg px-8 h-14 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5 font-semibold"
                                    asChild
                                >
                                    <Link href="/postulacion">
                                        Aplicar para formar parte <ArrowRight className="ml-2 h-5 w-5 inline" />
                                    </Link>
                                </Button>
                            </div>
                            <p className="text-sm text-text-muted">Proceso de validación activo.</p>
                        </div>
                        <div className="relative h-[500px] w-full max-w-[520px] mx-auto lg:mx-0 rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform transition-transform hover:scale-[1.01] duration-500">
                            <Image
                                src="/professional_hero.png"
                                alt="Profesional SmartWell en consulta"
                                fill
                                className="object-cover bg-neutral-50"
                                priority
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- ¿POR QUÉ SMARTWELL? --- */}
            <section className="py-24 bg-neutral-50">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <span className="text-primary font-semibold tracking-wider text-sm uppercase mb-2 block">Red validada</span>
                        <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary mb-4">¿Por qué elegir SmartWell?</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {[
                            {
                                icon: <Users className="h-7 w-7" />,
                                color: "bg-primary/10 text-primary",
                                title: "Pacientes que valoran procesos profesionales",
                                desc: "Llegamos a personas que buscan un acompañamiento serio, no una consulta de emergencia. Pacientes comprometidos con su proceso."
                            },
                            {
                                icon: <ShieldCheck className="h-7 w-7" />,
                                color: "bg-secondary/10 text-secondary",
                                title: "Posicionamiento dentro de una red validada",
                                desc: "Formar parte de SmartWell es una distinción. Tu presencia en la red comunica estándar, experiencia y compromiso ético."
                            },
                            {
                                icon: <Calendar className="h-7 w-7" />,
                                color: "bg-accent/10 text-accent",
                                title: "Matching estratégico, no masivo",
                                desc: "No somos un directorio abierto. Hacemos conexiones con criterio, priorizando calidad de vínculo sobre cantidad de consultas."
                            },
                            {
                                icon: <CheckCircle className="h-7 w-7" />,
                                color: "bg-indigo-50 text-indigo-600",
                                title: "Confidencialidad y estándar ético",
                                desc: "Operamos bajo un marco de confidencialidad estricto. Cada interacción dentro de la plataforma respeta tu práctica y la del paciente."
                            }
                        ].map((b, i) => (
                            <div key={i} className="flex items-start gap-5 p-8 rounded-2xl border border-neutral-100 shadow-sm hover:shadow-xl transition-all duration-300 bg-white group">
                                <div className={`p-3 rounded-xl shrink-0 group-hover:scale-110 transition-transform duration-300 ${b.color}`}>
                                    {b.icon}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-secondary font-display mb-2">{b.title}</h3>
                                    <p className="text-text-secondary leading-relaxed text-sm">{b.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- NUESTRO ESTÁNDAR PROFESIONAL --- */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <span className="text-primary font-semibold tracking-wider text-sm uppercase block">Estándar SmartWell</span>
                            <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary">Nuestro estándar profesional</h2>
                            <p className="text-text-secondary text-lg leading-relaxed">
                                SmartWell no es un directorio abierto.<br />
                                Cada profesional pasa por un proceso de validación para asegurar calidad, experiencia y compromiso.
                            </p>
                        </div>
                        <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-100 space-y-5">
                            {[
                                "Formación acreditada",
                                "Experiencia comprobable",
                                "Entrevista de validación",
                                "Compromiso ético y confidencialidad"
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-4">
                                    <div className="bg-primary rounded-full p-1 shadow-sm shadow-primary/20 shrink-0">
                                        <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="text-secondary font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CÓMO APLICAR --- */}
            <section id="proceso-seleccion" className="py-24 bg-neutral-50 relative">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <span className="text-primary font-semibold tracking-wider text-sm uppercase mb-2 block">Cómo unirse</span>
                        <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary mb-4">Cómo aplicar</h2>
                        <p className="text-text-secondary max-w-xl mx-auto text-lg">
                            El proceso es selectivo y prioriza calidad sobre volumen.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative max-w-4xl mx-auto">
                        <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-0.5 bg-neutral-200 -z-10" />
                        {[
                            { step: "01", title: "Completá tu aplicación", desc: "Completás un formulario con tus datos, formación y experiencia." },
                            { step: "02", title: "Proceso de validación", desc: "Revisamos tu perfil y acordamos una breve entrevista de alineación." },
                            { step: "03", title: "Activación dentro de la red", desc: "Una vez validado, tu perfil queda activo y comenzás a recibir consultas." },
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center space-y-4 bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
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

            {/* --- POSICIONAMIENTO EMOCIONAL --- */}
            <section className="py-24 bg-secondary text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <svg width="200" height="200" viewBox="0 0 100 100" fill="currentColor">
                        <circle cx="50" cy="50" r="40" />
                    </svg>
                </div>
                <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center space-y-6 relative z-10">
                    <h2 className="text-3xl md:text-4xl font-bold font-display leading-tight">
                        No buscamos volumen. Buscamos compromiso.
                    </h2>
                    <p className="text-lg text-blue-100/80 leading-relaxed">
                        Estamos construyendo una red profesional de referencia en Latinoamérica.<br />
                        Si tu enfoque es serio, humano y basado en evidencia, este espacio es para vos.
                    </p>
                </div>
            </section>

            {/* --- ÁREAS --- */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 md:px-6">
                    <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary text-center mb-12">
                        Áreas que estamos incorporando
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { name: "Salud Mental", icon: <LucideIcons.Brain className="h-8 w-8 text-neutral-600" /> },
                            { name: "Nutrición", icon: <LucideIcons.Apple className="h-8 w-8 text-neutral-600" /> },
                            { name: "Movimiento y Salud Física", icon: <LucideIcons.Activity className="h-8 w-8 text-neutral-600" /> },
                            { name: "Maternidad y Familia", icon: <LucideIcons.Users className="h-8 w-8 text-neutral-600" /> },
                            { name: "Coaching", icon: <LucideIcons.Target className="h-8 w-8 text-neutral-600" /> },
                            { name: "Espiritualidad y Propósito", icon: <LucideIcons.Sparkles className="h-8 w-8 text-neutral-600" /> },
                        ].map((area, idx) => (
                            <div key={idx} className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-neutral-100 hover:shadow-lg hover:border-neutral-300 transition-all group">
                                <div className="p-4 rounded-full mb-4 bg-neutral-100 group-hover:scale-110 transition-transform">
                                    {area.icon}
                                </div>
                                <span className="font-bold text-secondary font-display text-center">{area.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FAQ --- */}
            <section className="py-24 bg-neutral-50">
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
                            answer="Absolutamente. Vos gestionás tu disponibilidad al 100%. Podés abrir y cerrar agenda cuando quieras desde tu panel."
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

            {/* --- CTA FINAL — FORMULARIO --- */}
            <section className="py-24 bg-white text-center">
                <div className="container mx-auto px-4 md:px-6 space-y-6 max-w-xl">
                    <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary">
                        Aplicá para formar parte de SmartWell
                    </h2>
                    <p className="text-text-secondary text-lg">Revisamos cada aplicación de forma individual.</p>
                    <Button
                        className="bg-primary hover:bg-primary-active text-white h-14 px-10 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
                        asChild
                    >
                        <Link href="/postulacion">
                            Aplicar ahora <ArrowRight className="ml-2 h-5 w-5 inline" />
                        </Link>
                    </Button>
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
