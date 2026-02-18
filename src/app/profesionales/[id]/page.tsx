"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Star, MapPin, Video, CheckCircle, Share2, Heart, Clock, Loader2, Calendar } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { ReviewList } from "@/components/ReviewList";
import { ReviewStatsDisplay } from "@/components/ReviewStatsDisplay";
import { getProfessionalReviews, getReviewStats, Review, ReviewStats } from "@/lib/reviews";
import { ProfessionalAvatar } from "@/components/ui/ProfessionalAvatar";

interface Service {
    id: string;
    name: string;
    price: number;
    duration: number;
    description?: string;
}

interface Professional {
    firstName: string;
    lastName: string;
    title: string;
    specialty: string;
    category: string;
    bio?: string;
    price: number;
    sessionDuration: number;
    profileImage?: string;
    rating?: number;
    reviewCount?: number;
    status: string;
    services?: Service[];
}

export default function ProfessionalProfile({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [professional, setProfessional] = useState<Professional | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewStats, setReviewStats] = useState<ReviewStats>({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        loadProfessional();
        loadReviews();
    }, [params.id]);

    const loadProfessional = async () => {
        try {
            // Check for mock IDs first
            if (params.id.startsWith("mock")) {
                // Mock Data Fallback
                const mockData: Record<string, Professional> = {
                    "mock1": {
                        firstName: "Mariana",
                        lastName: "Costa",
                        title: "Lic.",
                        specialty: "Psicóloga Clínica",
                        category: "Salud Mental",
                        bio: "Especialista en terapia cognitivo-conductual con más de 10 años de experiencia.",
                        price: 45000,
                        sessionDuration: 50,
                        profileImage: "https://i.pravatar.cc/150?u=mock_psy",
                        rating: 4.9,
                        reviewCount: 32,
                        status: "approved"
                    },
                    "mock2": {
                        firstName: "Lucas",
                        lastName: "Funes",
                        title: "Lic.",
                        specialty: "Nutricionista Deportivo",
                        category: "Nutrición",
                        bio: "Ayudo a deportistas a alcanzar su máximo rendimiento a través de la alimentación.",
                        price: 35000,
                        sessionDuration: 50,
                        profileImage: "https://i.pravatar.cc/150?u=mock_nutri",
                        rating: 4.8,
                        reviewCount: 18,
                        status: "approved"
                    }
                };

                if (mockData[params.id]) {
                    setProfessional(mockData[params.id]);
                }
                setLoading(false);
                return;
            }

            const profDoc = await getDoc(doc(db, "professionals", params.id));
            if (profDoc.exists()) {
                const data = profDoc.data();

                // Soporta tanto el formato nuevo (firstName/lastName) como el formato real de Firestore (name)
                let firstName = data.firstName || "";
                let lastName = data.lastName || "";
                if (!firstName && data.name) {
                    const parts = (data.name as string).trim().split(" ");
                    firstName = parts[0] || "";
                    lastName = parts.slice(1).join(" ") || "";
                }

                setProfessional({
                    firstName,
                    lastName,
                    title: data.title || "",
                    specialty: data.specialty || data.specialization || "",
                    category: data.category || "",
                    bio: data.bio || data.description || "",
                    price: data.price || 0,
                    sessionDuration: data.sessionDuration || data.duration || 50,
                    profileImage: data.profileImage || data.image,
                    rating: data.rating || 5,
                    reviewCount: data.reviewCount || 0,
                    status: data.status || "pending",
                    services: Array.isArray(data.services) ? data.services : [],
                });
            }
        } catch (error) {
            console.error("Error loading professional:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadReviews = async () => {
        try {
            setLoadingReviews(true);
            const [reviewsData, statsData] = await Promise.all([
                getProfessionalReviews(params.id),
                getReviewStats(params.id),
            ]);
            setReviews(reviewsData);
            setReviewStats(statsData);
        } catch (error) {
            console.error("Error loading reviews:", error);
        } finally {
            setLoadingReviews(false);
        }
    };

    const handleBooking = () => {
        if (!isAuthenticated) {
            const serviceParam = selectedService ? `&service=${encodeURIComponent(selectedService.id)}` : '';
            router.push(`/login?redirect=/reservar?professional=${params.id}${serviceParam}`);
            return;
        }
        const serviceParam = selectedService ? `&service=${encodeURIComponent(selectedService.id)}` : '';
        router.push(`/reservar?professional=${params.id}${serviceParam}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (!professional) {
        return (
            <div className="min-h-screen bg-neutral-50 flex flex-col">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-xl text-text-secondary mb-4">Profesional no encontrado</p>
                        <Link href="/profesionales">
                            <Button>Ver Profesionales</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Only show approved professionals (commented for development)
    // if (professional.status !== "approved") {
    //     return (
    //         <div className="min-h-screen bg-neutral-50 flex flex-col">
    //             <Navbar />
    //             <div className="flex-1 flex items-center justify-center">
    //                 <div className="text-center">
    //                     <p className="text-xl text-text-secondary mb-4">
    //                         Este perfil no está disponible
    //                     </p>
    //                     <Link href="/profesionales">
    //                         <Button>Ver Profesionales</Button>
    //                     </Link>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 py-8 md:px-6">
                <div className="max-w-6xl mx-auto">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Link href="/profesionales">
                            <Button variant="outline" size="sm">
                                ← Volver a Profesionales
                            </Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Professional Info */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Profile Header */}
                            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
                                <div className="flex items-start gap-6">
                                    <ProfessionalAvatar
                                        name={`${professional.firstName} ${professional.lastName}`}
                                        imageUrl={professional.profileImage}
                                        size="xl"
                                    />

                                    <div className="flex-1">
                                        <h1 className="text-3xl font-bold text-secondary mb-2">
                                            {professional.title} {professional.firstName} {professional.lastName}
                                        </h1>
                                        <p className="text-lg text-primary font-semibold mb-3">
                                            {professional.specialty}
                                        </p>

                                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                                <span className="font-semibold text-secondary">
                                                    {professional.rating?.toFixed(1)}
                                                </span>
                                                <span>({professional.reviewCount} reseñas)</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Video className="h-4 w-4 text-primary" />
                                                <span>Videollamada</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mt-4">
                                            <Button variant="outline" size="sm">
                                                <Heart className="h-4 w-4 mr-2" />
                                                Guardar
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Share2 className="h-4 w-4 mr-2" />
                                                Compartir
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* About */}
                            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
                                <h2 className="text-2xl font-bold text-secondary mb-4">Sobre mí</h2>
                                <p className="text-text-secondary leading-relaxed">
                                    {professional.bio || "Este profesional aún no ha agregado una biografía."}
                                </p>
                            </div>

                            {/* Specialties */}
                            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
                                <h2 className="text-2xl font-bold text-secondary mb-4">Especialidad</h2>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                        {professional.specialty}
                                    </span>
                                    <span className="px-4 py-2 bg-neutral-100 text-secondary rounded-full text-sm font-medium">
                                        {professional.category}
                                    </span>
                                </div>
                            </div>

                            {/* Reviews Section */}
                            <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
                                <h2 className="text-2xl font-bold text-secondary mb-6">Calificaciones y Reseñas</h2>

                                {/* Stats */}
                                <div className="mb-6">
                                    <ReviewStatsDisplay stats={reviewStats} />
                                </div>

                                {/* Reviews List */}
                                <div>
                                    <h3 className="text-lg font-semibold text-secondary mb-4">
                                        Comentarios de pacientes
                                    </h3>
                                    <ReviewList reviews={reviews} loading={loadingReviews} />
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Booking Card */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-6 space-y-4">

                                {/* Services List */}
                                {professional.services && professional.services.length > 0 && (
                                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
                                        <h3 className="font-bold text-secondary mb-4 text-base">Servicios disponibles</h3>
                                        <div className="space-y-2">
                                            {professional.services.map((service) => (
                                                <button
                                                    key={service.id}
                                                    onClick={() => setSelectedService(
                                                        selectedService?.id === service.id ? null : service
                                                    )}
                                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selectedService?.id === service.id
                                                        ? 'border-primary bg-primary/5 shadow-sm'
                                                        : 'border-neutral-100 hover:border-primary/40 hover:bg-neutral-50'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-semibold text-sm truncate ${selectedService?.id === service.id ? 'text-primary' : 'text-secondary'
                                                                }`}>
                                                                {selectedService?.id === service.id && (
                                                                    <span className="mr-1">✓</span>
                                                                )}
                                                                {service.name}
                                                            </p>
                                                            <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {service.duration} min
                                                            </p>
                                                            {service.description && (
                                                                <p className="text-xs text-text-secondary mt-1 line-clamp-2">{service.description}</p>
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-primary text-sm whitespace-nowrap">
                                                            ${Number(service.price).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        {selectedService && (
                                            <p className="text-xs text-text-muted mt-3 text-center">
                                                Clic nuevamente para deseleccionar
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Booking Card */}
                                <div className="bg-white rounded-2xl shadow-lg border border-neutral-100 p-6">
                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-4xl font-bold text-primary">
                                                ${selectedService
                                                    ? Number(selectedService.price).toLocaleString()
                                                    : professional.price.toLocaleString()}
                                            </span>
                                            <span className="text-text-secondary">/ sesión</span>
                                        </div>
                                        {selectedService && (
                                            <p className="text-xs text-primary font-medium mb-3">{selectedService.name}</p>
                                        )}

                                        <div className="space-y-3 text-sm mt-4">
                                            <div className="flex items-center gap-2 text-text-secondary">
                                                <Clock className="h-4 w-4 text-primary" />
                                                <span>Duración: {selectedService?.duration || professional.sessionDuration} minutos</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-text-secondary">
                                                <Video className="h-4 w-4 text-primary" />
                                                <span>Modalidad: Videollamada</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-text-secondary">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span>Confirmación inmediata</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleBooking}
                                        className="w-full text-lg h-12 mb-4"
                                        size="lg"
                                    >
                                        <Calendar className="h-5 w-5 mr-2" />
                                        Reservar Turno
                                    </Button>

                                    <p className="text-xs text-text-secondary text-center">
                                        Seleccioná tu horario preferido en el siguiente paso
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
