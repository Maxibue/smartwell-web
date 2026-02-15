
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Calendar, Home } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function BookingSuccessPage() {

    useEffect(() => {
        // Celebration effect
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#2CBFAE', '#FFD700']
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#2CBFAE', '#FFD700']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    }, []);

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <Navbar />

            <main className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>

                <h1 className="text-3xl font-bold text-secondary mb-2">¡Reserva Confirmada!</h1>
                <p className="text-text-secondary max-w-md mb-8">
                    Hemos enviado un email con los detalles de tu turno y el link de acceso a la videollamada.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/">
                        <Button variant="outline" className="w-full sm:w-auto">
                            <Home className="mr-2 h-4 w-4" /> Volver al Inicio
                        </Button>
                    </Link>
                    <Link href="/panel-usuario/turnos">
                        {/* Note: User panel not fully built yet, but good to have link */}
                        <Button className="w-full sm:w-auto">
                            <Calendar className="mr-2 h-4 w-4" /> Ver mis Turnos
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
