import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
    title: "Sobre Nosotros | SmartWell",
    description: "SmartWell es una red profesional validada que facilita decisiones informadas en bienestar en Latinoamérica.",
};

export default function SobreNosotrosPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col font-sans text-text-primary">
            <Navbar />

            <main className="flex-1">
                {/* --- HERO SECTION --- */}
                <section className="pt-24 pb-20 md:pt-32 md:pb-28 bg-white selection:bg-neutral-100">
                    <div className="container mx-auto px-4 md:px-6 max-w-4xl text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold font-display text-secondary tracking-tight leading-[1.1] mb-8">
                            Bienestar profesional <br className="hidden md:block" /> con criterio.
                        </h1>
                        <p className="text-lg md:text-2xl text-text-secondary leading-relaxed font-light max-w-3xl mx-auto">
                            SmartWell es una red profesional validada que facilita decisiones informadas en bienestar en Latinoamérica.
                        </p>
                    </div>
                </section>

                {/* --- SECCIÓN 1: CONTEXTO --- */}
                <section className="py-20 md:py-32 bg-neutral-50/50">
                    <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                        <div className="space-y-8 text-lg md:text-xl text-text-secondary leading-relaxed font-light">
                            <p>
                                <span className="font-semibold text-secondary">SmartWell</span> nace de una convicción clara: el bienestar no es una tendencia, es una decisión técnica.
                            </p>
                            <p>
                                En Latinoamérica, el acceso a profesionales del bienestar suele estar fragmentado. Existen múltiples opciones, pero no siempre claridad sobre estándares, enfoques o validación.
                            </p>
                            <div className="py-4 border-l-2 border-primary/30 pl-6 my-8">
                                <p className="text-xl md:text-2xl font-medium text-secondary italic">
                                    SmartWell no es un directorio abierto. <br className="hidden sm:block" />
                                    Es una red profesional validada.
                                </p>
                            </div>
                            <p>
                                Seleccionamos especialistas bajo criterios técnicos, experiencia comprobable y compromiso ético, para que cada persona pueda elegir con información, no con intuición.
                            </p>
                        </div>
                    </div>
                </section>

                {/* --- SECCIÓN 2: NUESTRO ENFOQUE --- */}
                <section className="py-20 md:py-32 bg-white">
                    <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                        <h2 className="text-3xl md:text-5xl font-bold font-display text-secondary mb-10 tracking-tight leading-tight">
                            Elegir el acompañamiento correcto cambia el resultado.
                        </h2>

                        <div className="space-y-8 text-lg md:text-xl text-text-secondary leading-relaxed font-light">
                            <p>
                                Psicología, coaching, nutrición y desarrollo profesional trabajan dimensiones distintas del proceso humano. Confundirlas puede retrasar avances. Entenderlas acelera transformaciones.
                            </p>
                            <p className="font-medium text-secondary">
                                Por eso ponemos el criterio en el centro.
                            </p>

                            <ul className="space-y-4 pt-4">
                                <li className="flex items-start gap-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-2.5 shrink-0" />
                                    <span>No recomendamos por tendencia.</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-2.5 shrink-0" />
                                    <span>No promovemos soluciones rápidas.</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-2.5 shrink-0" />
                                    <span className="font-medium text-secondary">Facilitamos decisiones informadas.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* --- SECCIÓN 3: ESTÁNDAR Y VALIDACIÓN --- */}
                <section className="py-20 md:py-32 bg-neutral-50/50">
                    <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                        <h2 className="text-3xl md:text-4xl font-bold font-display text-secondary mb-10 tracking-tight">
                            Nuestro estándar
                        </h2>

                        <div className="space-y-10 text-lg md:text-xl text-text-secondary leading-relaxed font-light">
                            <p>
                                Cada profesional que forma parte de SmartWell atraviesa un proceso activo de validación que incluye:
                            </p>

                            <ul className="space-y-6 pt-2 pb-6">
                                <li className="flex items-start gap-5">
                                    <span className="text-neutral-400 font-normal select-none">—</span>
                                    <span>Verificación de formación y credenciales</span>
                                </li>
                                <li className="flex items-start gap-5">
                                    <span className="text-neutral-400 font-normal select-none">—</span>
                                    <span>Evaluación de experiencia profesional</span>
                                </li>
                                <li className="flex items-start gap-5">
                                    <span className="text-neutral-400 font-normal select-none">—</span>
                                    <span>Revisión de enfoque metodológico</span>
                                </li>
                                <li className="flex items-start gap-5">
                                    <span className="text-neutral-400 font-normal select-none">—</span>
                                    <span>Compromiso con confidencialidad estricta</span>
                                </li>
                            </ul>

                            <p className="text-2xl md:text-3xl font-display font-medium text-secondary pt-4 border-t border-neutral-200">
                                La confianza no se comunica. <br className="hidden sm:block" /> Se estructura.
                            </p>
                        </div>
                    </div>
                </section>

                {/* --- SECCIÓN 4: VISIÓN --- */}
                <section className="py-20 md:py-32 bg-white text-center">
                    <div className="container mx-auto px-4 md:px-6 max-w-3xl">
                        <h2 className="text-sm font-semibold tracking-widest uppercase text-neutral-400 mb-8">
                            Nuestra Visión
                        </h2>

                        <div className="space-y-8">
                            <h3 className="text-2xl md:text-4xl font-display font-medium text-secondary leading-tight">
                                Convertirnos en el estándar de bienestar profesional en Latinoamérica.
                            </h3>

                            <p className="text-lg md:text-xl text-text-secondary leading-relaxed font-light max-w-2xl mx-auto">
                                Un espacio donde las personas puedan iniciar procesos con claridad, seguridad y respaldo técnico.
                            </p>
                        </div>

                        <div className="mt-20 pt-16 border-t border-neutral-100">
                            <p className="text-xl md:text-2xl font-bold font-display text-secondary tracking-wide">
                                SmartWell.
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mt-6 text-sm md:text-base font-medium tracking-widest uppercase text-neutral-500">
                                <span>Profesional</span>
                                <span className="w-1 h-1 rounded-full bg-neutral-300" />
                                <span>Validado</span>
                                <span className="w-1 h-1 rounded-full bg-neutral-300" />
                                <span>Confidencial</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
