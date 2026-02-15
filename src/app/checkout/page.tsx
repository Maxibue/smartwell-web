
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";
import { Loader2, Calendar, Clock, CreditCard, ShieldCheck } from "lucide-react";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { MOCK_PROFESSIONALS } from "@/lib/mock-data";

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const professionalId = searchParams.get("professionalId");
    const serviceId = searchParams.get("serviceId");
    const dateStr = searchParams.get("date");
    const timeStr = searchParams.get("time");

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [professional, setProfessional] = useState<any>(null);
    const [service, setService] = useState<any>(null);

    // Mock User Data (In real app, get from Auth)
    const [userData, setUserData] = useState({
        name: "",
        email: "",
        phone: ""
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!professionalId || !serviceId) return;

            // CHECK FOR MOCK DATA FIRST
            if (MOCK_PROFESSIONALS[professionalId]) {
                const mockPro = MOCK_PROFESSIONALS[professionalId];
                setProfessional(mockPro.profile);

                const selectedService = mockPro.services.find((s: any) => s.id === serviceId);
                if (selectedService) {
                    setService(selectedService);
                }

                setLoading(false);
                return;
            }

            try {
                const proRef = doc(db, "professionals", professionalId);
                const proSnap = await getDoc(proRef);

                // Fetch Service from subcollection (or filter from fetched services if structure differs)
                // Since we stored services in a subcollection:
                const serviceRef = doc(db, "professionals", professionalId, "services", serviceId);
                const serviceSnap = await getDoc(serviceRef);

                if (proSnap.exists()) setProfessional(proSnap.data());
                if (serviceSnap.exists()) setService(serviceSnap.data());

            } catch (error) {
                console.error("Error fetching checkout data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [professionalId, serviceId]);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        // Simulate Payment Delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            // Save Booking to Firestore
            const bookingData = {
                professionalId,
                serviceId,
                serviceName: service.name,
                servicePrice: service.price,
                date: dateStr,
                time: timeStr,
                user: userData,
                status: "confirmed",
                createdAt: new Date(),
                paymentId: "mock_payment_" + Date.now()
            };

            const docRef = await addDoc(collection(db, "bookings"), bookingData);

            // SAVE TO LOCAL STORAGE FOR GUEST ACCESS
            const guestBooking = { id: docRef.id, ...bookingData };
            const existingBookings = JSON.parse(localStorage.getItem("guest_bookings") || "[]");
            localStorage.setItem("guest_bookings", JSON.stringify([...existingBookings, guestBooking]));

            // Redirect to Success
            router.push("/checkout/success");
        } catch (error) {
            console.error("Error processing booking:", error);
            alert("Hubo un error al procesar la reserva. Intente nuevamente.");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!professional || !service || !dateStr || !timeStr) {
        return <div className="p-8 text-center text-red-500">Datos de reserva inválidos.</div>;
    }

    const formattedDate = format(new Date(dateStr), "EEEE d 'de' MMMM", { locale: es });

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 md:px-6 max-w-4xl">
                <h1 className="text-2xl font-bold text-secondary mb-6">Finalizar Reserva</h1>

                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Payment Form */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                            <h2 className="text-lg font-bold text-secondary mb-4">1. Tus Datos</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre completo</Label>
                                    <Input
                                        placeholder="Ej: Juan Pérez"
                                        value={userData.name}
                                        onChange={e => setUserData({ ...userData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        placeholder="juan@email.com"
                                        value={userData.email}
                                        onChange={e => setUserData({ ...userData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Teléfono / WhatsApp</Label>
                                    <Input
                                        placeholder="+54 11 ..."
                                        value={userData.phone}
                                        onChange={e => setUserData({ ...userData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100">
                            <h2 className="text-lg font-bold text-secondary mb-4">2. Método de Pago</h2>

                            {/* Mock Payment Options */}
                            <div className="space-y-3">
                                <div className="p-4 border rounded-lg border-primary bg-primary/5 flex items-center justify-between cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="h-5 w-5 text-primary" />
                                        <span className="font-medium text-secondary">Tarjeta de Crédito / Débito</span>
                                    </div>
                                    <div className="h-4 w-4 rounded-full border border-primary bg-primary" />
                                </div>
                                <div className="p-4 border rounded-lg border-neutral-200 hover:border-primary/50 flex items-center justify-between cursor-pointer opacity-50">
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-blue-500">Mercado Pago</span>
                                    </div>
                                    <div className="h-4 w-4 rounded-full border border-neutral-300" />
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-neutral-50 rounded-lg space-y-3">
                                <div className="space-y-2">
                                    <Label>Número de tarjeta</Label>
                                    <Input placeholder="0000 0000 0000 0000" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Vencimiento</Label>
                                        <Input placeholder="MM/AA" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>CVC</Label>
                                        <Input placeholder="123" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
                                <ShieldCheck className="h-4 w-4 text-green-600" />
                                Pagos procesados de forma segura con encriptación SSL de 256-bits.
                            </div>
                        </div>

                        <Button
                            className="w-full text-lg h-12"
                            onClick={handlePayment}
                            disabled={processing || !userData.name || !userData.email}
                        >
                            {processing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                            {processing ? "Procesando pago..." : `Pagar $${service.price}`}
                        </Button>

                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 sticky top-24 p-6">
                            <h3 className="font-bold text-secondary text-lg mb-4">Resumen</h3>

                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-neutral-100">
                                <img
                                    src={professional.image || "https://i.pravatar.cc/150"}
                                    className="w-12 h-12 rounded-full object-cover"
                                    alt={professional.name}
                                />
                                <div>
                                    <p className="font-semibold text-secondary">{professional.name}</p>
                                    <p className="text-xs text-text-secondary">{professional.title}</p>
                                </div>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Servicio</span>
                                    <span className="font-medium text-secondary">{service.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Duración</span>
                                    <span className="font-medium text-secondary">{service.duration} min</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Fecha</span>
                                    <span className="font-medium text-secondary capitalize">{formattedDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-secondary">Hora</span>
                                    <span className="font-medium text-secondary">{timeStr} hs</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-neutral-100 flex justify-between items-center text-lg">
                                <span className="font-bold text-secondary">Total</span>
                                <span className="font-bold text-primary">${service.price}</span>
                            </div>

                        </div>
                        <p className="text-xs text-center text-text-muted mt-4">
                            Al confirmar, aceptás nuestros términos y condiciones de uso y políticas de cancelación.
                        </p>
                    </div>

                </div>
            </main>
        </div>
    );
}
