"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    Calendar, Users, DollarSign, Clock, Loader2, Video,
    Edit2, Check, X, TrendingUp, CheckCircle, AlertCircle, ChevronDown, XCircle
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import {
    collection, query, where, getDocs,
    doc, updateDoc, getDoc
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";
import CancelAppointmentModal from "@/components/CancelAppointmentModal";


// Estructura unificada para bookings y appointments
interface Session {
    id: string;
    source: "booking" | "appointment";
    patientName: string;
    patientEmail: string;
    patientId?: string;
    service: string;
    price: number;
    date: string;
    time: string;
    duration: number;
    status: string;
    notes?: string;
    meetingUrl?: string;
    receiptUrl?: string;
    paymentRejections?: number;
    depositPercent?: number;
}

interface ProfessionalProfile {
    name: string;
    price: number;
    meetingLink?: string;
}

function formatARS(n: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency", currency: "ARS", maximumFractionDigits: 0
    }).format(n);
}

// ─── Zona horaria Buenos Aires (igual que BookingCalendar) ───────────────────
const TZ = "America/Argentina/Buenos_Aires";

function nowInBA(): Date {
    const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const get = (t: string) => parts.find(p => p.type === t)?.value ?? "0";
    return new Date(
        Number(get("year")), Number(get("month")) - 1, Number(get("day")),
        Number(get("hour")), Number(get("minute"))
    );
}

function todayStrBA(): string {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date());
}

function parseDate(dateStr: string): Date {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
}

function isDateToday(dateStr: string): boolean {
    return dateStr === todayStrBA();
}

/** Retorna true si la sesión es futura (fecha+hora > ahora en BA) */
function isDateFuture(dateStr: string, time: string): boolean {
    if (!dateStr) return false;
    const now = nowInBA();
    const todayStr = todayStrBA();
    if (dateStr > todayStr) return true;
    if (dateStr < todayStr) return false;
    // mismo día: comparar hora
    const [h, min] = (time || "00:00").split(":").map(Number);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return (h * 60 + min) > nowMin;
}

const MONTH_NAMES_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAY_NAMES_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function formatDateShort(dateStr: string): string {
    // Parsear como fecha local (YYYY-MM-DD) para evitar desfase de zona horaria
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return `${DAY_NAMES_SHORT[date.getDay()]} ${d} ${MONTH_NAMES_SHORT[m - 1]}`;
}

function formatDateMedium(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    return `${d} ${MONTH_NAMES_SHORT[m - 1]}`;
}


