import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function TerminosProfesionalesPage() {
    return (
        <div className="min-h-screen flex flex-col bg-neutral-50">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-12 md:px-6 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 md:p-12">
                    <div className="mb-8 border-b border-neutral-100 pb-8">
                        <span className="text-sm font-bold tracking-wider text-accent uppercase mb-2 block">Profesionales</span>
                        <h1 className="text-3xl md:text-4xl font-bold font-display text-secondary mb-4">
                            Condiciones de Registro y Uso
                        </h1>
                        <p className="text-text-secondary">
                            Última actualización: {new Date().toLocaleDateString('es-AR')}
                        </p>
                    </div>

                    <div className="prose prose-neutral max-w-none text-text-secondary space-y-8">

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">1. Naturaleza del Vínculo</h2>
                            <p className="mb-4">
                                Los Profesionales que se registran en SmartWell actúan como prestadores independientes.
                            </p>
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-blue-800 font-medium">
                                No existe relación laboral, societaria, de representación ni mandato entre SmartWell y el Profesional.
                            </div>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">2. Responsabilidad Profesional</h2>
                            <p className="mb-4">
                                El Profesional declara y garantiza que:
                            </p>
                            <ul className="list-disc pl-6 space-y-1 mb-4">
                                <li>Cuenta con la formación necesaria.</li>
                                <li>Posee matrícula o certificación válida cuando corresponda.</li>
                                <li>Cumple con las normativas vigentes en su jurisdicción.</li>
                                <li>Es el único responsable por los servicios que presta.</li>
                            </ul>
                            <p className="font-medium text-secondary">SmartWell no supervisa diagnósticos ni tratamientos.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">3. Seguro Profesional</h2>
                            <p>
                                Cuando corresponda, el Profesional deberá contar con seguro de responsabilidad profesional vigente.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">4. Modelo de Intermediación</h2>
                            <p className="mb-4">
                                SmartWell actúa como plataforma tecnológica de intermediación.
                            </p>
                            <div className="bg-green-50 border border-green-100 p-4 rounded-lg text-green-800 font-medium mb-4">
                                Cuando un Usuario es derivado a un Profesional a través de la Plataforma, SmartWell podrá percibir una comisión del 10% sobre el valor efectivamente abonado por dicho Usuario.
                            </div>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>La comisión se aplica únicamente sobre clientes derivados por SmartWell.</li>
                                <li>No se aplica sobre clientes propios del Profesional.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">5. Conducta</h2>
                            <p className="mb-4">El Profesional se compromete a:</p>
                            <ul className="list-disc pl-6 space-y-1 mb-4">
                                <li>Mantener conducta ética.</li>
                                <li>No ofrecer servicios ilegales.</li>
                                <li>No desviar clientes fuera de la plataforma para evitar comisiones cuando el contacto haya sido generado por SmartWell.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-secondary mb-4">6. Terminación</h2>
                            <p>
                                SmartWell podrá suspender o cancelar perfiles que incumplan estas condiciones.
                            </p>
                        </section>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
