"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Wallet, CheckCircle, Loader2, AlertCircle, Info, History, Settings, FileText, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";

interface Transaction {
    id: string;
    patientName: string;
    date: string;
    time: string;
    totalPrice: number;
    depositAmount: number;
    status: string;
    receiptUrl?: string;
    paymentApprovedAt?: any;
}

export default function PagosPage() {
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // Settings State
    const [saving, setSaving] = useState(false);
    const [mpAlias, setMpAlias] = useState("");
    const [holderName, setHolderName] = useState("");
    const [cbu, setCbu] = useState("");
    const [bank, setBank] = useState("");
    const [depositPercent, setDepositPercent] = useState(50);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // History State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                loadPaymentInfo(user.uid);
                loadTransactions(user.uid);
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

    const loadTransactions = async (uid: string) => {
        setLoadingHistory(true);
        try {
            // Fetch appointments with payment info
            // Note: Ideally order by date desc, but needs index. Sorting in memory for now.
            const q = query(
                collection(db, "appointments"),
                where("professionalId", "==", uid),
                where("paymentStatus", "!=", null) // Only those with interaction
            );

            const snap = await getDocs(q);
            const list: Transaction[] = [];

            snap.forEach(doc => {
                const data = doc.data();
                // Filter out 'pending' only if needed, but paymentStatus usually implies interaction
                if (data.paymentStatus && data.paymentStatus !== 'pending') {
                    list.push({
                        id: doc.id,
                        patientName: data.patientName || "Paciente",
                        date: data.date,
                        time: data.time,
                        totalPrice: data.price || 0,
                        depositAmount: Math.round((data.price || 0) * (data.depositPercent || 50) / 100),
                        status: data.paymentStatus, // 'submitted', 'paid', 'rejected'
                        receiptUrl: data.receiptUrl,
                        paymentApprovedAt: data.paymentApprovedAt
                    });
                }
            });

            // Sort by date desc
            list.sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime());

            setTransactions(list);
        } catch (e) {
            console.error("Error loading transactions:", e);
        } finally {
            setLoadingHistory(false);
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
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Gestión de Cobros</h1>
                    <p className="text-text-secondary">Administrá tus ingresos y configurá tus métodos de pago.</p>
                </div>
            </div>

            <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
                    <TabsTrigger value="history" className="flex gap-2"><History className="h-4 w-4" /> Historial</TabsTrigger>
                    <TabsTrigger value="settings" className="flex gap-2"><Settings className="h-4 w-4" /> Configuración</TabsTrigger>
                </TabsList>

                {/* ─── HISTORIAL TAB ───────────────────────────────────────────── */}
                <TabsContent value="history" className="space-y-4 animate-in fade-in-50">
                    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-neutral-100 bg-neutral-50/50">
                            <h2 className="font-bold text-secondary text-lg">Historial de Transacciones</h2>
                            <p className="text-sm text-text-muted">Últimos movimientos registrados de tus pacientes.</p>
                        </div>

                        {loadingHistory ? (
                            <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary/50" /></div>
                        ) : transactions.length === 0 ? (
                            <div className="p-12 text-center text-text-muted">
                                <Wallet className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                <p>Aún no tenés transacciones registradas.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-neutral-50 text-xs uppercase text-text-muted font-semibold">
                                        <tr>
                                            <th className="text-left px-6 py-3">Fecha</th>
                                            <th className="text-left px-6 py-3">Paciente</th>
                                            <th className="text-right px-6 py-3">Seña (Est.)</th>
                                            <th className="text-center px-6 py-3">Estado</th>
                                            <th className="text-right px-6 py-3">Comprobante</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                        {transactions.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-neutral-50 transition-colors">
                                                <td className="px-6 py-3 whitespace-nowrap">
                                                    <div className="font-medium text-secondary">{tx.date}</div>
                                                    <div className="text-xs text-text-muted">{tx.time} hs</div>
                                                </td>
                                                <td className="px-6 py-3 font-medium text-secondary">
                                                    {tx.patientName}
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <div className="font-bold text-secondary">${tx.depositAmount.toLocaleString('es-AR')}</div>
                                                    <div className="text-xs text-text-muted">de ${tx.totalPrice.toLocaleString('es-AR')}</div>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                        ${tx.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                            tx.status === 'submitted' ? 'bg-amber-100 text-amber-800' :
                                                                tx.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}
                                                    `}>
                                                        {tx.status === 'paid' ? 'Aprobado' :
                                                            tx.status === 'submitted' ? 'Pendiente' :
                                                                tx.status === 'rejected' ? 'Rechazado' : tx.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    {tx.receiptUrl ? (
                                                        <a
                                                            href={tx.receiptUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center text-primary hover:text-primary/80 text-xs font-medium hover:underline"
                                                        >
                                                            <FileText className="h-3 w-3 mr-1" /> Ver <ExternalLink className="h-3 w-3 ml-1" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-text-muted text-xs">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* ─── SETTINGS TAB ────────────────────────────────────────────── */}
                <TabsContent value="settings" className="space-y-6 animate-in fade-in-50">
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
                                    Datos guardados correctamente.
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
                </TabsContent>
            </Tabs>
        </div>
    );
}
