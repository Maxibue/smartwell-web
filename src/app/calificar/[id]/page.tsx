"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewForm } from "@/components/ReviewForm";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createReview, canReviewAppointment } from "@/lib/reviews";
import Link from "next/link";

interface AppointmentData {
    professionalId: string;
    professionalName: string;
    professionalTitle: string;
    date: string;
    time: string;
    status: string;
}

export default function ReviewAppointmentPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [appointment, setAppointment] = useState<AppointmentData | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push(`/login?redirect=/calificar/${params.id}`);
                return;
            }

            setUserId(user.uid);

            // Get user name
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUserName(`${userData.firstName} ${userData.lastName}`);
            }

            await loadAppointment(user.uid);
        });

        return () => unsubscribe();
    }, [params.id]);

    const loadAppointment = async (uid: string) => {
        try {
            setLoading(true);
            setError(null);

            // Check if user can review this appointment
            const eligibility = await canReviewAppointment(params.id, uid);
            if (!eligibility.canReview) {
                setError(eligibility.reason || "No puedes calificar esta cita");
                setLoading(false);
                return;
            }

            // Load appointment data
            const appointmentDoc = await getDoc(doc(db, "appointments", params.id));
            if (!appointmentDoc.exists()) {
                setError("Cita no encontrada");
                setLoading(false);
                return;
            }

            const data = appointmentDoc.data();
            setAppointment({
                professionalId: data.professionalId,
                professionalName: data.professionalName,
                professionalTitle: data.professionalTitle || "Lic.",
                date: data.date,
                time: data.time,
                status: data.status,
            });
        } catch (err: any) {
            console.error("Error loading appointment:", err);
            setError("Error al cargar la información de la cita");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (rating: number, comment: string) => {
        if (!userId || !appointment) return;

        try {
            setSubmitting(true);
            await createReview(
                appointment.professionalId,
                userId,
                userName,
                params.id,
                rating,
                comment
            );
            setSuccess(true);
        } catch (err: any) {
            throw new Error(err.message || "Error al enviar la calificación");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-xl border border-neutral-200 p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-xl font-bold text-secondary mb-2">
                            No se puede calificar esta cita
                        </h2>
                        <p className="text-text-secondary mb-6">{error}</p>
                        <Link href="/panel-usuario/turnos">
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver a Mis Turnos
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-xl border border-neutral-200 p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-secondary mb-2">
                            ¡Gracias por tu calificación!
                        </h2>
                        <p className="text-text-secondary mb-6">
                            Tu opinión ayuda a otros usuarios a tomar mejores decisiones.
                            La calificación será revisada antes de publicarse.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link href="/panel-usuario/turnos">
                                <Button className="w-full">
                                    Volver a Mis Turnos
                                </Button>
                            </Link>
                            <Link href={`/profesionales/${appointment?.professionalId}`}>
                                <Button variant="outline" className="w-full">
                                    Ver Perfil del Profesional
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!appointment) {
        return null;
    }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
                <div className="mb-6">
                    <Link href="/panel-usuario/turnos">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                    </Link>
                </div>

                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-secondary mb-2">
                        Calificar Sesión
                    </h1>
                    <p className="text-text-secondary">
                        Sesión con {appointment.professionalTitle} {appointment.professionalName}
                    </p>
                    <p className="text-sm text-text-muted">
                        {new Date(appointment.date).toLocaleDateString("es-AR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}{" "}
                        a las {appointment.time}
                    </p>
                </div>

                <ReviewForm
                    professionalId={appointment.professionalId}
                    professionalName={`${appointment.professionalTitle} ${appointment.professionalName}`}
                    appointmentId={params.id}
                    onSubmit={handleSubmitReview}
                    onCancel={() => router.push("/panel-usuario/turnos")}
                />
            </main>
        </div>
    );
}
