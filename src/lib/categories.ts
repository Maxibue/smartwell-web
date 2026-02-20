/**
 * Professional Categories Configuration
 * Single source of truth for all professional specialties/areas
 */

import { Brain, Apple, Activity, Users, Target, Sparkles, Heart, Zap } from 'lucide-react';

export interface ProfessionalCategory {
    id: string;
    name: string;
    description: string;
    icon: string; // Icon name from lucide-react
    color: string; // Tailwind color class
    subcategories?: string[];
}

/**
 * Main professional categories
 * These should match exactly with the categories shown in the UI
 */
export const PROFESSIONAL_CATEGORIES: ProfessionalCategory[] = [
    {
        id: 'salud-mental',
        name: 'Salud Mental',
        description: 'Terapia, emociones, vínculos',
        icon: 'Brain',
        color: 'primary',
        subcategories: [
            "Ansiedad y estrés",
            "Depresión y estado de ánimo",
            "Terapia individual",
            "Terapia de pareja",
            "Duelo y crisis personales",
            "Adolescencia e infancia"
        ]
    },
    {
        id: 'nutricion',
        name: 'Nutrición',
        description: 'Clínica, deportiva, alimentación',
        icon: 'Apple',
        color: 'secondary',
        subcategories: [
            "Alimentación saludable",
            "Nutrición deportiva",
            "Reeducación alimentaria",
            "Relación con la comida",
            "Plan nutricional personalizado"
        ]
    },
    {
        id: 'movimiento',
        name: 'Movimiento y Salud Física',
        description: 'Entrenamiento, yoga, rehabilitación',
        icon: 'Activity',
        color: 'primary',
        subcategories: [
            "Entrenamiento personalizado",
            "Movilidad y postura",
            "Rehabilitación funcional",
            "Yoga terapéutico",
            "Bienestar corporal integral"
        ]
    },
    {
        id: 'maternidad',
        name: 'Maternidad y Familia',
        description: 'Lactancia, sueño, crianza',
        icon: 'Users',
        color: 'accent',
        subcategories: [
            "Lactancia",
            "Sueño infantil",
            "Orientación para padres",
            "Crianza y vínculos familiares"
        ]
    },
    {
        id: 'coaching',
        name: 'Coaching',
        description: 'Carrera, liderazgo, desarrollo',
        icon: 'Target',
        color: 'tertiary',
        subcategories: [
            "Desarrollo de carrera",
            "Transición laboral",
            "Liderazgo",
            "Coaching ejecutivo",
            "Orientación vocacional"
        ]
    },
    {
        id: 'espiritualidad',
        name: 'Espiritualidad y Propósito',
        description: 'Mindfulness, meditación, propósito',
        icon: 'Sparkles',
        color: 'primary',
        subcategories: [
            "Búsqueda de propósito",
            "Acompañamiento espiritual",
            "Meditación y mindfulness",
            "Desarrollo personal profundo"
        ]
    }
];

/**
 * Get all category IDs
 */
export function getCategoryIds(): string[] {
    return PROFESSIONAL_CATEGORIES.map((cat) => cat.id);
}

/**
 * Get category by ID
 */
export function getCategoryById(id: string): ProfessionalCategory | undefined {
    return PROFESSIONAL_CATEGORIES.find((cat) => cat.id === id);
}

/**
 * Get category name by ID
 */
export function getCategoryName(id: string): string {
    const category = getCategoryById(id);
    return category ? category.name : id;
}

/**
 * Get all subcategories for a category
 */
export function getSubcategories(categoryId: string): string[] {
    const category = getCategoryById(categoryId);
    return category?.subcategories || [];
}

/**
 * Get all subcategories flattened
 */
export function getAllSubcategories(): string[] {
    return PROFESSIONAL_CATEGORIES.flatMap((cat) => cat.subcategories || []);
}

/**
 * Validate if a category ID is valid
 */
export function isValidCategory(id: string): boolean {
    return PROFESSIONAL_CATEGORIES.some((cat) => cat.id === id);
}

/**
 * Validate if a subcategory exists in any category
 */
export function isValidSubcategory(subcategory: string): boolean {
    return getAllSubcategories().includes(subcategory);
}

/**
 * Get category for a given subcategory
 */
export function getCategoryForSubcategory(subcategory: string): ProfessionalCategory | undefined {
    return PROFESSIONAL_CATEGORIES.find((cat) =>
        cat.subcategories?.includes(subcategory)
    );
}

/**
 * Format category for display
 */
export function formatCategoryDisplay(categoryId: string, subcategory?: string): string {
    const category = getCategoryById(categoryId);
    if (!category) return categoryId;

    if (subcategory) {
        return `${category.name} - ${subcategory}`;
    }

    return category.name;
}
