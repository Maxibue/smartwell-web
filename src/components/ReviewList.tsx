"use client";

import { Star, Clock } from "lucide-react";
import { Review } from "@/lib/reviews";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { es } from "date-fns/locale/es";

interface ReviewListProps {
    reviews: Review[];
    loading?: boolean;
}

export function ReviewList({ reviews, loading }: ReviewListProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-neutral-200 rounded-full" />
                            <div className="flex-1 space-y-3">
                                <div className="h-4 bg-neutral-200 rounded w-1/4" />
                                <div className="h-3 bg-neutral-200 rounded w-1/3" />
                                <div className="h-16 bg-neutral-200 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-12 text-center">
                <Star className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-lg font-semibold text-secondary mb-1">
                    Aún no hay calificaciones
                </p>
                <p className="text-sm text-text-secondary">
                    Sé el primero en calificar a este profesional
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <div
                    key={review.id}
                    className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-sm transition-shadow"
                >
                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-lg font-bold text-primary">
                                {review.patientName.charAt(0).toUpperCase()}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <div>
                                    <h4 className="font-semibold text-secondary">
                                        {review.patientName}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        {/* Stars */}
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`h-4 w-4 ${star <= review.rating
                                                        ? "fill-yellow-400 text-yellow-400"
                                                        : "text-neutral-300"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-text-secondary">
                                            {review.rating}/5
                                        </span>
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-1 text-xs text-text-muted">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                        {formatDistanceToNow(review.createdAt.toDate(), {
                                            addSuffix: true,
                                            locale: es,
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Comment */}
                            <p className="text-text-secondary leading-relaxed">
                                {review.comment}
                            </p>

                            {/* Professional Response */}
                            {review.hasResponse && review.professionalResponse && (
                                <div className="mt-4 pl-4 border-l-2 border-primary/30 bg-primary/5 p-4 rounded-r-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                            <span className="text-xs font-bold text-white">P</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-secondary">
                                                Respuesta del profesional
                                            </p>
                                            {review.professionalResponseDate && (
                                                <p className="text-xs text-text-muted">
                                                    {formatDistanceToNow(review.professionalResponseDate.toDate(), {
                                                        addSuffix: true,
                                                        locale: es,
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-secondary leading-relaxed">
                                        {review.professionalResponse}
                                    </p>
                                </div>
                            )}

                            {/* Status Badge (for moderation view) */}
                            {review.status === "pending" && (
                                <div className="mt-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Pendiente de moderación
                                    </span>
                                </div>
                            )}
                            {review.status === "rejected" && (
                                <div className="mt-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Rechazada
                                    </span>
                                    {review.moderationNote && (
                                        <p className="text-xs text-red-600 mt-1">
                                            Motivo: {review.moderationNote}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
