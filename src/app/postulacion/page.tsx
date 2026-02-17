"use client";

import { useEffect } from "react";
import Script from "next/script";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PostulacionPage() {
    useEffect(() => {
        const initForm = () => {
            // @ts-ignore
            if (window.hbspt) {
                // @ts-ignore
                window.hbspt.forms.create({
                    region: "na1",
                    portalId: "50445947",
                    formId: "ef5165d6-caf7-4dd5-a11b-3382a8ce86ae",
                    target: "#hubspot-form"
                });
            }
        };

        // Si el script ya cargó, inicializar. Si no, esperar al onLoad de Next/Script.
        // @ts-ignore
        if (window.hbspt) {
            initForm();
        }
    }, []);

    const handleScriptLoad = () => {
        // @ts-ignore
        if (window.hbspt) {
            // Un pequeño delay para asegurar que el DOM esté listo
            setTimeout(() => {
                // @ts-ignore
                window.hbspt.forms.create({
                    region: "na1",
                    portalId: "50445947",
                    formId: "ef5165d6-caf7-4dd5-a11b-3382a8ce86ae",
                    target: "#hubspot-form"
                });
            }, 500);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-text-primary">
            <Script
                src="https://js.hsforms.net/forms/embed/v2.js"
                strategy="afterInteractive"
                onLoad={handleScriptLoad}
            />
            <Navbar />

            <section className="pt-24 pb-32 bg-background relative overflow-hidden">
                {/* Background Decorations */}
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="container mx-auto px-4 md:px-6 relative z-10">
                    <div className="max-w-4xl mx-auto text-center mb-12 space-y-4">
                        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary shadow-sm mb-4">
                            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                            PROCESO DE SELECCIÓN
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold font-display text-secondary leading-tight">
                            Postulación a la Red SmartWell
                        </h1>
                        <p className="text-xl text-text-secondary">
                            Completá el siguiente formulario para iniciar tu proceso de validación. Nuestro equipo revisará tu perfil en las próximas 48 horas.
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl border border-neutral-100 p-8 md:p-12 min-h-[600px] transform transition-all">
                        {/* Placeholder mientras carga el form */}
                        <div id="hubspot-form" className="w-full">
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-text-secondary font-medium">Cargando formulario de postulación...</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-center text-text-secondary space-y-2">
                        <p className="text-sm">¿Tenés dudas sobre el proceso? Escribinos a <a href="mailto:hola@smartwellapp.com" className="text-primary font-semibold hover:underline">hola@smartwellapp.com</a></p>
                        <p className="text-xs opacity-50 uppercase tracking-widest font-bold">SmartWell LATAM • 2026</p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
