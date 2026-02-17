
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Clock, DollarSign, Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc, query } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { sanitizeText, sanitizeHTML, detectXSS } from "@/lib/sanitize";

interface Service {
    id: string;
    name: string;
    description: string;
    duration: number; // in minutes
    price: number;
}

export default function ServicesPage() {
    const [user, setUser] = useState<User | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        duration: "50",
        price: "",
    });

    // Auth Listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                fetchServices(currentUser.uid);
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchServices = async (uid: string) => {
        try {
            const q = query(collection(db, "professionals", uid, "services"));
            const querySnapshot = await getDocs(q);
            const fetchedServices: Service[] = [];
            querySnapshot.forEach((doc) => {
                fetchedServices.push({ id: doc.id, ...doc.data() } as Service);
            });
            setServices(fetchedServices);
        } catch (error) {
            console.error("Error fetching services:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // ✅ SEGURIDAD: Detectar XSS
        if (detectXSS(formData.name) || detectXSS(formData.description)) {
            alert("⚠️ Se detectó contenido sospechoso. Evitá usar caracteres especiales como <script>, javascript:, etc.");
            return;
        }

        setSubmitting(true);
        try {
            // ✅ SEGURIDAD: Sanitizar campos
            const sanitizedName = sanitizeText(formData.name);
            const sanitizedDescription = sanitizeHTML(formData.description);

            const newServiceData = {
                name: sanitizedName,
                description: sanitizedDescription,
                duration: parseInt(formData.duration),
                price: parseFloat(formData.price),
            };

            const docRef = await addDoc(collection(db, "professionals", user.uid, "services"), newServiceData);

            setServices([...services, { id: docRef.id, ...newServiceData }]);
            setIsCreating(false);
            setFormData({ name: "", description: "", duration: "50", price: "" });
        } catch (error) {
            console.error("Error adding service:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        if (!confirm("¿Estás seguro de que querés eliminar este servicio?")) return;

        try {
            await deleteDoc(doc(db, "professionals", user.uid, "services", id));
            setServices(services.filter(s => s.id !== id));
        } catch (error) {
            console.error("Error deleting service:", error);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Mis Servicios</h1>
                    <p className="text-text-secondary">Administrá los tipos de consulta que ofrecés a tus pacientes.</p>
                </div>
                <Button onClick={() => setIsCreating(true)} className={isCreating ? "hidden" : ""}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">

                {/* Services List */}
                <div className="lg:col-span-2 space-y-4">
                    {services.map((service) => (
                        <div key={service.id} className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 hover:border-primary/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-lg text-secondary">{service.name}</h3>
                                    <p className="text-text-secondary text-sm max-w-md">{service.description}</p>
                                </div>
                                <div className="text-right">
                                    <span className="block font-bold text-xl text-primary">${service.price}</span>
                                    <div className="flex items-center justify-end text-xs text-text-muted mt-1 gap-1">
                                        <Clock className="h-3 w-3" />
                                        {service.duration} min
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4 justify-end">
                                <Button variant="ghost" size="sm" className="h-8 text-neutral-400 hover:text-secondary">
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(service.id)} className="h-8 text-neutral-400 hover:text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {services.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-neutral-200">
                            <p className="text-text-muted">No tenés servicios creados aún.</p>
                        </div>
                    )}
                </div>

                {/* Create/Edit Form Panel */}
                {isCreating && (
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-md border border-neutral-100 sticky top-4">
                            <h3 className="font-bold text-secondary mb-4">Nuevo Servicio</h3>
                            <form onSubmit={handleCreate} className="space-y-4">

                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre del servicio</Label>
                                    <Input
                                        id="name"
                                        placeholder="Ej: Consulta Individual"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Descripción</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="¿Qué incluye este servicio?"
                                        className="resize-none"
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Duración (min)</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                            <Input
                                                id="duration"
                                                type="number"
                                                className="pl-9"
                                                placeholder="50"
                                                required
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Precio ($)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                            <Input
                                                id="price"
                                                type="number"
                                                className="pl-9"
                                                placeholder="0.00"
                                                required
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-2">
                                    <Button type="submit" className="w-full" disabled={submitting}>
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setIsCreating(false)} className="w-full">Cancelar</Button>
                                </div>

                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
