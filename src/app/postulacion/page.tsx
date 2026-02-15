"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Script from "next/script";

export default function ApplicationPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />

            <main className="flex-grow pt-24 pb-20">
                <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                    <div className="text-center mb-12 space-y-4">
                        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary shadow-sm">
                            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                            PROCESO DE SELECCIÓN
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold font-display text-secondary">
                            Postulación a la Red SmartWell
                        </h1>
                        <p className="text-lg text-text-secondary leading-relaxed max-w-xl mx-auto">
                            Completá el siguiente formulario para iniciar tu proceso de validación.
                            Nuestro equipo revisará tu perfil en las próximas 48 horas.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl border border-neutral-100 p-6 md:p-10">
                        {/* HubSpot Form Embed */}
                        <div
                            className="hs-form-frame"
                            data-region="na1"
                            data-form-id="108afdb6-91fd-46ca-8091-6f08d28f488c"
                            data-portal-id="50445947"
                        ></div>
                        <Script
                            src="https://js.hsforms.net/forms/embed/50445947.js"
                            strategy="afterInteractive"
                            defer
                        />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
