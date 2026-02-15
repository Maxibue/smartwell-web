/**
 * Professional Categories Configuration
 * Single source of truth for all professional specialties/areas
 */

import { Brain, Heart, Users, Zap } from 'lucide-react';

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
            'Psicología Clínica',
            'Psicoterapia',
            'Terapia Cognitivo-Conductual',
            'Psicoanálisis',
            'Terapia de Pareja',
            'Terapia Familiar',
            'Psicología Infantil',
            'Psiquiatría',
            'Counseling',
            'Mindfulness',
        ],
    },
    {
        id: 'nutricion-integral',
        name: 'Nutrición Integral',
        description: 'Clínica, deportiva, embarazo',
        icon: 'Heart',
        color: 'secondary',
        subcategories: [
            'Nutrición Clínica',
            'Nutrición Deportiva',
            'Nutrición en el Embarazo',
            'Nutrición Pediátrica',
            'Nutrición Vegetariana/Vegana',
            'Nutrición Oncológica',
            'Educación Alimentaria',
            'Trastornos de la Conducta Alimentaria',
        ],
    },
    {
        id: 'maternidad-crianza',
        name: 'Maternidad y Crianza',
        description: 'Lactancia, sueño, puericultura',
        icon: 'Users',
        color: 'accent',
        subcategories: [
            'Asesoría de Lactancia',
            'Doula',
            'Puericultura',
            'Crianza Respetuosa',
            'Sueño Infantil',
            'Preparación para el Parto',
            'Postparto',
            'Estimulación Temprana',
        ],
    },
    {
        id: 'desarrollo-personal-profesional',
        name: 'Desarrollo Personal y Profesional',
        description: 'Coaching, carrera, liderazgo',
        icon: 'Zap',
        color: 'tertiary',
        subcategories: [
            'Coaching Personal',
            'Coaching Profesional',
            'Coaching de Carrera',
            'Liderazgo',
            'Desarrollo de Habilidades',
            'Orientación Vocacional',
            'Mentoring',
            'Inteligencia Emocional',
        ],
    },
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
