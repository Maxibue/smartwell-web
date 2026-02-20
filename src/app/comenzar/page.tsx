"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import * as LucideIcons from "lucide-react";
import { PROFESSIONAL_CATEGORIES } from "@/lib/categories";

export default function ComenzarPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-16 md:py-24 max-w-6xl">
                <div className="mb-16 md:mb-20 text-center max-w-3xl mx-auto">
                    <span className="text-primary font-semibold tracking-wider text-sm uppercase mb-3 block">Áreas de Bienestar</span>
                    <h1 className="text-3xl md:text-5xl font-bold font-display text-secondary mb-4 leading-tight">
                        Elegí el área que mejor se adapta a lo que necesitás hoy.
                    </h1>
                    <p className="text-lg text-text-secondary">
                        Seleccioná una opción para ver profesionales validados en Latinoamérica.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {PROFESSIONAL_CATEGORIES.map((category) => {
                        const IconComponent = (LucideIcons as any)[category.icon];
                        return (
                            <div key={category.id} className="flex flex-col p-8 bg-white border border-neutral-200 rounded-2xl shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-neutral-300 transition-all duration-300">
                                <div className="flex flex-col items-start gap-4 mb-5 pb-5 border-b border-neutral-100">
                                    <div className="p-3 bg-neutral-50 rounded-xl">
                                        {IconComponent && <IconComponent className="h-6 w-6 text-neutral-600" />}
                                    </div>
                                    <h2 className="text-xl font-bold text-secondary font-display">
                                        {category.name}
                                    </h2>
                                </div>
                                <ul className="flex flex-col gap-3">
                                    {(category.subcategories || []).map((sub, i) => (
                                        <li key={i}>
                                            <Link
                                                href={`/profesionales?area=${category.id}&search=${encodeURIComponent(sub)}`}
                                                className="text-[15px] text-text-secondary hover:text-primary font-medium transition-colors duration-200 inline-flex hover:underline underline-offset-[4px] decoration-primary/30"
                                            >
                                                {sub}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </main>

            <Footer />
        </div>
    );
}
