"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";

interface ReviewFormProps {
    professionalId: string;
    professionalName: string;
    appointmentId: string;
    onSubmit: (rating: number, comment: string) => Promise<void>;
    onCancel?: () => void;
}

export function ReviewForm({
    professionalName,
    onSubmit,
    onCancel,
}: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (rating === 0) {
            setError("Por favor selecciona una calificación");
            return;
        }

        if (comment.trim().length < 10) {
            setError("El comentario debe tener al menos 10 caracteres");
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit(rating, comment);
        } catch (err: any) {
            setError(err.message || "Error al enviar la calificación");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
            <div>
                <h3 className="text-xl font-bold text-secondary mb-2">
                    Calificar a {professionalName}
                </h3>
                <p className="text-sm text-text-secondary">
                    Tu opinión ayuda a otros usuarios a tomar mejores decisiones
                </p>
            </div>

            {/* Star Rating */}
            <div>
                <label className="block text-sm font-semibold text-secondary mb-3">
                    ¿Cómo fue tu experiencia?
                </label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform hover:scale-110"
                        >
                            <Star
                                className={`h-10 w-10 ${star <= (hoverRating || rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-neutral-300"
                                    }`}
                            />
                        </button>
                    ))}
                </div>
                {rating > 0 && (
                    <p className="text-sm text-text-secondary mt-2">
                        {rating === 1 && "Muy insatisfecho"}
                        {rating === 2 && "Insatisfecho"}
                        {rating === 3 && "Neutral"}
                        {rating === 4 && "Satisfecho"}
                        {rating === 5 && "Muy satisfecho"}
                    </p>
                )}
            </div>

            {/* Comment */}
            <div>
                <label htmlFor="comment" className="block text-sm font-semibold text-secondary mb-2">
                    Cuéntanos más sobre tu experiencia
                </label>
                <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe tu experiencia con este profesional..."
                    rows={4}
                    className="resize-none"
                    maxLength={500}
                />
                <p className="text-xs text-text-muted mt-1 text-right">
                    {comment.length}/500 caracteres
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-end">
                {onCancel && (
                    <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                        Cancelar
                    </Button>
                )}
                <Button type="submit" disabled={submitting || rating === 0}>
                    {submitting ? "Enviando..." : "Enviar Calificación"}
                </Button>
            </div>
        </form>
    );
}
