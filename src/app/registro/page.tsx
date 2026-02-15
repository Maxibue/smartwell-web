

"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Navbar } from "@/components/layout/Navbar";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Loader2, AlertCircle } from "lucide-react";

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect");

    const [role, setRole] = useState<"user" | "professional">("user");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        terms: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.id]: value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!formData.terms) {
            setError("Debés aceptar los términos y condiciones.");
            return;
        }

        setLoading(true);

        try {
            // 1. Create User in Auth
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // 2. Update Display Name
            const displayName = `${formData.firstName} ${formData.lastName}`;
            await updateProfile(user, { displayName });

            // 3. Create Firestore Document
            if (role === "professional") {
                await setDoc(doc(db, "professionals", user.uid), {
                    uid: user.uid,
                    name: displayName,
                    email: formData.email,

                    role: "professional",
                    createdAt: new Date(),
                    status: "pending",
                    // Initial Profile Data
                    title: "Profesional de la Salud",
                    description: "Biografía pendiente de completar.",
                    videoAllowed: false,
                    location: "Online",
                    image: `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=random`
                });
                router.push(redirectUrl || "/panel-profesional");
            } else {
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    name: displayName,
                    email: formData.email,
                    role: "user",
                    createdAt: new Date(),
                    image: `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=random`
                });
                router.push(redirectUrl || "/panel-usuario/turnos");
            }

        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Este email ya está registrado.");
            } else if (err.code === 'auth/weak-password') {
                setError("La contraseña debe tener al menos 6 caracteres.");
            } else {
                setError("Hubo un error al crear la cuenta. Intente nuevamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full space-y-8">

                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-secondary">Crear cuenta</h1>
                    <p className="text-text-secondary text-sm">Completá tus datos para registrarte.</p>
                </div>

                {/* Role Switcher */}
                <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-lg mb-6">
                    <button
                        onClick={() => setRole("user")}
                        type="button"
                        className={`text-sm font-medium py-2 rounded-md transition-all ${role === "user" ? "bg-white shadow text-primary" : "text-text-secondary hover:text-secondary"
                            }`}
                    >
                        Soy Usuario
                    </button>
                    <button
                        onClick={() => setRole("professional")}
                        type="button"
                        className={`text-sm font-medium py-2 rounded-md transition-all ${role === "professional" ? "bg-white shadow text-primary" : "text-text-secondary hover:text-secondary"
                            }`}
                    >
                        Soy Profesional
                    </button>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleRegister}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Nombre</Label>
                            <Input id="firstName" placeholder="Juan" value={formData.firstName} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Apellido</Label>
                            <Input id="lastName" placeholder="Pérez" value={formData.lastName} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" placeholder="nombre@ejemplo.com" type="email" value={formData.email} onChange={handleChange} required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <Input id="password" type="password" value={formData.password} onChange={handleChange} required minLength={6} />
                    </div>

                    <div className="flex items-start gap-2 pt-2">
                        <div className="flex h-5 items-center">
                            <input
                                id="terms"
                                type="checkbox"
                                className="h-4 w-4 rounded border-neutral-300 text-primary focus:ring-primary"
                                required
                                checked={formData.terms}
                                onChange={handleChange}
                            />
                        </div>
                        <Label htmlFor="terms" className="text-xs font-normal text-text-secondary leading-snug cursor-pointer">
                            Acepto los <Link href="/terminos" className="text-primary hover:underline">Términos y Condiciones</Link> y la <Link href="/privacidad" className="text-primary hover:underline">Política de Privacidad</Link>.
                        </Label>
                    </div>

                    <Button className="w-full text-base mt-4" size="lg" disabled={loading}>
                        {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                        {loading ? "Creando cuenta..." : "Crear cuenta"}
                    </Button>
                </form>

                <div className="text-center text-sm">
                    <span className="text-text-secondary">¿Ya tenés cuenta? </span>
                    <Link href={`/login${redirectUrl ? `?redirect=${redirectUrl}` : ''}`} className="text-primary font-medium hover:underline">
                        Iniciá sesión
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <Navbar />

            <main className="flex-1 flex max-w-6xl mx-auto w-full p-4 items-center justify-center">
                <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

                    {/* Left Side: Visual */}
                    <div className="md:w-1/2 bg-secondary relative hidden md:flex flex-col justify-center p-12 text-white">
                        <div className="absolute inset-0 bg-primary/10 pattern-dots opacity-20"></div>
                        <div className="relative z-10 space-y-6">
                            <h2 className="text-3xl font-bold font-display leading-tight">
                                Empezá tu camino hoy.
                            </h2>
                            <p className="text-primary-light/90 text-lg">
                                Sumate a la comunidad de bienestar más humana y validada de Latinoamérica.
                            </p>
                        </div>
                    </div>

                    {/* Right Side: Form (Wrapped in Suspense) */}
                    <Suspense fallback={<div className="w-full md:w-1/2 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                        <RegisterContent />
                    </Suspense>

                </div>
            </main>
        </div>
    );
}
