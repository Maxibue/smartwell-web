

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Navbar } from "@/components/layout/Navbar";
import { Search, MapPin, Star, Filter } from "lucide-react";
import Link from "next/link";
import { ProfessionalAvatar } from "@/components/ui/ProfessionalAvatar";

// Firebase Imports
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

import { useSearchParams } from "next/navigation";

// Categories
import { PROFESSIONAL_CATEGORIES, getCategoryName } from "@/lib/categories";

interface Professional {
    id: string;
    name: string;
    specialty: string;
    category: string;
    rating: number;
    reviews: number;
    price: number;
    image: string;
    tags: string[];
    nextAvailable: string;
    status: string;
}

export default function SearchPage() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get("search") || "";
    const initialCategory = searchParams.get("category") || "Todos";

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedSpecialty, setSelectedSpecialty] = useState(initialCategory);
    const [professionals, setProfessionals] = useState<Professional[]>([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfessionals = async () => {
            try {
                // Fetch all/approved professionals
                // Ideally: query(collection(db, "professionals"), where("status", "==", "approved"));
                // But for mixed data (legacy without status), we fetch all and filter client side.
                const querySnapshot = await getDocs(collection(db, "professionals"));
                const fetchedPros: Professional[] = [];


                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const status = data.status; // Strict check: must be explicitly approved

                    if (status === "approved") {
                        fetchedPros.push({
                            id: doc.id,
                            name: data.fullName || data.name || "Profesional",
                            specialty: data.specialty || "General",
                            category: data.category || "salud-mental",
                            rating: data.rating || 5.0,
                            reviews: data.reviews || 0,
                            price: data.price || 0,
                            image: data.image || data.profileImage || null,
                            tags: data.tags || [],
                            nextAvailable: "Consultar",
                            status: status
                        });
                    }
                });

                // Mock Data (Always Approved) - Using centralized category IDs
                const mockIds = new Set(fetchedPros.map(p => p.id));
                const mocks: Professional[] = [
                    {
                        id: "mock1",
                        name: "Lic. Mariana Costa",
                        specialty: "Psicóloga Clínica",
                        category: "salud-mental",
                        rating: 4.9,
                        reviews: 32,
                        price: 45000,
                        image: "https://i.pravatar.cc/150?u=mock_psy",
                        tags: ["Psicoterapia individual", "Terapia cognitivo-conductual", "Ansiedad"],
                        nextAvailable: "Mañana 14:00",
                        status: "approved"
                    },
                    {
                        id: "mock2",
                        name: "Lic. Lucas Funes",
                        specialty: "Nutricionista Deportivo",
                        category: "nutricion-integral",
                        rating: 4.8,
                        reviews: 18,
                        price: 35000,
                        image: "https://i.pravatar.cc/150?u=mock_nutri",
                        tags: ["Nutrición deportiva", "Descenso de peso", "Hábitos"],
                        nextAvailable: "Hoy 18:30",
                        status: "approved"
                    },
                    {
                        id: "mock3",
                        name: "Lic. Sofía Mendez",
                        specialty: "Puericultora & Psicóloga",
                        category: "maternidad-crianza",
                        rating: 5.0,
                        reviews: 15,
                        price: 40000,
                        image: "https://i.pravatar.cc/150?u=mock_mat",
                        tags: ["Lactancia", "Sueño infantil", "Crianza respetuosa"],
                        nextAvailable: "Jueves 10:00",
                        status: "approved"
                    },
                    {
                        id: "mock4",
                        name: "Lic. Javier Ortiz",
                        specialty: "Psicólogo de Pareja",
                        category: "salud-mental",
                        rating: 4.7,
                        reviews: 21,
                        price: 48000,
                        image: "https://i.pravatar.cc/150?u=mock_couple",
                        tags: ["Terapia de pareja", "Conflictos", "Comunicación"],
                        nextAvailable: "Viernes 16:00",
                        status: "approved"
                    },
                    {
                        id: "mock5",
                        name: "Lic. Roberto Diaz",
                        specialty: "Coach Ontológico",
                        category: "desarrollo-personal-profesional",
                        rating: 4.9,
                        reviews: 28,
                        price: 50000,
                        image: "https://i.pravatar.cc/150?u=mock_coach",
                        tags: ["Coaching profesional", "Liderazgo", "Productividad"],
                        nextAvailable: "Lunes 09:00",
                        status: "approved"
                    }
                ];

                mocks.forEach(mock => {
                    if (!mockIds.has(mock.id)) {
                        fetchedPros.push(mock);
                    }
                });

                setProfessionals(fetchedPros);
            } catch (error) {
                console.error("Error fetching professionals:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfessionals();
    }, []);

    const filteredPros = professionals.filter(pro =>
        (selectedSpecialty === "Todos" || pro.category === selectedSpecialty) &&
        (pro.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pro.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pro.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <Navbar />

            {/* Header / Search Bar */}
            <div className="bg-white border-b border-neutral-200 sticky top-16 z-30 shadow-sm">
                <div className="container mx-auto px-4 py-4 md:px-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative w-full max-w-xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                            <Input
                                placeholder="Buscar especialista, síntoma o tema..."
                                className="pl-10 h-12 bg-neutral-50 border-neutral-200 focus:bg-white transition-colors"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                            <button
                                onClick={() => setSelectedSpecialty("Todos")}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${(selectedSpecialty === "Todos")
                                    ? "bg-secondary text-white border-secondary"
                                    : "bg-white text-text-secondary border-neutral-200 hover:border-primary hover:text-primary"
                                    }`}
                            >
                                Todos
                            </button>
                            {PROFESSIONAL_CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedSpecialty(cat.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${(selectedSpecialty === cat.id)
                                        ? "bg-secondary text-white border-secondary"
                                        : "bg-white text-text-secondary border-neutral-200 hover:border-primary hover:text-primary"
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                            <Button variant="outline" size="icon" className="shrink-0 ml-auto md:ml-2">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="flex-1 container mx-auto px-4 py-8 md:px-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-secondary">
                        {filteredPros.length} Profesionales encontrados
                    </h2>
                    <div className="text-sm text-text-secondary">
                        Ordenado por: <span className="font-medium text-secondary">Recomendados</span>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPros.map((pro) => (
                            <Link href={`/profesionales/${pro.id}`} key={pro.id} className="block group">
                                <div className="bg-white rounded-xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                    <div className="p-6">
                                        <div className="flex items-start gap-4">
                                            <ProfessionalAvatar name={pro.name} imageUrl={pro.image} size="lg" className="ring-2 ring-neutral-100" />
                                            <div>
                                                <h3 className="font-bold text-lg text-secondary group-hover:text-primary transition-colors">{pro.name}</h3>
                                                <p className="text-primary font-medium text-sm">{pro.specialty}</p>
                                                <div className="flex items-center gap-1 text-xs text-text-secondary mt-1">
                                                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                                    <span className="font-bold text-secondary">{pro.rating}</span>
                                                    <span>({pro.reviews} reseñas)</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {pro.tags.map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-neutral-50 text-text-secondary text-xs rounded-md border border-neutral-100">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-text-muted uppercase font-semibold">Valor sesión</p>
                                                <p className="text-lg font-bold text-secondary">${pro.price}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded inline-block mb-1">
                                                    {pro.nextAvailable}
                                                </p>
                                                <span className="text-xs text-primary block group-hover:underline">Ver perfil &rarr;</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

