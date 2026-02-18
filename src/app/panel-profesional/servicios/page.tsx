"use client";

import { useState, useEffect, useRef } from "react";
import { Input, Label } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Clock, DollarSign, Plus, Trash2, Edit2, Loader2, Check, X, Briefcase } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { sanitizeText, sanitizeHTML, detectXSS } from "@/lib/sanitize";
import { PROFESSIONAL_CATEGORIES } from "@/lib/categories";

interface Service {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
}

const SELECT_CLASS =
    "flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

const ALL_SUBCATEGORIES = PROFESSIONAL_CATEGORIES.flatMap(cat =>
    (cat.subcategories || []).map(sub => ({ sub, catName: cat.name }))
);

const EMPTY_FORM = { name: "", description: "", duration: "50", price: "" };

export default function ServicesPage() {
    const [user, setUser] = useState<User | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Nuevo servicio
    const [showNew, setShowNew] = useState(false);
    const [newForm, setNewForm] = useState(EMPTY_FORM);

    // Edición inline
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState(EMPTY_FORM);
    const [savingId, setSavingId] = useState<string | null>(null);

    const newFormRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) fetchServices(currentUser.uid);
            else setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Lee el array services[] del documento principal professionals/{uid}
    const fetchServices = async (uid: string) => {
        try {
            const profDoc = await getDoc(doc(db, "professionals", uid));
            if (profDoc.exists()) {
                const data = profDoc.data();
                const raw: Service[] = (data.services || []).map((s: Omit<Service, 'id'> & { id?: string }) => ({
                    id: s.id || crypto.randomUUID(),
                    name: s.name || "",
                    description: s.description || "",
                    duration: Number(s.duration) || 50,
                    price: Number(s.price) || 0,
                }));
                setServices(raw);
            }
        } catch (e) {
            console.error("Error fetching services:", e);
        } finally {
            setLoading(false);
        }
    };

    // Persiste el array completo en Firestore y sincroniza specialty/price/duration
    const persistServices = async (uid: string, updated: Service[]) => {
        const first = updated[0];
        await updateDoc(doc(db, "professionals", uid), {
            services: updated,
            // Compatibilidad con el resto de la app
            specialty: first?.name || "",
            price: first?.price || 0,
            duration: first?.duration || 50,
        });
    };

    // ── Crear ──────────────────────────────────────────────────────────────────
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (detectXSS(newForm.name) || detectXSS(newForm.description)) {
            alert("⚠️ Contenido sospechoso detectado.");
            return;
        }
        setSubmitting(true);
        try {
            const newService: Service = {
                id: crypto.randomUUID(),
                name: sanitizeText(newForm.name),
                description: sanitizeHTML(newForm.description),
                duration: parseInt(newForm.duration) || 50,
                price: parseFloat(newForm.price) || 0,
            };
            const updated = [...services, newService];
            await persistServices(user.uid, updated);
            setServices(updated);
            setNewForm(EMPTY_FORM);
            setShowNew(false);
        } catch (e) {
            console.error("Error creating service:", e);
            alert("❌ Error al crear el servicio");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Editar ─────────────────────────────────────────────────────────────────
    const startEdit = (service: Service) => {
        setEditingId(service.id);
        setEditForm({
            name: service.name,
            description: service.description,
            duration: service.duration.toString(),
            price: service.price.toString(),
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm(EMPTY_FORM);
    };

    const handleSaveEdit = async (id: string) => {
        if (!user) return;
        if (detectXSS(editForm.name) || detectXSS(editForm.description)) {
            alert("⚠️ Contenido sospechoso detectado.");
            return;
        }
        setSavingId(id);
        try {
            const updated = services.map(s =>
                s.id === id
                    ? {
                        ...s,
                        name: sanitizeText(editForm.name),
                        description: sanitizeHTML(editForm.description),
                        duration: parseInt(editForm.duration) || 50,
                        price: parseFloat(editForm.price) || 0,
                    }
                    : s
            );
            await persistServices(user.uid, updated);
            setServices(updated);
            setEditingId(null);
        } catch (e) {
            console.error("Error saving edit:", e);
            alert("❌ Error al guardar los cambios");
        } finally {
            setSavingId(null);
        }
    };

    // ── Eliminar ───────────────────────────────────────────────────────────────
    const handleDelete = async (id: string) => {
        if (!user) return;
        if (!confirm("¿Eliminar este servicio?")) return;
        try {
            const updated = services.filter(s => s.id !== id);
            await persistServices(user.uid, updated);
            setServices(updated);
        } catch (e) {
            console.error("Error deleting service:", e);
            alert("❌ Error al eliminar el servicio");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-12">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-secondary">Mis Servicios</h1>
                    <p className="text-text-secondary text-sm mt-0.5">
                        Administrá los tipos de consulta que ofrecés a tus pacientes.
                    </p>
                </div>
                {!showNew && (
                    <button
                        onClick={() => { setShowNew(true); setTimeout(() => newFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 50); }}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        Nuevo Servicio
                    </button>
                )}
            </div>

            {/* Lista de servicios */}
            <div className="space-y-3">
                {services.length === 0 && !showNew && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-neutral-200">
                        <Briefcase className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
                        <p className="font-semibold text-text-secondary">Todavía no tenés servicios</p>
                        <p className="text-sm text-text-muted mt-1">Hacé click en "Nuevo Servicio" para agregar el primero.</p>
                    </div>
                )}

                {services.map((service) => (
                    <div
                        key={service.id}
                        className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden
                            ${editingId === service.id
                                ? 'border-primary/40 shadow-md'
                                : 'border-neutral-100 hover:border-neutral-200 shadow-sm'
                            }`}
                    >
                        {editingId === service.id ? (
                            /* ── Modo edición inline ── */
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-primary uppercase tracking-wide">Editando servicio</span>
                                    <button onClick={cancelEdit} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Nombre */}
                                <div className="space-y-1.5">
                                    <Label htmlFor={`edit-name-${service.id}`} className="text-xs">Servicio</Label>
                                    <select
                                        id={`edit-name-${service.id}`}
                                        value={editForm.name}
                                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                        className={SELECT_CLASS}
                                    >
                                        <option value="">Seleccionar servicio...</option>
                                        {ALL_SUBCATEGORIES.map(({ sub, catName }) => (
                                            <option key={sub} value={sub}>{catName} — {sub}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Descripción */}
                                <div className="space-y-1.5">
                                    <Label htmlFor={`edit-desc-${service.id}`} className="text-xs">Descripción</Label>
                                    <Textarea
                                        id={`edit-desc-${service.id}`}
                                        value={editForm.description}
                                        onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="¿Qué incluye este servicio?"
                                        className="resize-none text-sm"
                                        rows={2}
                                    />
                                </div>

                                {/* Duración + Precio */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor={`edit-dur-${service.id}`} className="text-xs">Duración (min)</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                            <Input
                                                id={`edit-dur-${service.id}`}
                                                type="number" min={1}
                                                value={editForm.duration}
                                                onChange={e => setEditForm(f => ({ ...f, duration: e.target.value }))}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor={`edit-price-${service.id}`} className="text-xs">Precio ($)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                            <Input
                                                id={`edit-price-${service.id}`}
                                                type="number" min={0}
                                                value={editForm.price}
                                                onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={() => handleSaveEdit(service.id)}
                                        disabled={savingId === service.id}
                                        className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
                                    >
                                        {savingId === service.id
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <><Check className="h-4 w-4" /> Guardar cambios</>
                                        }
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold border border-neutral-200 text-text-secondary hover:bg-neutral-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ── Vista normal ── */
                            <div className="flex items-center gap-4 px-5 py-4">
                                {/* Ícono */}
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                    <Briefcase className="h-5 w-5 text-primary" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-secondary truncate">{service.name}</p>
                                    {service.description && (
                                        <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{service.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="flex items-center gap-1 text-xs text-text-muted">
                                            <Clock className="h-3 w-3" />
                                            {service.duration} min
                                        </span>
                                        <span className="font-bold text-primary text-sm">
                                            ${service.price.toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <button
                                        onClick={() => startEdit(service)}
                                        title="Editar"
                                        className="p-2 rounded-lg text-neutral-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(service.id)}
                                        title="Eliminar"
                                        className="p-2 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* ── Formulario nuevo servicio (al final de la lista) ── */}
                {showNew && (
                    <div ref={newFormRef} className="bg-white rounded-2xl border border-primary/40 shadow-md overflow-hidden">
                        <div className="bg-primary/5 px-5 py-3 border-b border-primary/10 flex items-center justify-between">
                            <span className="text-sm font-bold text-primary">Nuevo Servicio</span>
                            <button onClick={() => { setShowNew(false); setNewForm(EMPTY_FORM); }} className="text-neutral-400 hover:text-neutral-600 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="p-5 space-y-4">

                            {/* Nombre */}
                            <div className="space-y-1.5">
                                <Label htmlFor="new-name" className="text-xs">Servicio</Label>
                                <select
                                    id="new-name"
                                    value={newForm.name}
                                    onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                                    className={SELECT_CLASS}
                                    required
                                >
                                    <option value="">Seleccionar servicio...</option>
                                    {ALL_SUBCATEGORIES.map(({ sub, catName }) => (
                                        <option key={sub} value={sub}>{catName} — {sub}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Descripción */}
                            <div className="space-y-1.5">
                                <Label htmlFor="new-desc" className="text-xs">Descripción</Label>
                                <Textarea
                                    id="new-desc"
                                    value={newForm.description}
                                    onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="¿Qué incluye este servicio?"
                                    className="resize-none text-sm"
                                    rows={2}
                                />
                            </div>

                            {/* Duración + Precio */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="new-dur" className="text-xs">Duración (min)</Label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                        <Input
                                            id="new-dur"
                                            type="number" min={1}
                                            value={newForm.duration}
                                            onChange={e => setNewForm(f => ({ ...f, duration: e.target.value }))}
                                            className="pl-9"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="new-price" className="text-xs">Precio ($)</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                        <Input
                                            id="new-price"
                                            type="number" min={0}
                                            value={newForm.price}
                                            onChange={e => setNewForm(f => ({ ...f, price: e.target.value }))}
                                            className="pl-9"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-60"
                                >
                                    {submitting
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : <><Check className="h-4 w-4" /> Guardar Servicio</>
                                    }
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowNew(false); setNewForm(EMPTY_FORM); }}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold border border-neutral-200 text-text-secondary hover:bg-neutral-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
