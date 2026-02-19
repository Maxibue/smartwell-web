"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Loader2, Upload, CheckCircle, AlertTriangle, Calendar, Clock, User, ArrowLeft, FileImage } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface AppointmentData {
    userId: string;
    professionalId: string;
    professionalName: string;
    date: string;
    time: string;
    duration: number;
    price: number;
    depositPercent: number;
    mpAlias?: string;
    paymentBank?: string;
    paymentCbu?: string;
    paymentHolder?: string;
    status: string;
    paymentStatus: string;
    paymentRejections?: number;
}

function formatDateES(dateStr: string): string {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-AR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export default function SubirComprobantePage() {
    const params = useParams();
    const router = useRouter();
    const appointmentId = params.appointmentId as string;

    const [appointment, setAppointment] = useState<AppointmentData | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (!user) {
                router.push(`/login?redirect=/reservar/pago/${appointmentId}`);
                return;
            }
            setCurrentUserId(user.uid);
        });
        return () => unsub();
    }, [appointmentId, router]);

    useEffect(() => {
        if (!currentUserId) return;
        loadAppointment();
    }, [currentUserId]);

    const loadAppointment = async () => {
        try {
            const snap = await getDoc(doc(db, "appointments", appointmentId));
            if (!snap.exists()) {
                setError("Turno no encontrado.");
                setLoading(false);
                return;
            }
            const data = snap.data() as AppointmentData;

            // Verificar que el turno pertenece al usuario
            if (data.userId !== currentUserId) {
                setError("No tenés permiso para ver este turno.");
                setLoading(false);
                return;
            }

            // Ya confirmado
            if (data.status === "confirmed") {
                setUploaded(true);
            }

            setAppointment(data);
        } catch (e) {
            setError("Error al cargar el turno.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (file: File) => {
        const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!validTypes.includes(file.type)) {
            setError("Formato no válido. Usá JPG, PNG, WEBP o PDF.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError("El archivo es demasiado grande. Máximo 10 MB.");
            return;
        }
        setError(null);
        setSelectedFile(file);

        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, []);

    const handleUpload = async () => {
        if (!selectedFile || !currentUserId || !appointment) return;
        setUploading(true);
        setError(null);

        try {
            // Subir a Firebase Storage
            const fileExt = selectedFile.name.split(".").pop();
            const storageRef = ref(
                storage,
                `payment_receipts/${appointmentId}/comprobante_${Date.now()}.${fileExt}`
            );
            const snapshot = await uploadBytes(storageRef, selectedFile);
            const downloadURL = await getDownloadURL(snapshot.ref);

            // Actualizar appointment en Firestore
            await updateDoc(doc(db, "appointments", appointmentId), {
                paymentStatus: "submitted",
                status: "payment_submitted",
                receiptUrl: downloadURL,
                receiptUploadedAt: new Date(),
            });

            // Notificar al profesional (in-app notification)
            const { notifyProfessionalPaymentReceived } = await import("@/lib/notifications");
            await notifyProfessionalPaymentReceived({
                professionalId: appointment.professionalId,
                patientName: auth.currentUser?.displayName || "El paciente",
                appointmentId,
                date: appointment.date,
                time: appointment.time,
            }).catch(() => { }); // no bloquear si falla

            // Enviar email al profesional
            try {
                const token = await auth.currentUser?.getIdToken();
                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        type: 'payment_uploaded',
                        data: {
                            patientId: currentUserId,
                            patientName: auth.currentUser?.displayName || "Paciente",
                            professionalId: appointment.professionalId,
                            professionalName: appointment.professionalName,
                            date: appointment.date,
                            time: appointment.time,
                            receiptUrl: downloadURL,
                        }
                    })
                });
            } catch (emailErr) {
                console.error('Error sending email notification:', emailErr);
            }

            setUploaded(true);
        } catch (e: any) {
            console.error("Error uploading receipt:", e);
            setError("Error al subir el archivo. Intentá de nuevo.");
        } finally {
            setUploading(false);
        }
    };

    // ── Pantalla de carga ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────────
    if (error && !appointment) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
                    <p className="text-lg font-semibold text-secondary">{error}</p>
                    <Link href="/panel-usuario/turnos">
                        <Button variant="outline">← Volver a Mis Turnos</Button>
                    </Link>
                </div>
            </div>
        );
    }

    // ── Éxito ────────────────────────────────────────────────────────────────────
    if (uploaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                        <CheckCircle className="h-10 w-10 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-secondary mb-2">¡Comprobante enviado!</h1>
                        <p className="text-text-secondary">
                            El profesional revisará tu comprobante y confirmará el turno. Te notificaremos por email.
                        </p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                        ⏱️ El tiempo de verificación suele ser de <strong>pocas horas</strong> en días hábiles.
                    </div>
                    <Link href="/panel-usuario/turnos">
                        <Button className="w-full">Ver Mis Turnos</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const depositAmount = appointment
        ? Math.round((appointment.price * appointment.depositPercent) / 100)
        : 0;

    const isSecondAttempt = (appointment?.paymentRejections ?? 0) >= 1;

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-4 py-8">
            <div className="max-w-xl mx-auto space-y-6">
                {/* Back */}
                <Link
                    href="/panel-usuario/turnos"
                    className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-secondary transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver a Mis Turnos
                </Link>

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
                        <span className="text-2xl">💳</span>
                    </div>
                    <h1 className="text-2xl font-bold text-secondary">Subir Comprobante de Pago</h1>
                    <p className="text-text-secondary text-sm">
                        {isSecondAttempt
                            ? "⚠️ Último intento — Asegurate de que el comprobante sea legible"
                            : "Subí el comprobante de la transferencia para confirmar tu turno"}
                    </p>
                </div>

                {/* Detalles del turno */}
                {appointment && (
                    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5 space-y-3">
                        <h2 className="font-bold text-secondary text-sm uppercase tracking-wide">Resumen del Turno</h2>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-sm">
                                <User className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="text-text-secondary">Profesional:</span>
                                <span className="font-semibold text-secondary ml-auto">{appointment.professionalName}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="text-text-secondary">Fecha:</span>
                                <span className="font-semibold text-secondary ml-auto capitalize">{formatDateES(appointment.date)}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="text-text-secondary">Hora:</span>
                                <span className="font-semibold text-secondary ml-auto">{appointment.time} hs</span>
                            </div>
                        </div>

                        {/* Monto e Instrucciones */}
                        <div className="mt-4 pt-4 border-t border-neutral-100">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                                <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">
                                    Monto a transferir ({appointment.depositPercent}% del total)
                                </p>
                                <p className="text-3xl font-bold text-emerald-700 mb-3">
                                    ${depositAmount.toLocaleString("es-AR")}
                                </p>

                                <div className="text-sm bg-white/50 rounded-lg p-3 space-y-2 text-left inline-block w-full">
                                    {appointment.mpAlias && (
                                        <div className="flex justify-between border-b border-emerald-100 pb-1">
                                            <span className="text-emerald-800">Alias:</span>
                                            <span className="font-bold text-secondary select-all">{appointment.mpAlias}</span>
                                        </div>
                                    )}
                                    {appointment.paymentCbu && (
                                        <div className="flex justify-between border-b border-emerald-100 pb-1">
                                            <span className="text-emerald-800">CBU/CVU:</span>
                                            <span className="font-bold text-secondary select-all font-mono text-xs md:text-sm">{appointment.paymentCbu}</span>
                                        </div>
                                    )}
                                    {appointment.paymentBank && (
                                        <div className="flex justify-between border-b border-emerald-100 pb-1">
                                            <span className="text-emerald-800">Banco/Billetera:</span>
                                            <span className="font-medium text-secondary">{appointment.paymentBank}</span>
                                        </div>
                                    )}
                                    {appointment.paymentHolder && (
                                        <div className="flex justify-between">
                                            <span className="text-emerald-800">Titular:</span>
                                            <span className="font-medium text-secondary">{appointment.paymentHolder}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Uploader */}
                <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 space-y-4">
                    <h2 className="font-bold text-secondary">Comprobante de Transferencia</h2>

                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById("file-input")?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver
                            ? "border-emerald-400 bg-emerald-50"
                            : selectedFile
                                ? "border-emerald-300 bg-emerald-50/50"
                                : "border-neutral-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                            }`}
                    >
                        <input
                            id="file-input"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileSelect(file);
                            }}
                        />

                        {selectedFile ? (
                            <div className="space-y-3">
                                {preview ? (
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="max-h-48 mx-auto rounded-lg object-contain"
                                    />
                                ) : (
                                    <FileImage className="h-12 w-12 text-emerald-500 mx-auto" />
                                )}
                                <p className="text-sm font-semibold text-emerald-700">{selectedFile.name}</p>
                                <p className="text-xs text-text-muted">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Clic para cambiar
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Upload className="h-10 w-10 text-neutral-300 mx-auto" />
                                <div>
                                    <p className="text-sm font-semibold text-secondary">
                                        Arrastrá el archivo o hacé clic para seleccionar
                                    </p>
                                    <p className="text-xs text-text-muted mt-1">JPG, PNG, WEBP o PDF · Máx. 10 MB</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    {isSecondAttempt && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                            ⚠️ <strong>Último intento:</strong> Si este comprobante también es rechazado, el turno se cancelará automáticamente.
                        </div>
                    )}

                    <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="w-full"
                        size="lg"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Subiendo comprobante...
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Enviar Comprobante
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
