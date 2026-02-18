"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { User as UserIcon, Mail, Phone, Award, DollarSign, Clock, Loader2, Save, Info, CheckCircle, Plus, Trash2 } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { PROFESSIONAL_CATEGORIES, getCategoryName, getSubcategories } from "@/lib/categories";
import { sanitizeText, sanitizeHTML, sanitizePhone, sanitizeURL, detectXSS } from "@/lib/sanitize";

interface ProfessionalProfile {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    title: string;
    bio: string;
    category: string;
    price: string;
    duration: string;
    image: string;
    status?: "pending" | "under_review" | "approved" | "rejected";
    tags?: string[];
}

interface Service {
    id: string; // UUID local para el key de React
    name: string; // Nombre del servicio (viene del dropdown de subcategorias)
    description: string;
    duration: number; // minutos
    price: number; // ARS
}

// Use centralized categories
const CATEGORIES = PROFESSIONAL_CATEGORIES.map(cat => ({
    id: cat.id,
    name: cat.name
}));

function newService(): Service {
    return { id: crypto.randomUUID(), name: '', description: '', duration: 50, price: 0 };
}

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [services, setServices] = useState<Service[]>([newService()]);

    const [profile, setProfile] = useState<ProfessionalProfile>({
        uid: "",
        name: "",
        email: "",
        title: "",
        bio: "",
        category: "salud-mental",
        price: "",
        duration: "50",
        image: "",
        status: "pending",
        tags: []
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const docRef = doc(db, "professionals", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setProfile({
                            uid: currentUser.uid,
                            name: data.name || currentUser.displayName || "",
                            email: data.email || currentUser.email || "",
                            phone: data.phone || "",
                            title: data.title || "",
                            bio: data.description || "",
                            category: data.category || "salud-mental",
                            price: data.price?.toString() || "",
                            duration: data.duration?.toString() || "50",
                            image: data.image || data.profileImage || "",
                            status: data.status || "pending",
                            tags: data.tags || []
                        });
                        // Cargar servicios guardados
                        if (Array.isArray(data.services) && data.services.length > 0) {
                            setServices(data.services.map((s: any) => ({
                                id: s.id || crypto.randomUUID(),
                                name: s.name || '',
                                description: s.description || '',
                                duration: s.duration || 50,
                                price: s.price || 0,
                            })));
                        }
                    }
                } catch (e) {
                    console.error("Error fetching profile", e);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleChange = (field: keyof ProfessionalProfile, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    // ── Helpers de servicios ─────────────────────────────────────────────────
    const addService = () => setServices(prev => [...prev, newService()]);

    const removeService = (id: string) =>
        setServices(prev => prev.length > 1 ? prev.filter(s => s.id !== id) : prev);

    const updateService = (id: string, field: keyof Omit<Service, 'id'>, value: string | number) =>
        setServices(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

    const subcategories = getSubcategories(profile.category);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // Validar servicios
        const validServices = services.filter(s => s.name.trim() !== '');
        if (validServices.length === 0) {
            alert('Por favor agrega al menos un servicio con nombre.');
            return;
        }

        // ✅ SEGURIDAD: Detectar posibles ataques XSS
        const fieldsToCheck = [profile.name, profile.title, profile.bio];
        for (const field of fieldsToCheck) {
            if (detectXSS(field)) {
                alert("⚠️ Se detectó contenido sospechoso en el formulario. Por favor, evitá usar caracteres especiales como <script>, javascript:, etc.");
                return;
            }
        }

        setSaving(true);

        try {
            // ✅ SEGURIDAD: Sanitizar todos los campos antes de guardar
            const sanitizedName = sanitizeText(profile.name);
            const sanitizedTitle = sanitizeText(profile.title);
            const sanitizedBio = sanitizeHTML(profile.bio);
            const sanitizedPhone = profile.phone ? sanitizePhone(profile.phone) : "";
            const sanitizedImage = profile.image ? sanitizeURL(profile.image) : "";

            // Sanitizar servicios
            const sanitizedServices = validServices.map(s => ({
                id: s.id,
                name: sanitizeText(s.name),
                description: sanitizeText(s.description),
                duration: Math.max(1, Math.round(Number(s.duration) || 50)),
                price: Math.max(0, Number(s.price) || 0),
            }));

            // Precio y duración base = primer servicio (para compatibilidad)
            const baseService = sanitizedServices[0];

            const docRef = doc(db, "professionals", user.uid);
            await updateDoc(docRef, {
                name: sanitizedName,
                phone: sanitizedPhone,
                title: sanitizedTitle,
                description: sanitizedBio,
                category: profile.category,
                services: sanitizedServices,
                // Compatibilidad con campos legacy
                specialty: baseService.name,
                price: baseService.price,
                duration: baseService.duration,
                image: sanitizedImage,
                updatedAt: new Date()
            });

            setProfile(prev => ({
                ...prev,
                name: sanitizedName,
                title: sanitizedTitle,
                bio: sanitizedBio,
                phone: sanitizedPhone,
                image: sanitizedImage,
            }));
            setServices(sanitizedServices);

            alert("✅ Perfil actualizado correctamente.");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Hubo un error al guardar los cambios.");
        } finally {
            setSaving(false);
        }
    };

    const isProfileComplete = () => {
        const validServices = services.filter(s => s.name.trim() !== '');
        return (
            profile.name.trim() !== "" &&
            profile.title.trim() !== "" &&
            profile.bio.trim().length >= 100 &&
            profile.category.trim() !== "" &&
            validServices.length > 0 &&
            validServices.some(s => s.price > 0)
        );
    };

    const handleRequestReview = async () => {
        if (!user) return;

        if (!isProfileComplete()) {
            alert("Por favor completá todos los campos requeridos antes de solicitar revisión:\n\n• Nombre completo\n• Título profesional\n• Biografía (mínimo 100 caracteres)\n• Especialidad\n• Categoría\n• Precio base");
            return;
        }

        const confirmed = confirm(
            "¿Estás seguro que querés solicitar la revisión de tu perfil?\n\nUna vez enviada la solicitud, nuestro equipo revisará tu información y te contactaremos para coordinar la entrevista de aprobación."
        );

        if (!confirmed) return;

        setSaving(true);
        try {
            const docRef = doc(db, "professionals", user.uid);
            await updateDoc(docRef, {
                status: "under_review",
                reviewRequestedAt: new Date()
            });

            // Update local state
            setProfile(prev => ({ ...prev, status: "under_review" }));

            alert("¡Solicitud enviada correctamente!\n\nTu perfil está ahora en proceso de revisión. Nos pondremos en contacto pronto para coordinar la entrevista.");
        } catch (error) {
            console.error("Error requesting review:", error);
            alert("Hubo un error al enviar la solicitud. Intentá nuevamente.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-secondary">Mi Perfil Profesional</h1>
                <p className="text-text-secondary">Completá tu información para que los pacientes te conozcan.</p>
            </div>

            {/* Status Banner */}
            <div className={`p-4 rounded-xl border ${profile.status === 'approved'
                ? "bg-green-50 border-green-200 text-green-800"
                : profile.status === 'under_review'
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                } flex items-start gap-3`}>
                <Info className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-bold text-sm uppercase tracking-wide">
                        Estado de la cuenta: {
                            profile.status === 'approved'
                                ? 'Verificada'
                                : profile.status === 'under_review'
                                    ? 'En Proceso de Revisión'
                                    : 'Pendiente'
                        }
                    </h3>
                    <p className="text-sm mt-1">
                        {profile.status === 'approved'
                            ? "Tu perfil es público y visible para todos los pacientes."
                            : profile.status === 'under_review'
                                ? "Tu solicitud de revisión fue recibida. Nuestro equipo se pondrá en contacto pronto para coordinar la entrevista de aprobación."
                                : "Tu perfil está visible solo para vos. Completá todos los datos para solicitar la entrevista de aprobación."}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="grid md:grid-cols-3 gap-8">

                {/* Left Column: Image & Basic Info */}
                <div className="md:col-span-1 space-y-6">
                    {/* Profile Image */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 flex flex-col items-center text-center">
                        <div
                            className="relative mb-4"
                        >
                            <img
                                src={profile.image || `https://ui-avatars.com/api/?name=${profile.name}&background=random`}
                                alt="Profile"
                                className={`w-36 h-36 rounded-full object-cover border-4 border-white shadow-md transition-opacity`}
                            />
                        </div>

                        <p className="text-xs text-text-muted mb-4">
                            Ingresá la URL de tu foto de perfil.
                        </p>

                        <div className="w-full">
                            <Label htmlFor="image-url" className="text-left block mb-1">URL de Imagen</Label>
                            <Input
                                id="image-url"
                                value={profile.image}
                                onChange={(e) => handleChange('image', e.target.value)}
                                placeholder="https://..."
                                className="text-xs"
                            />
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 space-y-4">
                        <h3 className="font-bold text-secondary text-sm uppercase tracking-wide border-b pb-2">Contacto</h3>

                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="email" className="text-xs">Email (No editable)</Label>
                                <div className="flex items-center gap-2 text-text-secondary bg-neutral-50 p-2 rounded border border-neutral-100 mt-1">
                                    <Mail className="h-4 w-4" />
                                    <span className="text-sm truncate">{profile.email}</span>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="phone" className="text-xs">Teléfono</Label>
                                <div className="relative mt-1">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <Input
                                        id="phone"
                                        value={profile.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                        className="pl-9"
                                        placeholder="+54 9 11..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Professional Details */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 space-y-6">
                        <h3 className="font-bold text-secondary text-lg flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-primary" />
                            Datos Profesionales
                        </h3>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input
                                    id="name"
                                    value={profile.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="title">Título Profesional</Label>
                                <Input
                                    id="title"
                                    value={profile.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="Ej: Lic. en Psicología"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Biografía / Sobre Mí</Label>
                            <Textarea
                                id="bio"
                                value={profile.bio}
                                onChange={(e) => handleChange('bio', e.target.value)}
                                placeholder="Contale a tus pacientes sobre tu experiencia, enfoque y cómo podés ayudarlos..."
                                className="resize-none"
                                rows={5}
                            />
                            <p className="text-xs text-text-muted text-right">Mínimo 100 caracteres recomendado.</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-secondary text-lg flex items-center gap-2">
                                <Award className="h-5 w-5 text-primary" />
                                Especialidad y Servicios
                            </h3>
                        </div>

                        {/* Categoría Principal */}
                        <div className="space-y-2">
                            <Label htmlFor="category">Categoría Principal</Label>
                            <select
                                id="category"
                                value={profile.category}
                                onChange={(e) => {
                                    handleChange('category', e.target.value);
                                    // Resetear nombre de servicios al cambiar categoría
                                    setServices(prev => prev.map(s => ({ ...s, name: '' })));
                                }}
                                className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                <option value="">Seleccionar categoría</option>
                                {CATEGORIES.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Lista de Servicios */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-secondary">Servicios Ofrecidos</Label>
                                <button
                                    type="button"
                                    onClick={addService}
                                    className="flex items-center gap-1.5 text-sm text-primary font-semibold hover:text-primary-dark transition-colors px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/5"
                                >
                                    <Plus className="h-4 w-4" />
                                    Agregar Servicio
                                </button>
                            </div>

                            {services.map((service, idx) => (
                                <div
                                    key={service.id}
                                    className="border border-neutral-200 rounded-xl p-4 space-y-4 bg-neutral-50/50 relative"
                                >
                                    {/* Header del servicio */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-text-muted uppercase tracking-wide">
                                            Servicio {idx + 1}
                                        </span>
                                        {services.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeService(service.id)}
                                                className="text-red-400 hover:text-red-600 transition-colors p-1 rounded"
                                                title="Eliminar servicio"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Nombre del servicio (dropdown) */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor={`service-name-${service.id}`}>Servicio</Label>
                                        <select
                                            id={`service-name-${service.id}`}
                                            value={service.name}
                                            onChange={(e) => updateService(service.id, 'name', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                            required
                                        >
                                            <option value="">Seleccionar servicio...</option>
                                            {subcategories.map(sub => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Descripción */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor={`service-desc-${service.id}`}>Descripción</Label>
                                        <Textarea
                                            id={`service-desc-${service.id}`}
                                            value={service.description}
                                            onChange={(e) => updateService(service.id, 'description', e.target.value)}
                                            placeholder="Describí en qué consiste este servicio..."
                                            className="resize-none text-sm"
                                            rows={2}
                                        />
                                    </div>

                                    {/* Duración y Precio */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label htmlFor={`service-dur-${service.id}`}>Duración (min)</Label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                                <Input
                                                    id={`service-dur-${service.id}`}
                                                    type="number"
                                                    min={1}
                                                    value={service.duration}
                                                    onChange={(e) => updateService(service.id, 'duration', Number(e.target.value))}
                                                    className="pl-9"
                                                    placeholder="50"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor={`service-price-${service.id}`}>Precio ($)</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                                <Input
                                                    id={`service-price-${service.id}`}
                                                    type="number"
                                                    min={0}
                                                    value={service.price}
                                                    onChange={(e) => updateService(service.id, 'price', Number(e.target.value))}
                                                    className="pl-9"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {subcategories.length === 0 && profile.category && (
                                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                                    Seleccioná una categoría principal para ver los servicios disponibles.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3 justify-end pt-4">
                        <Button type="submit" size="lg" disabled={saving} className="w-full md:w-auto min-w-[200px]">
                            {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                            {saving ? "Guardando..." : "Guardar Cambios"}
                        </Button>

                        {profile.status === "pending" && (
                            <Button
                                type="button"
                                size="lg"
                                disabled={saving || !isProfileComplete()}
                                onClick={handleRequestReview}
                                className="w-full md:w-auto min-w-[200px] bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
                            >
                                <CheckCircle className="h-5 w-5 mr-2" />
                                Solicitar Revisión
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
