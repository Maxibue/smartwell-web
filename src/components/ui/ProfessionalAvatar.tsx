/**
 * ProfessionalAvatar
 * Muestra la imagen del profesional si existe, o sus iniciales (Nombre + Apellido)
 * sobre un fondo de color generado a partir del nombre.
 */

interface ProfessionalAvatarProps {
    name: string;
    imageUrl?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

/** Genera un color de fondo consistente a partir del nombre */
function getColorFromName(name: string): string {
    const colors = [
        'bg-teal-500',
        'bg-emerald-500',
        'bg-cyan-500',
        'bg-blue-500',
        'bg-indigo-500',
        'bg-violet-500',
        'bg-purple-500',
        'bg-rose-500',
        'bg-orange-500',
        'bg-amber-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

/** Extrae las iniciales: primera letra del primer nombre + primera letra del apellido */
function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    // Primer nombre + último apellido
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const SIZE_CLASSES = {
    sm: { container: 'h-8 w-8', text: 'text-xs' },
    md: { container: 'h-10 w-10', text: 'text-sm' },
    lg: { container: 'h-16 w-16', text: 'text-xl' },
    xl: { container: 'h-24 w-24', text: 'text-3xl' },
};

export function ProfessionalAvatar({
    name,
    imageUrl,
    size = 'md',
    className = '',
}: ProfessionalAvatarProps) {
    const { container, text } = SIZE_CLASSES[size];
    const initials = getInitials(name);
    const bgColor = getColorFromName(name);

    // Si hay imagen válida (no vacía, no ui-avatars, no pravatar)
    const hasRealImage =
        imageUrl &&
        imageUrl.trim() !== '' &&
        !imageUrl.includes('ui-avatars.com') &&
        !imageUrl.includes('pravatar.cc');

    if (hasRealImage) {
        return (
            <img
                src={imageUrl!}
                alt={name}
                className={`${container} rounded-full object-cover ${className}`}
                onError={(e) => {
                    // Si la imagen falla, mostrar iniciales
                    (e.target as HTMLImageElement).style.display = 'none';
                }}
            />
        );
    }

    return (
        <div
            className={`${container} ${bgColor} rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
            title={name}
        >
            <span className={`${text} font-bold text-white select-none`}>
                {initials}
            </span>
        </div>
    );
}
