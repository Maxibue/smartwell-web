
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Loader2, ArrowLeft, Calendar as CalendarIcon, Clock, DollarSign, User as PeopleIcon, Phone, Mail, CheckCircle2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, query, where } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Service {
    id: string;
    name: string;
    duration: number;
    price: number;
}

export default function ManualBookingPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState("");

    const [formData, setFormData] = useState({
        date: "",
        time: "",
        patientName: "",
        patientEmail: "",
        patientPhone: ""
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push("/login?redirect=/panel-profesional/agendar");
                return;
            }
            setUser(currentUser);

            // Fetch Services
            try {
                const q = query(collection(db, "professionals", currentUser.uid, "services"));
                const querySnapshot = await getDocs(q);
                const fetchedServices: Service[] = [];
                querySnapshot.forEach((doc) => {
                    fetchedServices.push({ id: doc.id, ...doc.data() } as Service);
                });
                setServices(fetchedServices);
                if (fetchedServices.length > 0) {
                    setSelectedServiceId(fetchedServices[0].id);
                }
            } catch (error) {
                console.error("Error fetching services:", error);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !selectedServiceId) return;

        setSubmitting(true);

        try {
            const selectedService = services.find(s => s.id === selectedServiceId);
            if (!selectedService) return;

            // Generate Appointment Data (matching calendar format)
            const appointmentData = {
                professionalId: user.uid,
                patientId: null, // No registered patient
                patientName: formData.patientName,
                patientEmail: formData.patientEmail || "",
                patientPhone: formData.patientPhone || "",
                service: selectedService.name,
                serviceId: selectedService.id,
                price: selectedService.price,
                date: formData.date,
                time: formData.time,
                duration: selectedService.duration,
                status: "confirmed", // Auto-confirmed since added by pro
                paymentStatus: "pending",
                createdAt: new Date(),
                createdBy: "professional",
                isManual: true
            };

            console.log("Creating manual appointment:", appointmentData);

            await addDoc(collection(db, "appointments"), appointmentData);

            console.log("Appointment created successfully");
            alert("✅ Turno creado correctamente");

            // Redirect back to calendar
            router.push("/panel-profesional/calendario");

        } catch (error: any) {
            console.error("Error creating manual booking:", error);
            console.error("Error code:", error.code);
            console.error("Error message:", error.message);
            alert(`❌ Error al crear la reserva: ${error.message || "Intente nuevamente"}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Button variant="ghost" className="pl-0 gap-2 hover:bg-transparent hover:text-primary" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" /> Volver al Panel
            </Button>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6 md:p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-secondary">Agendar Turno Manual</h1>
                    <p className="text-text-secondary">Registrá una cita para un paciente externo. Esto bloqueará el horario en tu agenda pública.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Patient Info Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-secondary flex items-center gap-2 border-b pb-2">
                            <PeopleIcon className="h-4 w-4 text-primary" /> Datos del Paciente
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="patientName">Nombre Completo *</Label>
                            <Input
                                id="patientName"
                                placeholder="Ej: Juan Pérez"
                                required
                                value={formData.patientName}
                                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="patientEmail">Email (Opcional)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <Input
                                        id="patientEmail"
                                        type="email"
                                        placeholder="juan@email.com"
                                        className="pl-9"
                                        value={formData.patientEmail}
                                        onChange={(e) => setFormData({ ...formData, patientEmail: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="patientPhone">Teléfono / WhatsApp (Opcional)</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <Input
                                        id="patientPhone"
                                        type="tel"
                                        placeholder="+54 11 ..."
                                        className="pl-9"
                                        value={formData.patientPhone}
                                        onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Service & Time Section */}
                    <div className="space-y-4 pt-2">
                        <h3 className="font-semibold text-secondary flex items-center gap-2 border-b pb-2">
                            <CalendarIcon className="h-4 w-4 text-primary" /> Detalle del Turno
                        </h3>

                        <div className="space-y-2">
                            <Label htmlFor="service">Servicio *</Label>
                            <select
                                id="service"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedServiceId}
                                onChange={(e) => setSelectedServiceId(e.target.value)}
                                required
                            >
                                {services.map(service => (
                                    <option key={service.id} value={service.id}>
                                        {service.name} ({service.duration} min) - ${service.price}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Fecha *</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time">Hora *</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <Input
                                        id="time"
                                        type="time"
                                        required
                                        className="pl-9"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button type="submit" size="lg" className="w-full md:w-auto" disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            {submitting ? "Guardando..." : "Confirmar Reserva"}
                        </Button>
                        <Button type="button" variant="outline" className="w-full md:w-auto" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
}
