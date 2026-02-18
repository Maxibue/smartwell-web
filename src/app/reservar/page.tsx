"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import BookingCalendar from "@/components/BookingCalendar";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Calendar, Clock, DollarSign, User, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { generateRoomName, generateJitsiUrl } from "@/lib/jitsi";
import {
    notifyProfessionalNewAppointment,
    notifyPatientAppointmentConfirmed
} from "@/lib/notifications";

interface Professional {
    id: string;
    firstName: string;
    lastName: string;
    title: string;
    specialty: string;
    category: string;
    price: number;
    sessionDuration: number;
    profileImage?: string;
}

export default function ReservarPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const professionalId = searchParams.get("professional");

    const [loading, setLoading] = useState(true);
    const [authChecked, setAuthChecked] = useState(false); // true cuando Firebase resolvió el estado de auth
    const [booking, setBooking] = useState(false);
    const [professional, setProfessional] = useState<Professional | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                // Guardar la URL completa para redirigir de vuelta después del login
                const currentUrl = window.location.pathname + window.location.search;
                router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
            } else {
                setUserId(user.uid);
                setAuthChecked(true); // Auth resuelto: ahora sí podemos hacer queries
            }
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (professionalId) {
            loadProfessional();
        }
    }, [professionalId]);

    const loadProfessional = async () => {
        if (!professionalId) return;

        try {
            // Check for mock IDs first
            if (professionalId.startsWith("mock")) {
                const mockData: Record<string, Professional> = {
                    "mock1": {
                        id: "mock1",
                        firstName: "Mariana",
                        lastName: "Costa",
                        title: "Lic.",
                        specialty: "Psicóloga Clínica",
                        category: "Salud Mental",
                        price: 45000,
                        sessionDuration: 50,
                        profileImage: "https://i.pravatar.cc/150?u=mock_psy"
                    },
                    "mock2": {
                        id: "mock2",
                        firstName: "Lucas",
                        lastName: "Funes",
                        title: "Lic.",
                        specialty: "Nutricionista Deportivo",
                        category: "Nutrición",
                        price: 35000,
                        sessionDuration: 50,
                        profileImage: "https://i.pravatar.cc/150?u=mock_nutri"
                    }
                };

                if (mockData[professionalId]) {
                    setProfessional(mockData[professionalId]);
                }
                setLoading(false);
                return;
            }

            const profDoc = await getDoc(doc(db, "professionals", professionalId));
            if (profDoc.exists()) {
                setProfessional({
                    id: profDoc.id,
                    ...profDoc.data(),
                } as Professional);
            }
        } catch (error) {
            console.error("Error loading professional:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSlot = (date: Date, time: string) => {
        setSelectedDate(date);
        setSelectedTime(time);
    };

    const handleConfirmBooking = async () => {
        if (!userId || !professionalId || !selectedDate || !selectedTime || !professional) {
            alert("Por favor seleccioná una fecha y hora");
            return;
        }

        setBooking(true);
        try {
            // Fecha en hora de Buenos Aires (ART, UTC-3)
            const dateStr = new Intl.DateTimeFormat("en-CA", {
                timeZone: "America/Argentina/Buenos_Aires",
                year: "numeric", month: "2-digit", day: "2-digit",
            }).format(selectedDate);


            // Generate Jitsi meeting room
            const tempAppointmentId = `temp-${Date.now()}`;
            const meetingRoomName = generateRoomName(tempAppointmentId, professionalId);
            const meetingUrl = generateJitsiUrl(meetingRoomName);

            // Create appointment
            const appointmentRef = await addDoc(collection(db, "appointments"), {
                userId,
                professionalId,
                date: dateStr,
                time: selectedTime,
                duration: professional.sessionDuration,
                status: "pending", // Will change to "confirmed" after payment
                price: professional.price,
                paymentStatus: "pending",
                createdAt: new Date(),
                professionalName: `${professional.firstName} ${professional.lastName}`,
                professionalTitle: professional.title || 'Lic.',
                professionalSpecialty: professional.specialty,
                meetingRoomName,
                meetingUrl,
            });

            // Get user data for email
            const userDoc = await getDoc(doc(db, "users", userId));
            const userData = userDoc.data();

            // Get professional email
            const profDoc = await getDoc(doc(db, "professionals", professionalId));
            const profData = profDoc.data();

            // Send confirmation emails (don't block on email sending)
            try {
                // Get authentication token
                const user = auth.currentUser;
                const token = user ? await user.getIdToken() : null;

                if (!token) {
                    console.warn('No auth token available for email sending');
                    throw new Error('Authentication required');
                }

                // Send email to patient
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        type: 'patient_confirmation',
                        data: {
                            patientId: userId,
                            patientName: userData?.displayName || userData?.email || 'Usuario',
                            patientEmail: userData?.email || '',
                            professionalName: `${professional.title} ${professional.firstName} ${professional.lastName}`,
                            professionalEmail: profData?.email || '',
                            date: dateStr,
                            time: selectedTime,
                            duration: professional.sessionDuration,
                            price: professional.price,
                            meetingLink: `${process.env.NEXT_PUBLIC_APP_URL}/videollamada?appointment=${appointmentRef.id}`,
                        }
                    })
                });

                // Send email to professional
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        type: 'professional_notification',
                        data: {
                            professionalId: professionalId,
                            patientName: userData?.displayName || userData?.email || 'Usuario',
                            patientEmail: userData?.email || '',
                            professionalName: `${professional.title} ${professional.firstName} ${professional.lastName}`,
                            professionalEmail: profData?.email || '',
                            date: dateStr,
                            time: selectedTime,
                            duration: professional.sessionDuration,
                            price: professional.price,
                        }
                    })
                });

            } catch (emailError) {
                console.error('Error sending confirmation emails:', emailError);
                // Don't fail the booking if emails fail
            }

            // Send in-app notifications
            try {
                const patientName = userData?.displayName || userData?.email || 'Usuario';
                const professionalName = `${professional.firstName} ${professional.lastName}`;

                // Notify Professional
                await notifyProfessionalNewAppointment({
                    professionalId: professionalId,
                    patientName: patientName,
                    appointmentId: appointmentRef.id,
                    date: dateStr,
                    time: selectedTime
                });

                // Notify Patient
                await notifyPatientAppointmentConfirmed({
                    patientId: userId,
                    professionalName: professionalName,
                    appointmentId: appointmentRef.id,
                    date: dateStr,
                    time: selectedTime
                });
            } catch (notificationError) {
                console.error('Error sending in-app notifications:', notificationError);
            }

            setShowConfirmation(true);

            // Redirect after 3 seconds
            setTimeout(() => {
                router.push("/panel-usuario/turnos");
            }, 3000);
        } catch (error) {
            console.error("Error creating appointment:", error);
            alert("Error al crear la reserva. Por favor intentá nuevamente.");
        } finally {
            setBooking(false);
        }
    };

    // Mostrar spinner mientras carga el profesional O mientras se verifica el auth
    if (loading || !authChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!professional) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-text-secondary mb-4">Profesional no encontrado</p>
                    <Link href="/profesionales">
                        <Button>Ver Profesionales</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (showConfirmation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary-dark/10 p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-secondary mb-2">
                        ¡Reserva Confirmada!
                    </h1>
                    <p className="text-text-secondary mb-6">
                        Tu turno ha sido reservado exitosamente
                    </p>
                    <div className="bg-neutral-50 rounded-lg p-4 mb-6 text-left">
                        <div className="flex items-center gap-3 mb-3">
                            <User className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-sm text-text-secondary">Profesional</p>
                                <p className="font-semibold text-secondary">
                                    {professional.title} {professional.firstName} {professional.lastName}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                            <Calendar className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-sm text-text-secondary">Fecha</p>
                                <p className="font-semibold text-secondary">
                                    {selectedDate?.toLocaleDateString("es-AR", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-sm text-text-secondary">Hora</p>
                                <p className="font-semibold text-secondary">{selectedTime}</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-text-secondary">
                        Redirigiendo a tus turnos...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <Link href={`/profesionales/${professionalId}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver al Perfil
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Professional Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 sticky top-6">
                            <div className="flex items-center gap-4 mb-4">
                                {professional.profileImage ? (
                                    <img
                                        src={professional.profileImage}
                                        alt={`${professional.firstName} ${professional.lastName}`}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-8 w-8 text-primary" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="font-bold text-secondary">
                                        {professional.title} {professional.firstName} {professional.lastName}
                                    </h2>
                                    <p className="text-sm text-text-secondary">{professional.specialty}</p>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-neutral-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-text-secondary">Duración</span>
                                    <span className="font-semibold text-secondary">
                                        {professional.sessionDuration} min
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-text-secondary">Precio</span>
                                    <span className="font-semibold text-primary text-lg">
                                        ${professional.price}
                                    </span>
                                </div>
                            </div>

                            {selectedDate && selectedTime && (
                                <div className="mt-6 pt-6 border-t border-neutral-200">
                                    <h3 className="font-semibold text-secondary mb-3">Resumen de Reserva</h3>
                                    <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            <span className="text-secondary">
                                                {selectedDate.toLocaleDateString("es-AR", {
                                                    day: "numeric",
                                                    month: "long",
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <span className="text-secondary">{selectedTime}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <DollarSign className="h-4 w-4 text-primary" />
                                            <span className="text-secondary font-semibold">
                                                ${professional.price}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleConfirmBooking}
                                        disabled={booking}
                                        className="w-full mt-4"
                                        size="lg"
                                    >
                                        {booking ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                Reservando...
                                            </>
                                        ) : (
                                            "Confirmar Reserva"
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Calendar */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                            <h1 className="text-2xl font-bold text-secondary mb-6">
                                Reservar Turno
                            </h1>
                            <BookingCalendar
                                professionalId={professionalId!}
                                onSelectSlot={handleSelectSlot}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
