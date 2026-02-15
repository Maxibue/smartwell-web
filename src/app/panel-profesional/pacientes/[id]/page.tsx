
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input, Label } from "@/components/ui/Input";
import {
    User as UserIcon,
    Phone,
    Mail,
    Calendar,
    Clock,
    Video,
    Save,
    Loader2,
    ArrowLeft,
    FileText,
    MessageSquare,
    Link as LinkIcon
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    setDoc,
    serverTimestamp
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

interface PatientData {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    image?: string;
    notes?: string; // Private notes
}

interface Booking {
    id: string;
    serviceName: string;
    date: string;
    time: string;
    status: string;
    user?: {
        phone?: string;
    };
}

export default function PatientDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [patient, setPatient] = useState<PatientData | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }
            setCurrentUser(user);
            await fetchPatientData(user.uid, params.id);
        });
        return () => unsubscribe();
    }, [params.id, router]);

    const fetchPatientData = async (profId: string, patientId: string) => {
        try {
            // 1. Fetch Basic User Info (from users collection)
            const userRef = doc(db, "users", patientId);
            const userSnap = await getDoc(userRef);
            let basicData: any = {};

            if (userSnap.exists()) {
                basicData = userSnap.data();
            } else {
                // Determine user info from bookings if not registered properly
                // This is a fallback if needed
            }

            // 2. Fetch Private Data (Notes) for this patient by this professional
            const privateDataRef = doc(db, "professionals", profId, "patients", patientId);
            const privateDataSnap = await getDoc(privateDataRef);
            let privateData = {};
            if (privateDataSnap.exists()) {
                privateData = privateDataSnap.data();
                setNotes(privateDataSnap.data().notes || "");
            }

            // 3. Fetch History (Bookings) to get phone number from checkout data if missing
            const bookingsQuery = query(
                collection(db, "bookings"),
                where("professionalId", "==", profId),
                // We're assuming the patient ID matches the user's UID stored in booking user.uid or similar
                // If the booking user logic stored email but not UID, we might need a workaround.
                // Let's assume we navigate here via UID.
                // But wait, checkout page stores `user: { name, email, phone }`, potentially no UID if guest?
                // If logged in, we should store UID.
            );

            // To be safe, let's filter bookings by email if we have it, or exact match on stored UID if we did that.
            // For this implementation, let's rely on finding bookings where `user.email` matches the patient email
            // OR where `userId` matches (if we added that field). 
            // Checkout page logic check: 
            // `const bookingData = { ... user: userData ... }`
            // It doesn't explicitly store userId. 
            // So we might need to rely on email matching for history.

            let patientEmail = basicData.email;
            let patientPhone = basicData.phone;

            const allBookingsSnap = await getDocs(bookingsQuery);
            const patientBookings: Booking[] = [];

            allBookingsSnap.forEach(doc => {
                const bData = doc.data();
                // Filter manually for this patient (by email or explicit ID if we add it)
                // Assuming we passed the UID because we found them in a list of bookings?
                // If we come from a booking list, we know the booking.
                // Let's assume for now we use email matching if available.

                if (bData.user?.email === patientEmail || doc.id === patientId /* fallback if param is bookingId? no */) {
                    patientBookings.push({ id: doc.id, ...bData } as Booking);
                    if (!patientPhone && bData.user?.phone) {
                        patientPhone = bData.user.phone;
                    }
                }
            });

            // Sort bookings
            patientBookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setBookings(patientBookings);

            setPatient({
                uid: patientId,
                name: basicData.name || basicData.displayName || "Paciente", // Fallback
                email: basicData.email,
                phone: patientPhone,
                image: basicData.image || basicData.photoURL,
                notes: (privateData as any).notes
            });

        } catch (error) {
            console.error("Error fetching patient details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!currentUser || !patient) return;
        setSaving(true);
        try {
            const docRef = doc(db, "professionals", currentUser.uid, "patients", patient.uid);
            await setDoc(docRef, {
                notes: notes,
                lastUpdated: serverTimestamp(),
                // We can also copy essential info here for easier listing later
                name: patient.name,
                email: patient.email
            }, { merge: true });
        } catch (error) {
            console.error("Error saving notes:", error);
        } finally {
            setSaving(false);
        }
    };

    // Helper for WhatsApp Link
    const getWhatsAppLink = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        return `https://wa.me/${cleanPhone}`;
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!patient) {
        return <div className="p-8 text-center text-text-secondary">Paciente no encontrado.</div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <Button variant="ghost" className="pl-0 gap-2 hover:bg-transparent hover:text-primary" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" /> Volver
            </Button>

            {/* Header & Contact Info */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
                <div className="flex items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold border-4 border-white shadow-sm shrink-0">
                        {patient.image ? (
                            <img src={patient.image} alt={patient.name} className="h-full w-full rounded-full object-cover" />
                        ) : (
                            patient.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-secondary mb-1">{patient.name}</h1>
                        <div className="flex flex-col gap-2 text-text-secondary text-sm">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-neutral-400" />
                                {patient.email}
                            </div>
                            {patient.phone ? (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-neutral-400" />
                                    {patient.phone}
                                    <a
                                        href={getWhatsAppLink(patient.phone)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium hover:bg-green-100 ml-2 border border-green-200"
                                    >
                                        <MessageSquare className="h-3 w-3" /> WhatsApp
                                    </a>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-neutral-400 italic">
                                    <Phone className="h-4 w-4" />
                                    Sin teléfono registrado
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Clinical Notes */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 flex flex-col h-full">
                        <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                            <h3 className="font-bold text-secondary flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" /> Notas Clínicas & Privadas
                            </h3>
                            <span className="text-xs text-text-muted bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100">
                                Solo visible para vos
                            </span>
                        </div>
                        <div className="p-4 flex-1 flex flex-col gap-4">
                            <Textarea
                                placeholder="Escribí acá tus observaciones, antecedentes, o recordatorios sobre este paciente..."
                                className="flex-1 min-h-[300px] text-base leading-relaxed resize-none p-4"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <Button onClick={handleSaveNotes} disabled={saving} className="min-w-[120px]">
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    {saving ? "Guardando..." : "Guardar Notas"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: History */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50">
                            <h3 className="font-bold text-secondary flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" /> Historial de Turnos
                            </h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto divide-y divide-neutral-100">
                            {bookings.length === 0 ? (
                                <p className="p-6 text-center text-sm text-text-muted">No hay turnos registrados.</p>
                            ) : (
                                bookings.map(booking => (
                                    <div key={booking.id} className="p-4 hover:bg-neutral-50 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-semibold text-secondary text-sm">{booking.serviceName}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${booking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                                }`}>
                                                {booking.status === 'confirmed' ? 'Confirmado' : booking.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                                            <Calendar className="h-3 w-3" />
                                            {format(parseISO(booking.date), "d MMM yyyy", { locale: es })}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-text-secondary mt-1">
                                            <Clock className="h-3 w-3" />
                                            {booking.time} hs
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
