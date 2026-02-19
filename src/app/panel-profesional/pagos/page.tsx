"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Wallet, CheckCircle, Loader2, AlertCircle, Info } from "lucide-react";

export default function PagosPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mpAlias, setMpAlias] = useState("");
    const [holderName, setHolderName] = useState("");
    const [cbu, setCbu] = useState("");
    const [bank, setBank] = useState("");
    const [depositPercent, setDepositPercent] = useState(50);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                loadPaymentInfo(user.uid);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const loadPaymentInfo = async (uid: string) => {
        try {
            const docRef = doc(db, "professionals", uid);
            const snap = await getDoc(docRef);
            if (snap.exists()) {
                const data = snap.data();
                setMpAlias(data.mpAlias || "");
                setHolderName(data.paymentHolder || "");
                setCbu(data.paymentCbu || "");
                setBank(data.paymentBank || "");
                setDepositPercent(data.depositPercent || 50);
            }
        } catch (e) {
            console.error("Error loading payment info:", e);
            setError("No se pudo cargar la información.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        setSaving(true);
        setError(null);
        setSaveSuccess(false);

        try {
            await updateDoc(doc(db, "professionals", userId), {
                mpAlias: mpAlias.trim(),
                paymentHolder: holderName.trim(),
                paymentCbu: cbu.trim(),
                paymentBank: bank.trim(),
                depositPercent: Number(depositPercent),
                updatedAt: new Date(),
            });
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e) {
            console.error("Error saving payment info:", e);
            setError("Error al guardar los cambios.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Configuración de Cobros</h1>
                    <p className="text-text-secondary">Definí cómo querés recibir los pagos de tus pacientes.</p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Sistema de Cobro Directo (Sin comisiones)</p>
                    <p>
                        Al configurar tu Alias o CBU, el sistema instruirá a los pacientes a transferirte directamente la seña o el total de la consulta.
                        Vos recibirás el comprobante y aprobarás el turno manualmente.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="alias">Alias (Mercado Pago / Banco)</Label>
                        <Input
                            id="alias"
                            placeholder="ej: nombre.apellido.mp"
                            value={mpAlias}
                            onChange={(e) => setMpAlias(e.target.value)}
                        />
                        <p className="text-xs text-text-muted">Es lo más fácil para tus pacientes.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bank">Banco / Billetera</Label>
                        <Input
                            id="bank"
                            placeholder="ej: Mercado Pago / Santander"
                            value={bank}
                            onChange={(e) => setBank(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="holder">Nombre del Titular</Label>
                    <Input
                        id="holder"
                        placeholder="Nombre completo como figura en la cuenta"
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="cbu">CBU / CVU (Opcional)</Label>
                    <Input
                        id="cbu"
                        placeholder="22 dígitos"
                        value={cbu}
                        onChange={(e) => setCbu(e.target.value)}
                    />
                </div>

                <div className="pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <Label htmlFor="deposit" className="text-base font-semibold">Porcentaje de Seña</Label>
                            <p className="text-xs text-text-secondary">Cuánto debe pagar el paciente para reservar.</p>
                        </div>
                        <span className="text-2xl font-bold text-primary">{depositPercent}%</span>
                    </div>
                    <input
                        type="range"
                        id="deposit"
                        min="10"
                        max="100"
                        step="10"
                        value={depositPercent}
                        onChange={(e) => setDepositPercent(Number(e.target.value))}
                        className="w-full accent-primary h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-text-muted mt-2">
                        <span>10%</span>
                        <span>50% (Recomendado)</span>
                        <span>100% (Pago Total)</span>
                    </div>
                </div>

                <div className="pt-2">
                    {saveSuccess && (
                        <div className="mb-4 flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
                            <CheckCircle className="h-4 w-4" />
                            Datos guardados correctamente. Tus próximos turnos pedirán esta seña.
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm font-medium">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <Button type="submit" disabled={saving} className="w-full md:w-auto" size="lg">
                        {saving ? (
                            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</>
                        ) : (
                            "Guardar Configuración"
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
