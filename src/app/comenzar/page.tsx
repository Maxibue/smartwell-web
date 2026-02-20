"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const AREAS = [
    {
        title: "Salud Mental",
        slug: "salud-mental",
        subcategories: [
            "Ansiedad y estrés",
            "Depresión y estado de ánimo",
            "Terapia individual",
            "Terapia de pareja",
            "Duelo y crisis personales",
            "Adolescencia e infancia"
        ]
    },
    {
        title: "Nutrición",
        slug: "nutricion",
        subcategories: [
            "Alimentación saludable",
            "Nutrición deportiva",
            "Reeducación alimentaria",
            "Relación con la comida",
            "Plan nutricional personalizado"
        ]
    },
    {
        title: "Movimiento y Salud Física",
        slug: "movimiento",
        subcategories: [
            "Entrenamiento personalizado",
            "Movilidad y postura",
            "Rehabilitación funcional",
            "Yoga terapéutico",
            "Bienestar corporal integral"
        ]
    },
    {
        title: "Maternidad y Familia",
        slug: "maternidad",
        subcategories: [
            "Lactancia",
            "Sueño infantil",
            "Orientación para padres",
            "Crianza y vínculos familiares"
        ]
    },
    {
        title: "Coaching",
        slug: "coaching",
        subcategories: [
            "Desarrollo de carrera",
            "Transición laboral",
            "Liderazgo",
            "Coaching ejecutivo",
            "Orientación vocacional"
        ]
    },
    {
        title: "Espiritualidad y Propósito",
        slug: "espiritualidad",
        subcategories: [
            "Búsqueda de propósito",
            "Acompañamiento espiritual",
            "Meditación y mindfulness",
            "Desarrollo personal profundo"
        ]
    }
];

export default function ComenzarPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-16 md:py-24 max-w-5xl">
                <div className="mb-16 md:mb-20 text-center max-w-2xl mx-auto">
                    <h1 className="text-3xl md:text-5xl font-bold font-display text-secondary mb-4 leading-tight">
                        Elegí el área que mejor se adapta a lo que necesitás hoy.
                    </h1>
                    <p className="text-lg text-text-secondary">
                        Seleccioná una opción para ver profesionales validados en Latinoamérica.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-16">
                    {AREAS.map((area) => (
                        <div key={area.title} className="flex flex-col">
                            <h2 className="text-2xl font-bold text-secondary font-display mb-6 pb-3 border-b border-neutral-100">
                                {area.title}
                            </h2>
                            <ul className="flex flex-col gap-4">
                                {area.subcategories.map((sub, i) => (
                                    <li key={i}>
                                        <Link
                                            href={`/profesionales?area=${area.slug}&search=${encodeURIComponent(sub)}`}
                                            className="text-[17px] text-text-secondary hover:text-secondary font-medium transition-colors duration-200 inline-flex hover:underline underline-offset-[5px] decoration-neutral-300"
                                        >
                                            {sub}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
}
