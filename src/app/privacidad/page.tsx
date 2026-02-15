
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function PrivacidadPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-50">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-12 md:px-6 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 md:p-12">
                    <div className="mb-8 border-b border-neutral-100 pb-8">
                        <h1 className="text-3xl md:text-4xl font-bold font-display text-secondary mb-4">
                            Política de Privacidad
                        </h1>
                        <p className="text-text-secondary">
                            Última actualización: 13 de febrero de 2026
                        </p>
                    </div>

                    <div className="prose prose-neutral max-w-none text-text-secondary space-y-8">

                        <p className="font-medium text-secondary">
                            SmartWell cumple con la Ley 25.326 de Protección de Datos Personales de la República Argentina.
                        </p>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">1. Datos Recopilados</h2>
                            <p className="mb-2">Podemos recopilar:</p>
                            <ul className="list-disc pl-6 space-y-1 mb-4">
                                <li>Nombre y datos de contacto</li>
                                <li>Información profesional</li>
                                <li>Información sensible de salud o bienestar</li>
                                <li>Datos de uso de la plataforma</li>
                                <li>Datos de pago</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">2. Datos Sensibles</h2>
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-blue-800 font-medium">
                                El Usuario presta consentimiento expreso para el tratamiento de datos sensibles relacionados con su salud o bienestar, exclusivamente para facilitar el proceso de conexión con Profesionales.
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">3. Finalidad</h2>
                            <p className="mb-2">Los datos se utilizan para:</p>
                            <ul className="list-disc pl-6 space-y-1 mb-4">
                                <li>Operar la Plataforma</li>
                                <li>Facilitar el matching</li>
                                <li>Gestionar reservas</li>
                                <li>Mejorar la experiencia</li>
                                <li>Garantizar seguridad</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">4. Compartición</h2>
                            <p className="mb-4">
                                No vendemos datos personales.
                            </p>
                            <p>
                                Compartimos información únicamente con el Profesional seleccionado por el Usuario y solo la necesaria para prestar el servicio.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">5. Seguridad</h2>
                            <p className="mb-4">
                                Implementamos medidas técnicas y organizativas razonables para proteger la información.
                            </p>
                            <p className="italic">
                                Sin embargo, ningún sistema es 100% seguro.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">6. Derechos del Usuario</h2>
                            <p className="mb-2">El Usuario puede:</p>
                            <ul className="list-disc pl-6 space-y-1 mb-4">
                                <li>Acceder a sus datos</li>
                                <li>Rectificarlos</li>
                                <li>Solicitar eliminación</li>
                                <li>Revocar consentimiento</li>
                            </ul>
                            <p>
                                Contactando a: <a href="mailto:privacidad@smartwell.com" className="text-primary hover:underline">privacidad@smartwell.com</a>
                            </p>
                        </section>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
