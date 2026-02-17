
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Navbar } from "@/components/layout/Navbar";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Loader2, AlertCircle, CheckSquare } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // We don't strictly need role state here for logic, but maybe for redirect hint?
    // Actually, asking role on login is weird UX if we can detect it. 
    // I will keep the UI but ignore it for logic, or use it to guide where to check 

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // ✅ MEJORADO: Redirección inteligente basada en rol
            // Primero verificar si es profesional
            const proDoc = await getDoc(doc(db, "professionals", user.uid));

            if (proDoc.exists()) {
                // Es profesional → ir a panel profesional
                router.push("/panel-profesional");
                return;
            }

            // Verificar si es admin
            const userDoc = await getDoc(doc(db, "users", user.uid));
            const userData = userDoc.data();

            if (userData?.role === "admin") {
                // Es admin → ir a panel admin
                router.push("/panel-admin");
                return;
            }

            // Es usuario regular → ir a panel usuario
            router.push("/panel-usuario");

        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/invalid-credential') {
                setError("Email o contraseña incorrectos.");
            } else {
                setError("Error al iniciar sesión. Intente nuevamente.");
            }
        } finally {
            setLoading(false);
        }
    };

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
                                Tu bienestar comienza con un paso.
                            </h2>
                            <p className="text-primary-light/90 text-lg">
                                Estamos aquí para acompañarte en cada etapa, con profesionales validados y calidez humana.
                            </p>
                            <div className="flex items-center gap-3 text-sm pt-4">
                                <CheckSquare className="text-primary h-5 w-5" />
                                <span>100% Confidencial y seguro</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Form */}
                    <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                        <div className="max-w-md mx-auto w-full space-y-8">

                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-bold text-secondary">Te damos la bienvenida</h1>
                                <p className="text-text-secondary text-sm">Ingresá a tu cuenta para continuar.</p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <form className="space-y-4" onSubmit={handleLogin}>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" placeholder="nombre@ejemplo.com" type="email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password">Contraseña</Label>
                                        <Link href="/recuperar" className="text-xs text-primary hover:underline">
                                            ¿Olvidaste tu contraseña?
                                        </Link>
                                    </div>
                                    <Input id="password" type="password" value={formData.password} onChange={handleChange} required />
                                </div>

                                <Button className="w-full text-base" size="lg" disabled={loading}>
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                                </Button>
                            </form>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-neutral-200" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-text-muted">O continuar con</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" className="w-full" type="button">
                                    Google
                                </Button>
                                <Button variant="outline" className="w-full" type="button">
                                    Apple
                                </Button>
                            </div>

                            <div className="text-center text-sm">
                                <span className="text-text-secondary">¿No tenés cuenta? </span>
                                <Link href="/registro" className="text-primary font-medium hover:underline">
                                    Regístrate gratis
                                </Link>
                            </div>

                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