export default function ProfessionalDashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);

    const [meetingLink, setMeetingLink] = useState("");
    const [isEditingLink, setIsEditingLink] = useState(false);
    const [savingLink, setSavingLink] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [openStatusId, setOpenStatusId] = useState<string | null>(null);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({});
    const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
    const [cancelModal, setCancelModal] = useState<{ show: boolean; session: Session | null }>({ show: false, session: null });

    // ── Carga de datos ──────────────────────────────────────────────────────
    const fetchData = async (uid: string) => {
        try {
            // 1. Perfil del profesional
            const profileSnap = await getDoc(doc(db, "professionals", uid));
            let prof: ProfessionalProfile = { name: "", price: 0 };
            if (profileSnap.exists()) {
                const d = profileSnap.data();
                prof = {
                    name: d.name || d.firstName
                        ? d.name || `${d.firstName} ${d.lastName}`
                        : "",
                    price: d.price || 0,
                    meetingLink: d.meetingLink || "",
                };
                setMeetingLink(d.meetingLink || "");
            }
            setProfile(prof);

            const all: Session[] = [];

            // 2. Bookings (reservas hechas por usuarios)
            try {
                const bSnap = await getDocs(
                    query(collection(db, "bookings"), where("professionalId", "==", uid))
                );
                bSnap.forEach((d) => {
                    const data = d.data();
                    all.push({
                        id: d.id,
                        source: "booking",
                        patientName: data.user?.name || data.patientName || "Paciente",
                        patientEmail: data.user?.email || data.patientEmail || "",
                        patientId: data.userId || "",
                        service: data.serviceName || data.service || "Consulta",
                        price: data.servicePrice || data.price || 0,
                        date: data.date || "",
                        time: data.time || "",
                        duration: data.duration || 50,
                        status: data.status || "pending",
                        notes: data.notes || "",
                        meetingUrl: data.meetingUrl || "",
                    });
                });
            } catch (e) { console.warn("bookings:", e); }

            // 3. Appointments (agendados por el profesional)
            try {
                const aSnap = await getDocs(
                    query(collection(db, "appointments"), where("professionalId", "==", uid))
                );
                aSnap.forEach((d) => {
                    const data = d.data();
                    all.push({
                        id: d.id,
                        source: "appointment",
                        patientName: data.patientName || "Paciente",
                        patientEmail: data.patientEmail || "",
                        patientId: data.userId || "",
                        service: data.service || "Consulta",
                        price: data.price || prof.price || 0,
                        date: data.date || "",
                        time: data.time || "",
                        duration: data.duration || 60,
                        status: data.status || "confirmed",
                        notes: data.notes || "",
                        meetingUrl: data.meetingUrl || "",
                        receiptUrl: data.receiptUrl || "",
                        paymentRejections: data.paymentRejections || 0,
                        depositPercent: data.depositPercent || 0,
                    });
                });
            } catch (e) { console.warn("appointments:", e); }

            // Ordenar por fecha/hora
            all.sort((a, b) => {
                const da = new Date(`${a.date}T${a.time || "00:00"}`);
                const db2 = new Date(`${b.date}T${b.time || "00:00"}`);
                return da.getTime() - db2.getTime();
            });

            setSessions(all);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (u) fetchData(u.uid);
            else setLoading(false);
        });
        return () => unsub();
    }, []);

    // ── Acciones ────────────────────────────────────────────────────────────
    const handleSaveLink = async () => {
        if (!user) return;
        setSavingLink(true);
        try {
            await updateDoc(doc(db, "professionals", user.uid), { meetingLink });
            setIsEditingLink(false);
        } catch (e) {
            console.error(e);
        } finally {
            setSavingLink(false);
        }
    };

    const handleStatusChange = async (session: Session, newStatus: string) => {
        if (!user) return;
        setProcessingId(session.id);
        try {
            const col = session.source === "booking" ? "bookings" : "appointments";
            await updateDoc(doc(db, col, session.id), { status: newStatus });

            // Enviar email al paciente cuando el profesional confirma o cancela
            if ((newStatus === "confirmed" || newStatus === "cancelled") && session.patientEmail) {
                try {
                    const token = await user.getIdToken();
                    const profDoc = await getDoc(doc(db, "professionals", user.uid));
                    const profData = profDoc.data();
                    const professionalName = profData
                        ? `${profData.title || ''} ${profData.firstName || ''} ${profData.lastName || ''}`.trim()
                        : profile?.name || user.displayName || "Profesional";

                    const emailType = newStatus === "confirmed" ? "appointment_confirmed" : "appointment_cancelled";

                    await fetch('/api/send-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            type: emailType,
                            data: {
                                professionalId: user.uid,
                                patientName: session.patientName,
                                patientEmail: session.patientEmail,
                                professionalName,
                                professionalEmail: profData?.email || user.email || '',
                                date: session.date,
                                time: session.time,
                                duration: session.duration,
                                price: session.price,
                                meetingLink: session.meetingUrl || '',
                            }
                        })
                    });
                    console.log(`Email ${emailType} sent to patient:`, session.patientEmail);
                } catch (emailErr) {
                    // No bloquear la acción si falla el email
                    console.error('Error sending status email:', emailErr);
                }
            }

            await fetchData(user.uid);
        } catch (e) {
            console.error(e);
        } finally {
            setProcessingId(null);
        }
    };

    const getSessionLink = (id: string) =>
        meetingLink?.trim() ? meetingLink : `https://meet.jit.si/SmartWell-${id}`;

    // ── KPIs ────────────────────────────────────────────────────────────────
    const todaySessions = sessions.filter(
        (s) => !['cancelled'].includes(s.status) && s.date && isDateToday(s.date)
    );
    const upcomingSessions = sessions.filter(
        (s) => !['cancelled'].includes(s.status) && s.date && isDateFuture(s.date, s.time)
    );
    const confirmedSessions = sessions.filter((s) => s.status === "confirmed");
    const pendingSessions = sessions.filter((s) => s.status === "pending");
    const paymentPendingSessions = sessions.filter((s) => s.status === "payment_submitted");
    const now = nowInBA();
    const monthRevenue = sessions
        .filter((s) => {
            if (s.status === "cancelled") return false;
            if (!s.date) return false;
            const d = parseDate(s.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, s) => sum + (s.price || 0), 0);

    const nextSession = upcomingSessions[0];
    const nextSessionLabel = nextSession
        ? `${formatDateMedium(nextSession.date)} ${nextSession.time}`
        : "-";

    // Pacientes únicos
    const uniquePatients = new Set(sessions.map((s) => s.patientEmail || s.patientName)).size;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const professionalName = profile?.name || user?.displayName || "Profesional";

    return (
        <>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary">
                            Hola, {professionalName} 👋
                        </h1>
                        <p className="text-text-secondary">Aquí tenés un resumen de tu actividad.</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Link href={`/profesionales/${user?.uid}`} target="_blank">
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
                            <p className="text-blue-700 text-xs">
                                Configurá tu enlace personal (Google Meet, Zoom) o usaremos uno automático.
                            </p>
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
                                <Button size="sm" variant="ghost" onClick={() => setIsEditingLink(false)} className="h-9 w-9 p-0 text-red-500">
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

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        {
                            label: "Sesiones hoy",
                            value: todaySessions.length.toString(),
                            icon: Calendar,
                            color: "bg-blue-50 text-blue-600",
                            sub: `${upcomingSessions.length} próximas`,
                        },
                        {
                            label: "Pacientes únicos",
                            value: uniquePatients.toString(),
                            icon: Users,
                            color: "bg-purple-50 text-purple-600",
                            sub: `${sessions.length} turnos totales`,
                        },
                        {
                            label: "Ingresos este mes",
                            value: formatARS(monthRevenue),
                            icon: DollarSign,
                            color: "bg-green-50 text-green-600",
                            sub: `${confirmedSessions.length} confirmados`,
                        },
                        {
                            label: "Próx. sesión",
                            value: nextSessionLabel,
                            icon: Clock,
                            color: "bg-orange-50 text-orange-600",
                            sub: nextSession ? nextSession.patientName : "Sin turnos próximos",
                        },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-neutral-100">
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs font-medium text-text-secondary">{stat.label}</p>
                                <div className={`p-2 rounded-lg ${stat.color}`}>
                                    <stat.icon className="h-4 w-4" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-secondary">{stat.value}</p>
                            <p className="text-xs text-text-muted mt-1">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                {/* ── Comprobantes Pendientes de Revisión ──────────────────────── */}
                {paymentPendingSessions.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <span className="text-base">💳</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-amber-900">
                                    Comprobantes Pendientes
                                    <span className="ml-2 text-xs font-semibold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                                        {paymentPendingSessions.length}
                                    </span>
                                </h3>
                                <p className="text-xs text-amber-700">Revisá y verificá los pagos de seña antes de confirmar los turnos.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {paymentPendingSessions.map((s) => {
                                const depositAmount = Math.round(s.price * (s.depositPercent || 30) / 100);
                                const isProcessing = reviewingId === s.id;
                                const showReject = showRejectInput === s.id;

                                return (
                                    <div key={s.id} className="bg-white rounded-xl border border-amber-200 p-4 space-y-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-secondary">{s.patientName}</p>
                                                <p className="text-xs text-text-secondary">
                                                    {s.date} · {s.time} hs · Seña: ${depositAmount.toLocaleString('es-AR')}
                                                </p>
                                                {(s.paymentRejections ?? 0) >= 1 && (
                                                    <span className="text-xs font-semibold text-red-600">⚠️ Segundo intento</span>
                                                )}
                                            </div>
                                            {s.receiptUrl && (
                                                <a
                                                    href={s.receiptUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-shrink-0 text-amber-700 hover:text-amber-900 text-xs font-semibold border border-amber-300 rounded-lg px-3 py-1.5 hover:bg-amber-50 transition-colors"
                                                >
                                                    🔍 Ver comprobante
                                                </a>
                                            )}
                                        </div>

                                        {showReject && (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    placeholder="Motivo del rechazo (opcional)"
                                                    value={rejectionReason[s.id] || ''}
                                                    onChange={(e) => setRejectionReason(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                    className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                                                />
                                            </div>
                                        )}

                                        <div className="flex gap-2">
                                            <button
                                                disabled={isProcessing}
                                                onClick={async () => {
                                                    setReviewingId(s.id);
                                                    try {
                                                        const token = await user!.getIdToken();
                                                        await fetch('/api/review-payment', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                            body: JSON.stringify({ appointmentId: s.id, action: 'approve' }),
                                                        });
                                                        await fetchData(user!.uid);
                                                    } catch (e) { console.error(e); }
                                                    finally { setReviewingId(null); }
                                                }}
                                                className="flex-1 bg-emerald-500 text-white text-sm font-semibold rounded-lg px-3 py-2 hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                                            >
                                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                Aprobar
                                            </button>

                                            {showReject ? (
                                                <button
                                                    disabled={isProcessing}
                                                    onClick={async () => {
                                                        setReviewingId(s.id);
                                                        try {
                                                            const token = await user!.getIdToken();
                                                            await fetch('/api/review-payment', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                                body: JSON.stringify({ appointmentId: s.id, action: 'reject', rejectionReason: rejectionReason[s.id] || '' }),
                                                            });
                                                            setShowRejectInput(null);
                                                            await fetchData(user!.uid);
                                                        } catch (e) { console.error(e); }
                                                        finally { setReviewingId(null); }
                                                    }}
                                                    className="flex-1 bg-red-500 text-white text-sm font-semibold rounded-lg px-3 py-2 hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                    Confirmar Rechazo
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setShowRejectInput(s.id)}
                                                    className="flex-1 bg-white text-red-600 border border-red-200 text-sm font-semibold rounded-lg px-3 py-2 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <X className="h-4 w-4" />
                                                    Rechazar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Main Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Próximas sesiones */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                            <div className="p-5 border-b border-neutral-100 flex justify-between items-center">
                                <h3 className="font-bold text-secondary flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    Próximas Sesiones
                                    <span className="text-xs font-normal text-text-muted ml-1">
                                        ({upcomingSessions.length} total)
                                    </span>
                                </h3>
                                <Link href="/panel-profesional/calendario">
                                    <Button variant="link" size="sm" className="text-primary">Ver calendario</Button>
                                </Link>
                            </div>

                            {/* Tabla Desktop */}
                            <div className="hidden md:block overflow-x-auto">
                                {upcomingSessions.length === 0 ? (
                                    <div className="p-8 text-center text-text-muted">
                                        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                                        <p>No tenés sesiones próximas.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-neutral-50 text-xs text-text-muted uppercase tracking-wide">
                                                <th className="text-left px-4 py-3 font-semibold">Paciente</th>
                                                <th className="text-left px-4 py-3 font-semibold hidden lg:table-cell">Servicio</th>
                                                <th className="text-left px-4 py-3 font-semibold">Fecha</th>
                                                <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">Precio</th>
                                                <th className="text-center px-4 py-3 font-semibold">Estado</th>
                                                <th className="text-center px-4 py-3 font-semibold">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-100">
                                            {upcomingSessions.slice(0, 10).map((s) => {
                                                const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
                                                    confirmed: { label: 'Confirmado', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
                                                    pending: { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
                                                    cancelled: { label: 'Cancelado', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
                                                    completed: { label: 'Completado', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
                                                };
                                                const cfg = statusConfig[s.status] || statusConfig['pending'];
                                                const isOpen = openStatusId === s.id;

                                                return (
                                                    <tr key={s.id} className="hover:bg-neutral-50 transition-colors">
                                                        {/* Paciente */}
                                                        <td className="px-4 py-3">
                                                            <Link href={s.patientId ? `/panel-profesional/pacientes/${s.patientId}` : '#'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase flex-shrink-0">
                                                                    {(s.patientName || '?').substring(0, 2)}
                                                                </div>
                                                                <span className="font-semibold text-secondary truncate max-w-[120px]">{s.patientName}</span>
                                                            </Link>
                                                        </td>
                                                        {/* Servicio */}
                                                        <td className="px-4 py-3 text-text-muted hidden lg:table-cell">
                                                            <span className="truncate max-w-[140px] block">{s.service}</span>
                                                        </td>
                                                        {/* Fecha */}
                                                        <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                                                            {s.date ? formatDateShort(s.date) : '-'}
                                                            {s.time && <span className="text-xs text-text-muted ml-1">{s.time}hs</span>}
                                                        </td>
                                                        {/* Precio */}
                                                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                                                            {s.price > 0 && (
                                                                <span className="font-semibold text-green-700">{formatARS(s.price)}</span>
                                                            )}
                                                        </td>
                                                        {/* Estado - dropdown */}
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="relative inline-block">
                                                                <button
                                                                    onClick={() => setOpenStatusId(isOpen ? null : s.id)}
                                                                    disabled={processingId === s.id}
                                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${cfg.bg
                                                                        } ${cfg.text} border-transparent hover:border-current`}
                                                                >
                                                                    {processingId === s.id
                                                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                                                        : <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                                                                    {cfg.label}
                                                                    <ChevronDown className="h-3 w-3 opacity-60" />
                                                                </button>

                                                                {isOpen && (
                                                                    <div
                                                                        className="absolute z-20 top-full mt-1 right-0 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 min-w-[150px]"
                                                                        onMouseLeave={() => setOpenStatusId(null)}
                                                                    >
                                                                        {Object.entries(statusConfig).map(([key, val]) => (
                                                                            <button
                                                                                key={key}
                                                                                onClick={async () => {
                                                                                    setOpenStatusId(null);
                                                                                    if (key !== s.status) await handleStatusChange(s, key);
                                                                                }}
                                                                                className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-neutral-50 transition-colors ${key === s.status ? 'font-bold' : ''
                                                                                    }`}
                                                                            >
                                                                                <span className={`w-2 h-2 rounded-full ${val.dot}`} />
                                                                                {val.label}
                                                                                {key === s.status && <Check className="h-3 w-3 ml-auto text-primary" />}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        {/* Video + Cancel */}
                                                        <td className="px-4 py-3 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <Link href={getSessionLink(s.id)} target="_blank" rel="noopener noreferrer">
                                                                    <Button size="sm" variant="outline" className="h-7 text-xs border-primary text-primary hover:bg-primary/10">
                                                                        <Video className="h-3 w-3 mr-1" /> Video
                                                                    </Button>
                                                                </Link>
                                                                {s.status !== 'cancelled' && s.status !== 'completed' && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-7 text-xs border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                                                                        onClick={() => setCancelModal({ show: true, session: s })}
                                                                    >
                                                                        <XCircle className="h-3 w-3 mr-1" /> Cancelar
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Mobile List View (Cards) */}
                            <div className="md:hidden space-y-3 p-4 bg-neutral-50/50">
                                {upcomingSessions.length === 0 ? (
                                    <div className="p-6 text-center text-text-muted bg-white rounded-xl border border-neutral-100">
                                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No tenés sesiones próximas.</p>
                                    </div>
                                ) : (
                                    upcomingSessions.slice(0, 10).map((s) => {
                                        const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
                                            confirmed: { label: 'Confirmado', bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
                                            pending: { label: 'Pendiente', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
                                            cancelled: { label: 'Cancelado', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400' },
                                            completed: { label: 'Completado', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
                                        };
                                        const cfg = statusConfig[s.status] || statusConfig['pending'];

                                        return (
                                            <div key={s.id} className="bg-white rounded-xl border border-neutral-100 p-4 shadow-sm relative">
                                                <Link href={s.patientId ? `/panel-profesional/pacientes/${s.patientId}` : '#'} className="absolute inset-0 z-0" aria-label="Ver detalle del paciente">
                                                </Link>

                                                <div className="flex items-start justify-between relative z-10 pointer-events-none">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
                                                            {(s.patientName || '?').substring(0, 2)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-secondary text-sm">{s.patientName}</h4>
                                                            <p className="text-xs text-text-muted">{s.service}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
                                                        {cfg.label}
                                                    </span>
                                                </div>

                                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs relative z-10 pointer-events-none">
                                                    <div className="flex items-center gap-1.5 text-text-secondary">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        {s.date ? formatDateMedium(s.date) : '-'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-text-secondary">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {s.time}hs
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-text-secondary">
                                                        <DollarSign className="h-3.5 w-3.5" />
                                                        {formatARS(s.price)}
                                                    </div>
                                                </div>

                                                <div className="mt-3 pt-3 border-t border-neutral-50 flex gap-2 relative z-20">
                                                    <Link href={getSessionLink(s.id)} target="_blank" rel="noopener noreferrer" className="flex-1">
                                                        <Button size="sm" variant="outline" className="w-full h-8 text-xs border-primary text-primary hover:bg-primary/10">
                                                            <Video className="h-3 w-3 mr-1.5" /> Video
                                                        </Button>
                                                    </Link>
                                                    {s.status !== 'cancelled' && s.status !== 'completed' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-8 text-xs border-red-200 text-red-500 hover:bg-red-50"
                                                            onClick={() => setCancelModal({ show: true, session: s })}
                                                        >
                                                            <XCircle className="h-3 w-3 mr-1" /> Cancelar
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Solicitudes pendientes */}
                    <div>
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-5">
                            <h3 className="font-bold text-secondary mb-4 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                Solicitudes Pendientes
                                {pendingSessions.length > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-auto">
                                        {pendingSessions.length}
                                    </span>
                                )}
                            </h3>
                            <div className="space-y-3">
                                {pendingSessions.length === 0 ? (
                                    <p className="text-sm text-text-muted text-center py-4">
                                        No hay solicitudes pendientes.
                                    </p>
                                ) : (
                                    pendingSessions.map((s) => (
                                        <div key={s.id} className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                                            <div className="flex justify-between items-start mb-1">
                                                <div>
                                                    <p className="font-bold text-secondary text-sm">{s.patientName}</p>
                                                    <p className="text-xs text-text-muted">{s.service}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-semibold bg-white px-2 py-0.5 rounded border border-amber-200">
                                                        {s.date ? formatDateMedium(s.date) : "-"}
                                                    </p>
                                                    <p className="text-xs font-bold mt-0.5 text-secondary">{s.time}hs</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    size="sm"
                                                    className="w-full h-7 text-xs"
                                                    onClick={() => handleStatusChange(s, "confirmed")}
                                                    disabled={processingId === s.id}
                                                >
                                                    {processingId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aceptar"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full h-7 text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                                    onClick={() => handleStatusChange(s, "cancelled")}
                                                    disabled={processingId === s.id}
                                                >
                                                    Rechazar
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Resumen rápido */}
                        <div className="bg-white rounded-xl shadow-sm border border-neutral-100 p-5 mt-4">
                            <h3 className="font-bold text-secondary mb-3 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                Resumen de Turnos
                            </h3>
                            <div className="space-y-2">
                                {[
                                    { label: "Confirmados", count: confirmedSessions.length, color: "bg-green-500" },
                                    { label: "Pendientes", count: pendingSessions.length, color: "bg-amber-500" },
                                    { label: "Cancelados", count: sessions.filter(s => s.status === "cancelled").length, color: "bg-red-400" },
                                    { label: "Completados", count: sessions.filter(s => s.status === "completed").length, color: "bg-blue-500" },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                            <span className="text-text-secondary">{item.label}</span>
                                        </div>
                                        <span className="font-bold text-secondary">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cancel Modal */}
            {
                cancelModal.show && cancelModal.session && (
                    <CancelAppointmentModal
                        appointmentId={cancelModal.session.id}
                        appointmentDate={cancelModal.session.date}
                        appointmentTime={cancelModal.session.time}
                        appointmentDuration={cancelModal.session.duration}
                        professionalName={cancelModal.session.patientName}
                        patientId={cancelModal.session.patientId}
                        patientName={cancelModal.session.patientName}
                        patientEmail={cancelModal.session.patientEmail}
                        userType="professional"
                        onClose={() => setCancelModal({ show: false, session: null })}
                        onSuccess={() => {
                            setCancelModal({ show: false, session: null });
                            if (user) fetchData(user.uid);
                        }}
                    />
                )
            }
        </>
    );
}
