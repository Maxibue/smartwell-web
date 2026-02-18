"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Loader2, User as UserIcon, Phone, Mail, Calendar, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface UserProfile {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: string;
    birthDate: string;
    dni: string;
}

const EMPTY_PROFILE: UserProfile = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    gender: "",
    birthDate: "",
    dni: "",
};

export default function MisDatosPage() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (!u) { setLoading(false); return; }
            setUser(u);
            await loadProfile(u);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const loadProfile = async (u: User) => {
        try {
            const snap = await getDoc(doc(db, "users", u.uid));
            if (snap.exists()) {
                const d = snap.data();
                // Separar displayName en firstName/lastName si no están guardados por separado
                const [fn = "", ln = ""] = (u.displayName || "").split(" ");
                setProfile({
                    firstName: d.firstName || fn,
                    lastName: d.lastName || ln,
                    email: d.email || u.email || "",
                    phone: d.phone || d.phoneNumber || "",
                    gender: d.gender || "",
                    birthDate: d.birthDate || "",
                    dni: d.dni || "",
                });
            } else {
                // No existe doc en users, usar datos de auth
                const [fn = "", ln = ""] = (u.displayName || "").split(" ");
                setProfile({
                    ...EMPTY_PROFILE,
                    firstName: fn,
                    lastName: ln,
                    email: u.email || "",
                });
            }
        } catch (e) {
            console.error("Error loading profile:", e);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setError(null);
        try {
            // Guardar en Firestore
            await setDoc(doc(db, "users", user.uid), {
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                phone: profile.phone,
                gender: profile.gender,
                birthDate: profile.birthDate,
                dni: profile.dni,
                displayName: `${profile.firstName} ${profile.lastName}`.trim(),
                updatedAt: new Date(),
            }, { merge: true });

            // Actualizar displayName en Firebase Auth
            const fullName = `${profile.firstName} ${profile.lastName}`.trim();
            if (fullName && fullName !== user.displayName) {
                await updateProfile(user, { displayName: fullName });
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            console.error("Error saving profile:", e);
            setError("Error al guardar los datos. Intentá nuevamente.");
        } finally {
            setSaving(false);
        }
    };

    const set = (field: keyof UserProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setProfile(prev => ({ ...prev, [field]: e.target.value }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-secondary">Mis Datos</h2>
                <p className="text-text-secondary text-sm mt-1">
                    Completá tu información personal para que los profesionales puedan atenderte mejor.
                </p>
            </div>

            {/* Avatar + nombre */}
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-6 flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl font-bold text-primary">
                        {(profile.firstName?.[0] || profile.email?.[0] || "U").toUpperCase()}
                    </span>
                </div>
                <div>
                    <p className="text-lg font-bold text-secondary">
                        {profile.firstName || profile.lastName
                            ? `${profile.firstName} ${profile.lastName}`.trim()
                            : "Sin nombre"}
                    </p>
                    <p className="text-sm text-text-muted">{profile.email}</p>
                </div>
            </div>

            {/* Datos personales */}
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-6 space-y-5">
                <h3 className="font-bold text-secondary flex items-center gap-2 text-base">
                    <UserIcon className="h-4 w-4 text-primary" />
                    Datos Personales
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                            Nombre
                        </label>
                        <Input
                            value={profile.firstName}
                            onChange={set("firstName")}
                            placeholder="Tu nombre"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                            Apellido
                        </label>
                        <Input
                            value={profile.lastName}
                            onChange={set("lastName")}
                            placeholder="Tu apellido"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                            Sexo
                        </label>
                        <select
                            value={profile.gender}
                            onChange={set("gender")}
                            className="w-full h-10 px-3 rounded-lg border border-neutral-200 bg-white text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        >
                            <option value="">Seleccioná</option>
                            <option value="masculino">Masculino</option>
                            <option value="femenino">Femenino</option>
                            <option value="no_binario">No binario</option>
                            <option value="prefiero_no_decir">Prefiero no decir</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                            DNI
                        </label>
                        <Input
                            value={profile.dni}
                            onChange={set("dni")}
                            placeholder="Ej: 12.345.678"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            Fecha de Nacimiento
                        </span>
                    </label>
                    <Input
                        type="date"
                        value={profile.birthDate}
                        onChange={set("birthDate")}
                        max={new Date().toISOString().split("T")[0]}
                    />
                </div>
            </div>

            {/* Datos de contacto */}
            <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-6 space-y-5">
                <h3 className="font-bold text-secondary flex items-center gap-2 text-base">
                    <Phone className="h-4 w-4 text-primary" />
                    Datos de Contacto
                </h3>

                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                        <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            Email
                        </span>
                    </label>
                    <Input
                        type="email"
                        value={profile.email}
                        onChange={set("email")}
                        placeholder="tu@email.com"
                        disabled
                        className="bg-neutral-50 text-text-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-text-muted mt-1">El email no se puede modificar desde aquí.</p>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
                        <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            Teléfono / WhatsApp
                        </span>
                    </label>
                    <Input
                        type="tel"
                        value={profile.phone}
                        onChange={set("phone")}
                        placeholder="Ej: +54 11 1234-5678"
                    />
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Botón guardar */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="lg"
                    className="min-w-[160px]"
                >
                    {saving ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</>
                    ) : saved ? (
                        <><CheckCircle className="h-4 w-4 mr-2" />¡Guardado!</>
                    ) : (
                        <><Save className="h-4 w-4 mr-2" />Guardar Datos</>
                    )}
                </Button>
            </div>
        </div>
    );
}
