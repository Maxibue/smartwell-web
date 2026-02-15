
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Calendar, Users, DollarSign, Clock, Loader2, Video, Edit2, Check, X } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, Timestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { format, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

interface Booking {
    id: string;
    serviceName: string;
    servicePrice: number;
    date: string; // ISO string
    time: string;
    user: {
        name: string;
        email: string;
    };
    patientId?: string;
    status: string;
}


export default function ProfessionalDashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todaySessions: 0,
        monthlyRevenue: 0,
        nextSession: "-"
    });

    const [meetingLink, setMeetingLink] = useState("");
    const [isEditingLink, setIsEditingLink] = useState(false);
    const [savingLink, setSavingLink] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchBookings = async (uid: string) => {
        try {
            // Fetch Profile for Meeting Link
            const profileRef = doc(db, "professionals", uid);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
                setMeetingLink(profileSnap.data().meetingLink || "");
            }

            // Fetch Bookings
            const q = query(
                collection(db, "bookings"),
                where("professionalId", "==", uid)
            );

            const querySnapshot = await getDocs(q);
            const fetchedBookings: Booking[] = [];
            let revenue = 0;
            let todayCount = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data() as Booking;
                fetchedBookings.push({
                    ...data,
                    id: doc.id,
                } as Booking);

                // Calculate Stats only for confirmed bookings
                if (data.status === 'confirmed') {
                    revenue += data.servicePrice;
                    if (isToday(parseISO(data.date))) {
                        todayCount++;
                    }
                }
            });

            // Sort by date/time
            fetchedBookings.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.time}`);
                const dateB = new Date(`${b.date}T${b.time}`);
                return dateA.getTime() - dateB.getTime();
            });

            setBookings(fetchedBookings);

            // Determine next session
            const upcoming = fetchedBookings.filter(b => b.status === 'confirmed' && new Date(`${b.date}T${b.time}`) > new Date());
            const nextTime = upcoming.length > 0 ? `${format(parseISO(upcoming[0].date), 'dd/MM')} ${upcoming[0].time}` : "-";

            setStats({
                todaySessions: todayCount,
                monthlyRevenue: revenue,
                nextSession: nextTime
            });

        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                await fetchBookings(currentUser.uid);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleSaveLink = async () => {
        if (!user) return;
        setSavingLink(true);
        try {
            const profileRef = doc(db, "professionals", user.uid);
            await updateDoc(profileRef, { // This might fail if doc doesn't exist, we might need setDoc nicely but update is fine if profile created on signup
                meetingLink: meetingLink
            });
            setIsEditingLink(false);
        } catch (error) {
            console.error("Error saving meeting link:", error);
            // Fallback for demo: just save to local state effectively or alert
            alert("Nota: En esta demo, si no tenés perfil profesional creado en Firestore, esto puede fallar. Pero el estado local se actualizó.");
            setIsEditingLink(false);
        } finally {
            setSavingLink(false);
        }
    };

    const handleStatusChange = async (bookingId: string, newStatus: string) => {
        if (!user) return;
        setProcessingId(bookingId);
        try {
            const bookingRef = doc(db, "bookings", bookingId);
            await updateDoc(bookingRef, { status: newStatus });

            // Refresh bookings
            await fetchBookings(user.uid);
        } catch (error) {
            console.error("Error updating booking:", error);
        } finally {
            setProcessingId(null);
        }
    };

    const generateTestBooking = async () => {
        if (!user) return;
        try {
            const { addDoc, collection } = await import("firebase/firestore");
            await addDoc(collection(db, "bookings"), {
                professionalId: user.uid,
                professionalName: user.displayName || "Yo Mismo",
                serviceName: "Consulta Demo",
                servicePrice: 25000,
                date: new Date().toISOString().split('T')[0],
                time: "10:00",
                user: {
                    name: "Paciente de Prueba",
                    email: "paciente@test.com"
                },
                status: "pending",
                createdAt: new Date()
            });
            await fetchBookings(user.uid);
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    // Determine the link to use
    const getSessionLink = (bookingId: string) => {
        return meetingLink && meetingLink.trim() !== ""
            ? meetingLink
            : `https://meet.jit.si/SmartWell-${bookingId}`;
    };

    const pendingBookings = bookings.filter(b => b.status === "pending");
    const confirmedBookings = bookings.filter(b => b.status === "confirmed");

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Hola, {user?.displayName || "Colega"}</h1>
                    <p className="text-text-secondary">Aquí tenés un resumen de tu actividad.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={generateTestBooking} className="border-dashed border-neutral-300 text-neutral-500">
                        + Demo Reserva
                    </Button>
                    <Link href={`/profesionales/${user?.uid}`}>
                        <Button variant="outline">Ver mi perfil público</Button>
                    </Link>
                    <Link href="/panel-profesional/agendar">
                        <Button>+ Agendar turno manual</Button>
                    </Link>
                </div>
            </div>

            {/* Meeting Link Config */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <Video className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-blue-900 text-sm">Sala de Videollamada</h3>
                        <p className="text-blue-700 text-xs">Configurá tu enlace personal (Google Meet, Zoom) o usaremos uno automático.</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {isEditingLink ? (
                        <div className="flex items-center gap-2 w-full">
                            <Input
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                placeholder="https://meet.google.com/..."
                                className="h-9 text-sm bg-white"
                            />
                            <Button size="sm" onClick={handleSaveLink} disabled={savingLink} className="h-9 w-9 p-0">
                                {savingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setIsEditingLink(false)} className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-blue-800 bg-white/50 px-3 py-1.5 rounded border border-blue-200 truncate max-w-[200px]">
                                {meetingLink || "Usando Jitsi Automático"}
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setIsEditingLink(true)} className="h-9 border-blue-200 text-blue-700 hover:bg-blue-100">
                                <Edit2 className="h-4 w-4 mr-2" /> Editar
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Sesiones hoy", value: stats.todaySessions.toString(), icon: Calendar, color: "bg-blue-50 text-blue-600" },
                    { label: "Pacientes Activos", value: confirmedBookings.length.toString(), icon: Users, color: "bg-purple-50 text-purple-600" },
                    { label: "Ingresos (Est.)", value: `$${stats.monthlyRevenue}`, icon: DollarSign, color: "bg-green-50 text-green-600" },
                    { label: "Próx. sesión", value: stats.nextSession, icon: Clock, color: "bg-orange-50 text-orange-600" },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-secondary mt-1">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.color}`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Split */}
            <div className="grid lg:grid-cols-3 gap-8">

                {/* Upcoming / Confirmed Sessions (Left - Wider) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                        <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                            <h3 className="font-bold text-secondary">Próximas Sesiones (Confirmadas)</h3>
                            <Button variant="link" size="sm">Ver calendario</Button>
                        </div>
                        <div className="divide-y divide-neutral-100">
                            {confirmedBookings.length === 0 ? (
                                <div className="p-8 text-center text-text-muted">
                                    No tenés sesiones confirmadas próximamente.
                                </div>
                            ) : (
                                confirmedBookings.map((booking) => (
                                    <div key={booking.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold uppercase text-sm md:text-base">
                                                {booking.user.name.substring(0, 2)}
                                            </div>
                                            <div>
                                                <Link href={`/panel-profesional/pacientes/${booking.patientId || 'guest'}`} className="hover:underline">
                                                    <p className="font-semibold text-secondary">{booking.user.name}</p>
                                                </Link>
                                                <p className="text-xs text-text-secondary">
                                                    {booking.serviceName} • {format(parseISO(booking.date), "EEE d MMM", { locale: es })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-secondary mb-1">{booking.time} hs</p>
                                            <Link
                                                href={getSessionLink(booking.id)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Button size="sm" variant="outline" className="h-7 text-xs flex items-center gap-1 border-primary text-primary hover:bg-primary/10">
                                                    <Video className="h-3 w-3" /> Iniciar Video
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Requests (Right) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-6">
                        <h3 className="font-bold text-secondary mb-4 flex items-center gap-2">
                            Solicitudes Pendientes
                            {pendingBookings.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingBookings.length}</span>}
                        </h3>

                        <div className="space-y-4">
                            {pendingBookings.length === 0 ? (
                                <p className="text-sm text-text-muted text-center py-4">No hay solicitudes pendientes.</p>
                            ) : (
                                pendingBookings.map(booking => (
                                    <div key={booking.id} className="bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-bold text-secondary text-sm">{booking.user.name}</div>
                                                <div className="text-xs text-text-secondary">{booking.serviceName}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-semibold bg-white px-2 py-1 rounded border border-neutral-200">
                                                    {format(parseISO(booking.date), "d MMM", { locale: es })}
                                                </div>
                                                <div className="text-xs font-bold mt-1 text-secondary">{booking.time} hs</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-3">
                                            <Button
                                                size="sm"
                                                className="w-full h-8 text-xs bg-secondary hover:bg-secondary-light"
                                                onClick={() => handleStatusChange(booking.id, "confirmed")}
                                                disabled={processingId === booking.id}
                                            >
                                                {processingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aceptar"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full h-8 text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                                onClick={() => handleStatusChange(booking.id, "cancelled")}
                                                disabled={processingId === booking.id}
                                            >
                                                Rechazar
                                            </Button>
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

