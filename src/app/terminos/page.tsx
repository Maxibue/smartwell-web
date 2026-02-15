
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function TerminosPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-50">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-12 md:px-6 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 md:p-12">
                    <div className="mb-8 border-b border-neutral-100 pb-8">
                        <span className="text-sm font-bold tracking-wider text-primary uppercase mb-2 block">Usuarios</span>
                        <h1 className="text-3xl md:text-4xl font-bold font-display text-secondary mb-4">
                            Términos y Condiciones de Uso
                        </h1>
                        <p className="text-text-secondary">
                            Última actualización: 13 de febrero de 2026
                        </p>
                    </div>

                    <div className="prose prose-neutral max-w-none text-text-secondary space-y-8">

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">1. Aceptación</h2>
                            <p>
                                Al acceder y utilizar la plataforma SmartWell (en adelante, “SmartWell” o la “Plataforma”), el usuario acepta estos Términos y Condiciones. Si no está de acuerdo con ellos, debe abstenerse de utilizar la Plataforma.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">2. Naturaleza del Servicio</h2>
                            <p className="mb-4">
                                SmartWell es una plataforma tecnológica que facilita la conexión entre usuarios y profesionales independientes del ámbito del bienestar, salud mental y desarrollo personal.
                            </p>
                            <p className="mb-2 font-medium text-secondary">SmartWell:</p>
                            <ul className="list-disc pl-6 space-y-1 mb-4">
                                <li>No presta servicios médicos, psicológicos ni terapéuticos.</li>
                                <li>No realiza diagnósticos.</li>
                                <li>No prescribe tratamientos.</li>
                                <li>No supervisa prácticas clínicas.</li>
                            </ul>
                            <p>Actúa exclusivamente como intermediario tecnológico.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">3. Relación Profesional</h2>
                            <p className="mb-4">
                                La relación profesional se establece exclusivamente entre el Usuario y el Profesional seleccionado.
                            </p>
                            <p className="mb-2 font-medium text-secondary">SmartWell no:</p>
                            <ul className="list-disc pl-6 space-y-1 mb-4">
                                <li>Interviene en el vínculo terapéutico.</li>
                                <li>Controla el contenido de las sesiones.</li>
                                <li>Garantiza resultados.</li>
                            </ul>
                            <p>Cada Profesional actúa como prestador independiente.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">4. Emergencias</h2>
                            <p className="mb-4">
                                La Plataforma no está diseñada para emergencias médicas o psicológicas.
                            </p>
                            <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-red-800 font-medium">
                                En caso de emergencia, el Usuario debe contactar inmediatamente a los servicios de emergencia locales.
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">5. Pagos</h2>
                            <p className="mb-4">
                                Las tarifas son establecidas por cada Profesional.
                            </p>
                            <p className="mb-4">
                                SmartWell puede facilitar la gestión de pagos o reservas, pero no es responsable por:
                            </p>
                            <ul className="list-disc pl-6 space-y-1 mb-4">
                                <li>Reembolsos</li>
                                <li>Cancelaciones</li>
                                <li>Resultados de las sesiones</li>
                            </ul>
                            <p>Las políticas específicas pueden ser definidas por cada Profesional.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">6. Limitación de Responsabilidad</h2>
                            <p className="mb-4">SmartWell no será responsable por:</p>
                            <ul className="list-disc pl-6 space-y-1 mb-4">
                                <li>Decisiones clínicas</li>
                                <li>Consecuencias de tratamientos</li>
                                <li>Daños directos o indirectos derivados de la relación profesional</li>
                            </ul>
                            <p>
                                El Usuario reconoce que cualquier decisión sobre su salud o bienestar es adoptada bajo su propia responsabilidad.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">7. Propiedad Intelectual</h2>
                            <p>
                                Todos los contenidos, diseños, marcas y elementos de la Plataforma son propiedad exclusiva de SmartWell.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">8. Jurisdicción</h2>
                            <p className="mb-4">
                                Estos Términos se rigen por las leyes de la República Argentina.
                            </p>
                            <p>
                                Cualquier controversia será sometida a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
                            </p>
                        </section>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

