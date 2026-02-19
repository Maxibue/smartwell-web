
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Search, UserCheck, CalendarCheck, Smile, ShieldCheck } from "lucide-react";

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-50">
            <Navbar />

            <main className="flex-1 py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">

                    {/* Header Section */}
                    <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
                        <h1 className="text-4xl md:text-5xl font-bold font-display text-secondary mb-6">
                            Cómo funciona SmartWell
                        </h1>
                        <p className="text-xl text-text-secondary font-medium">
                            Simple, seguro y profesional.
                        </p>
                    </div>

                    {/* Steps Section */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 mb-20 relative">

                        {/* Connecting Line (Desktop Only) */}
                        <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-neutral-200 -z-10"></div>

                        {/* Step 1 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 flex flex-col items-center text-center h-full hover:shadow-md transition-shadow relative z-10">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-sm border border-primary/20">
                                <Search className="h-8 w-8" />
                            </div>
                            <div className="absolute top-8 right-8 font-display text-6xl text-neutral-100 font-bold -z-10 select-none">1</div>
                            <h3 className="text-lg font-bold text-secondary mb-3">Contanos qué buscás</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Completá un breve formulario para entender tus necesidades y preferencias.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 flex flex-col items-center text-center h-full hover:shadow-md transition-shadow relative z-10">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-sm border border-primary/20">
                                <UserCheck className="h-8 w-8" />
                            </div>
                            <div className="absolute top-8 right-8 font-display text-6xl text-neutral-100 font-bold -z-10 select-none">2</div>
                            <h3 className="text-lg font-bold text-secondary mb-3">Tu match ideal</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Te mostramos los profesionales más adecuados de nuestra red validada para ayudarte.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 flex flex-col items-center text-center h-full hover:shadow-md transition-shadow relative z-10">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-sm border border-primary/20">
                                <CalendarCheck className="h-8 w-8" />
                            </div>
                            <div className="absolute top-8 right-8 font-display text-6xl text-neutral-100 font-bold -z-10 select-none">3</div>
                            <h3 className="text-lg font-bold text-secondary mb-3">Reservás tu sesión</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Agendás online en pocos pasos, de forma clara, transparente y segura.
                            </p>
                        </div>

                        {/* Step 4 */}
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100 flex flex-col items-center text-center h-full hover:shadow-md transition-shadow relative z-10">
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-sm border border-primary/20">
                                <Smile className="h-8 w-8" />
                            </div>
                            <div className="absolute top-8 right-8 font-display text-6xl text-neutral-100 font-bold -z-10 select-none">4</div>
                            <h3 className="text-lg font-bold text-secondary mb-3">Comenzás tu proceso</h3>
                            <p className="text-text-secondary text-sm leading-relaxed">
                                Recibís acompañamiento profesional validado y adaptado a tus objetivos.
                            </p>
                        </div>
                    </div>

                    {/* Trust Message */}
                    <div className="bg-secondary/5 rounded-xl p-6 md:p-8 max-w-2xl mx-auto text-center mb-16 border border-secondary/10">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                            <ShieldCheck className="h-8 w-8 text-primary shrink-0" />
                            <p className="text-secondary font-medium">
                                Todos nuestros profesionales pasan por un estricto proceso de validación antes de formar parte de la red.
                            </p>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="text-center">
                        <Button size="lg" className="bg-primary hover:bg-primary-active text-white text-lg px-10 h-14 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transform hover:scale-105 transition-all duration-300" asChild>
                            <Link href="/comenzar">
                                ENCONTRAR UN PROFESIONAL
                            </Link>
                        </Button>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
