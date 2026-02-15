"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Loader2, ArrowRight, Heart, Brain, Users, Zap, Check } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { PROFESSIONAL_CATEGORIES, getSubcategories } from "@/lib/categories";

export default function WizardPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [selections, setSelections] = useState({
        category: "",
        topic: "",
        preference: ""
    });
    const [isProcessing, setIsProcessing] = useState(false);

    // Step 1: Broad Category - Using centralized categories
    const categories = PROFESSIONAL_CATEGORIES.map(cat => {
        // Map icon names to actual icon components
        const iconMap: Record<string, any> = {
            'Brain': <Brain className="h-6 w-6" />,
            'Heart': <Heart className="h-6 w-6" />,
            'Users': <Users className="h-6 w-6" />,
            'Zap': <Zap className="h-6 w-6" />,
        };

        return {
            id: cat.id,
            label: cat.name,
            icon: iconMap[cat.icon] || <Brain className="h-6 w-6" />,
            desc: cat.description
        };
    });

    // Step 2: Specific Topics based on Category - Using subcategories from config
    const getTopicsForCategory = (categoryId: string): string[] => {
        return getSubcategories(categoryId);
    };

    const handleCategorySelect = (catId: string) => {
        setSelections({ ...selections, category: catId });
        setStep(2);
    };

    const handleTopicSelect = (topic: string) => {
        setSelections({ ...selections, topic: topic });
        setStep(3); // Go to preferences or processing? Let's go to processing for simplicity as per user request flow
        startMatching();
    };

    const startMatching = () => {
        setIsProcessing(true);
        // Simulate "Intelligent Matching" delay
        setTimeout(() => {
            // Redirect to professionals page with filters
            const params = new URLSearchParams();
            if (selections.category) params.set("category", selections.category);
            // We'll pass the topic as a search term to fuzzy match tags/names
            // Note: selections.topic isn't set in state immediately if we call startMatching right after setSelections in the same render cycle without effects. 
            // Better to handle this in a useEffect or ensure we pass the value directly.
        }, 2000);
    };

    // Correct way to handle the flow with state updates
    useEffect(() => {
        if (step === 3 && isProcessing) {
            const timer = setTimeout(() => {
                const params = new URLSearchParams();
                if (selections.category) params.set("category", selections.category);
                if (selections.topic) params.set("search", selections.topic);

                router.push(`/profesionales?${params.toString()}`);
            }, 3000); // 3 seconds matching animation
            return () => clearTimeout(timer);
        }
    }, [step, isProcessing, selections, router]);


    return (
        <div className="min-h-screen bg-neutral-50 flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 md:px-6 flex flex-col items-center justify-center max-w-2xl">

                {/* Progress Indicator */}
                <div className="w-full h-2 bg-neutral-200 rounded-full mb-12 overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                {step === 1 && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4 text-center">
                            1. Contanos qué te pasa
                        </h1>
                        <p className="text-text-secondary text-center mb-8 text-lg">
                            Seleccioná el área en la que te gustaría recibir apoyo hoy.
                        </p>
                        <div className="grid md:grid-cols-2 gap-4">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategorySelect(cat.id)}
                                    className="flex flex-col items-center p-6 bg-white border border-neutral-100 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all group text-center"
                                >
                                    <div className="mb-4 p-3 bg-neutral-50 rounded-full text-primary group-hover:scale-110 transition-transform">
                                        {cat.icon}
                                    </div>
                                    <h3 className="font-bold text-secondary text-lg mb-2">{cat.label}</h3>
                                    <p className="text-sm text-text-secondary">{cat.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <button
                            onClick={() => setStep(1)}
                            className="text-sm text-text-secondary hover:text-primary mb-6 flex items-center"
                        >
                            ← Volver
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold text-secondary mb-4 text-center">
                            ¿Hay algún tema específico?
                        </h1>
                        <p className="text-text-secondary text-center mb-8">
                            Esto nos ayuda a encontrar al experto ideal para vos.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {getTopicsForCategory(selections.category)?.map((topic: string) => (
                                <button
                                    key={topic}
                                    onClick={() => handleTopicSelect(topic)}
                                    className="px-6 py-3 bg-white border border-neutral-200 rounded-xl text-secondary font-medium hover:border-primary hover:bg-primary/5 hover:text-primary transition-all shadow-sm"
                                >
                                    {topic}
                                </button>
                            ))}
                            <button
                                onClick={() => handleTopicSelect("Otro")}
                                className="px-6 py-3 bg-transparent border border-transparent rounded-xl text-text-secondary hover:text-primary transition-all"
                            >
                                Otro / No estoy seguro
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="w-full text-center animate-in fade-in zoom-in duration-500">
                        <div className="mb-8 relative inline-flex justify-center items-center">
                            {/* Pulse Effect */}
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-75"></div>
                            <div className="relative bg-white p-6 rounded-full shadow-lg border-2 border-primary/20">
                                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-secondary mb-2">2. Matching Inteligente</h2>
                        <p className="text-text-secondary text-lg animate-pulse">
                            Analizando tu perfil...
                        </p>

                        <div className="mt-8 space-y-3 max-w-xs mx-auto text-left">
                            <div className="flex items-center gap-3 text-sm text-text-secondary opacity-0 animate-in fade-in slide-in-from-bottom-2 fill-mode-forwards" style={{ animationDelay: '500ms' }}>
                                <Check className="h-4 w-4 text-green-500" /> Verificando disponibilidad
                            </div>
                            <div className="flex items-center gap-3 text-sm text-text-secondary opacity-0 animate-in fade-in slide-in-from-bottom-2 fill-mode-forwards" style={{ animationDelay: '1500ms' }}>
                                <Check className="h-4 w-4 text-green-500" /> Filtrando por especialidad
                            </div>
                            <div className="flex items-center gap-3 text-sm text-text-secondary opacity-0 animate-in fade-in slide-in-from-bottom-2 fill-mode-forwards" style={{ animationDelay: '2500ms' }}>
                                <Check className="h-4 w-4 text-green-500" /> Encontrando tu match ideal
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
}
