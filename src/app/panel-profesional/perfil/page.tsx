"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { User as UserIcon, Mail, Phone, MapPin, Award, DollarSign, Clock, Loader2, Save, Info, Camera, CheckCircle } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { PROFESSIONAL_CATEGORIES, getCategoryName } from "@/lib/categories";
import { sanitizeText, sanitizeHTML, sanitizePhone, sanitizeURL, detectXSS } from "@/lib/sanitize";

interface ProfessionalProfile {
    uid: string;
    name: string;
    email: string;
    phone?: string;
    title: string;
    bio: string;
    specialty: string;
    category: string;
    price: string;
    duration: string;
    image: string;
    status?: "pending" | "under_review" | "approved" | "rejected";
    tags?: string[];
}

// Use centralized categories
const CATEGORIES = PROFESSIONAL_CATEGORIES.map(cat => ({
    id: cat.id,
    name: cat.name
}));

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [profile, setProfile] = useState<ProfessionalProfile>({
        uid: "",
        name: "",
        email: "",
        title: "",
        bio: "",
        specialty: "",
        category: "Salud Mental",
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
                            bio: data.description || "", // Mapping description to bio
                            specialty: data.specialty || "",
                            category: data.category || "Salud Mental",
                            price: data.price?.toString() || "",
                            duration: data.duration?.toString() || "50",
                            image: data.image || data.profileImage || "",
                            status: data.status || "pending",
                            tags: data.tags || []
                        });
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        // ✅ SEGURIDAD: Detectar posibles ataques XSS
        const fieldsToCheck = [profile.name, profile.title, profile.bio, profile.specialty];
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
            const sanitizedSpecialty = sanitizeText(profile.specialty);
            const sanitizedPhone = profile.phone ? sanitizePhone(profile.phone) : "";
            const sanitizedImage = profile.image ? sanitizeURL(profile.image) : "";

            const docRef = doc(db, "professionals", user.uid);
            await updateDoc(docRef, {
                name: sanitizedName,
                phone: sanitizedPhone,
                title: sanitizedTitle,
                description: sanitizedBio,
                specialty: sanitizedSpecialty,
                category: profile.category,
                price: parseFloat(profile.price) || 0,
                duration: parseInt(profile.duration) || 50,
                image: sanitizedImage,
                updatedAt: new Date()
            });

            // Actualizar estado local con valores sanitizados
            setProfile(prev => ({
                ...prev,
                name: sanitizedName,
                title: sanitizedTitle,
                bio: sanitizedBio,
                specialty: sanitizedSpecialty,
                phone: sanitizedPhone,
                image: sanitizedImage,
            }));

            alert("Perfil actualizado correctamente.");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Hubo un error al guardar los cambios.");
        } finally {
            setSaving(false);
        }
    };

    const isProfileComplete = () => {
        return (
            profile.name.trim() !== "" &&
            profile.title.trim() !== "" &&
            profile.bio.trim().length >= 100 &&
            profile.specialty.trim() !== "" &&
            profile.category.trim() !== "" &&
            profile.price !== "" &&
            parseFloat(profile.price) > 0
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
                        <div className="relative group cursor-pointer mb-4">
                            <img
                                src={profile.image || `https://ui-avatars.com/api/?name=${profile.name}&background=random`}
                                alt="Profile"
                                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <p className="text-xs text-text-muted mb-4">
                            Hacé click para cambiar tu foto (Próximamente subida de archivos)
                        </p>
                        <div className="w-full">
                            <Label htmlFor="image-url" className="text-left block mb-1">URL de Imagen (Temporal)</Label>
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
                        <h3 className="font-bold text-secondary text-lg flex items-center gap-2">
                            <Award className="h-5 w-5 text-primary" />
                            Especialidad y Tarifas
                        </h3>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Categoría Principal</Label>
                                <select
                                    id="category"
                                    value={profile.category}
                                    onChange={(e) => handleChange('category', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {CATEGORIES.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="specialty">Especialidad Específica</Label>
                                <Input
                                    id="specialty"
                                    value={profile.specialty}
                                    onChange={(e) => handleChange('specialty', e.target.value)}
                                    placeholder="Ej: Terapia Cognitivo Conductual"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Precio Base por Consulta ($)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <Input
                                        id="price"
                                        type="number"
                                        value={profile.price}
                                        onChange={(e) => handleChange('price', e.target.value)}
                                        className="pl-9"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Duración Estándar (min)</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                                    <Input
                                        id="duration"
                                        type="number"
                                        value={profile.duration}
                                        onChange={(e) => handleChange('duration', e.target.value)}
                                        className="pl-9"
                                        placeholder="50"
                                    />
                                </div>
                            </div>
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
