"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { addDoc, collection, doc, updateDoc, getDoc } from "firebase/firestore";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Booking {
    id: string; // This might be a mock ID or guest ID
    serviceName: string;
    servicePrice: number;
    date: string;
    time: string;
    professionalId: string;
    professionalName?: string;
    status: string;
    user: {
        name: string;
        email: string;
    };
    patientId?: string;
    createdAt?: any;
    meetingLink?: string;
}

export default function AssociateGuestBookingsPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error" | "no-data">("loading");
    const [processedCount, setProcessedCount] = useState(0);

    useEffect(() => {
        const processAssociations = async (currentUser: User) => {
            try {
                const stored = localStorage.getItem("guest_bookings");
                if (!stored) {
                    setStatus("no-data");
                    setTimeout(() => router.push("/panel-usuario/turnos"), 2000);
                    return;
                }

                const guestBookings: Booking[] = JSON.parse(stored);
                let count = 0;

                for (const booking of guestBookings) {
                    // Start saving to Firestore
                    // We need to create a new booking document linked to the real user
                    // And potentially remove the old guest one if it was saved (but current guest flow is localStorage only for ID)
                    // ACTUALLY: The checkout flow MIGHT have saved to Firestore as 'guest' user status? 
                    // Let's assume we re-create or update. 

                    // In current implementation (Checkout), we save to Firestore. 
                    // So we have a Firestore ID. We just need to attach the user ID.

                    if (booking.id && !booking.id.startsWith("guest_mock")) {
                        // Real Firestore Doc exists
                        const bookingRef = doc(db, "bookings", booking.id);
                        await updateDoc(bookingRef, {
                            "user.email": currentUser.email,
                            "user.name": currentUser.displayName || booking.user.name,
                            patientId: currentUser.uid,
                            userId: currentUser.uid // If we use this field
                        });
                        count++;
                    } else {
                        // It was a purely local mock? Create it for real.
                        await addDoc(collection(db, "bookings"), {
                            ...booking,
                            user: {
                                name: currentUser.displayName || booking.user.name,
                                email: currentUser.email
                            },
                            patientId: currentUser.uid,
                            userId: currentUser.uid,
                            status: 'confirmed', // Assume confirmed if they paid? Or pending.
                            createdAt: new Date()
                        });
                        count++;
                    }
                }

                setProcessedCount(count);
                setStatus("success");
                localStorage.removeItem("guest_bookings"); // Clear storage

            } catch (error) {
                console.error("Error associating bookings", error);
                setStatus("error");
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                processAssociations(user);
            } else {
                // Should not happen if redirected correctly, but redirect to login just in case
                router.push("/login?redirect=/panel-usuario/asociar");
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <h2 className="text-xl font-bold text-secondary">Estamos guardando tus turnos...</h2>
                <p className="text-text-secondary">Asociando tus reservas de invitado a tu nueva cuenta.</p>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-secondary">Hubo un problema</h2>
                <p className="text-text-secondary mb-6">No pudimos asociar automáticamente algunos turnos. Por favor contactá a soporte.</p>
                <Button onClick={() => router.push("/panel-usuario/turnos")}>
                    Ir a Mis Turnos
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="bg-green-100 p-4 rounded-full mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-secondary mb-2">¡Todo listo!</h2>
            <p className="text-text-secondary mb-8 text-lg">
                Hemos asociado exitosamente {processedCount} turno(s) a tu cuenta.
            </p>
            <Button size="lg" onClick={() => router.push("/panel-usuario/turnos")}>
                Ver Mis Turnos
            </Button>
        </div>
    );
}
