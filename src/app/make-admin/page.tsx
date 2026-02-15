"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { Shield, Loader2, CheckCircle } from "lucide-react";

export default function MakeAdminPage() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [currentUid, setCurrentUid] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCurrentUser(user.email);
                setCurrentUid(user.uid);
            }
        });

        return () => unsubscribe();
    }, []);

    const makeCurrentUserAdmin = async () => {
        if (!auth.currentUser) {
            setMessage("❌ No hay usuario autenticado");
            return;
        }

        setLoading(true);
        try {
            const uid = auth.currentUser.uid;
            const userRef = doc(db, "users", uid);

            // Verificar si el documento existe
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                setMessage("❌ Documento de usuario no encontrado");
                setLoading(false);
                return;
            }

            // Actualizar a admin
            await updateDoc(userRef, {
                role: "admin"
            });

            setMessage(`✅ Usuario ${auth.currentUser.email} actualizado a ADMIN correctamente!`);

            // Esperar 2 segundos y redirigir
            setTimeout(() => {
                window.location.href = "/panel-admin";
            }, 2000);
        } catch (error: any) {
            console.error("Error:", error);
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary-dark/10 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                        <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-secondary mb-2">
                        Crear Usuario Admin
                    </h1>
                    <p className="text-text-secondary text-sm">
                        Convertir el usuario actual en administrador de la plataforma
                    </p>
                </div>

                {currentUser ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-blue-900 mb-1">
                                    Usuario Actual
                                </p>
                                <p className="text-sm text-blue-800 font-mono">
                                    {currentUser}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    UID: {currentUid?.substring(0, 12)}...
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <p className="text-sm text-amber-800">
                            ⚠️ No hay usuario autenticado. Por favor, inicia sesión primero.
                        </p>
                    </div>
                )}

                <Button
                    onClick={makeCurrentUserAdmin}
                    disabled={loading || !currentUser}
                    className="w-full mb-4"
                    size="lg"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Actualizando...
                        </>
                    ) : (
                        <>
                            <Shield className="h-5 w-5 mr-2" />
                            Convertir en Administrador
                        </>
                    )}
                </Button>

                {message && (
                    <div className={`p-4 rounded-lg ${message.includes("✅")
                            ? "bg-green-50 border border-green-200 text-green-800"
                            : "bg-red-50 border border-red-200 text-red-800"
                        }`}>
                        <p className="text-sm font-medium">{message}</p>
                        {message.includes("✅") && (
                            <p className="text-xs mt-2">
                                Redirigiendo al panel de administración...
                            </p>
                        )}
                    </div>
                )}

                <div className="mt-6 pt-6 border-t border-neutral-200">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-900 font-semibold mb-2">
                            ⚠️ IMPORTANTE - Seguridad
                        </p>
                        <ul className="text-xs text-amber-800 space-y-1">
                            <li>• Esta página debe eliminarse después de crear el admin</li>
                            <li>• Solo usar para el usuario administrador principal</li>
                            <li>• Verificar que el email sea correcto antes de continuar</li>
                        </ul>
                    </div>
                </div>

                {!currentUser && (
                    <div className="mt-4 text-center">
                        <a
                            href="/login"
                            className="text-sm text-primary hover:text-primary-dark font-medium"
                        >
                            Ir a Iniciar Sesión →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
