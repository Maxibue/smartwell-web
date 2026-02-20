"use client";

import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

import { PROFESSIONAL_CATEGORIES } from "@/lib/categories";

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
                    {PROFESSIONAL_CATEGORIES.map((category) => (
                        <div key={category.id} className="flex flex-col">
                            <h2 className="text-2xl font-bold text-secondary font-display mb-6 pb-3 border-b border-neutral-100">
                                {category.name}
                            </h2>
                            <ul className="flex flex-col gap-4">
                                {(category.subcategories || []).map((sub, i) => (
                                    <li key={i}>
                                        <Link
                                            href={`/profesionales?area=${category.id}&search=${encodeURIComponent(sub)}`}
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
