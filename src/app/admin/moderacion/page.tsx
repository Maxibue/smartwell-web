"use client";

import { useState, useEffect } from "react";
import { Review, getPendingReviews, moderateReview } from "@/lib/reviews";
import { ReviewList } from "@/components/ReviewList";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ModerationPanel() {
    const { user } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [moderating, setModerating] = useState<string | null>(null);
    const [moderationNote, setModerationNote] = useState("");
    const [selectedReview, setSelectedReview] = useState<string | null>(null);

    useEffect(() => {
        loadPendingReviews();
    }, []);

    const loadPendingReviews = async () => {
        try {
            setLoading(true);
            const pendingReviews = await getPendingReviews();
            setReviews(pendingReviews);
        } catch (error) {
            console.error("Error loading pending reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleModerate = async (reviewId: string, status: "approved" | "rejected") => {
        if (!user) return;

        try {
            setModerating(reviewId);
            await moderateReview(
                reviewId,
                status,
                user.uid,
                status === "rejected" ? moderationNote : undefined
            );

            // Remove from list
            setReviews(reviews.filter((r) => r.id !== reviewId));
            setSelectedReview(null);
            setModerationNote("");
        } catch (error) {
            console.error("Error moderating review:", error);
            alert("Error al moderar la calificación");
        } finally {
            setModerating(null);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-secondary mb-2">Acceso Denegado</h2>
                    <p className="text-text-secondary">
                        Debes iniciar sesión como administrador para acceder a este panel
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-secondary mb-2">
                        Panel de Moderación de Reviews
                    </h1>
                    <p className="text-text-secondary">
                        Revisa y aprueba las calificaciones antes de publicarlas
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-secondary mb-2">
                            ¡Todo al día!
                        </h3>
                        <p className="text-text-secondary">
                            No hay calificaciones pendientes de moderación
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="bg-white rounded-xl border border-neutral-200 p-6"
                            >
                                {/* Review Content */}
                                <div className="mb-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold text-secondary">
                                                {review.patientName}
                                            </h4>
                                            <p className="text-sm text-text-secondary">
                                                Calificación: {review.rating}/5 ⭐
                                            </p>
                                        </div>
                                        <span className="text-xs text-text-muted">
                                            {review.createdAt.toDate().toLocaleDateString("es-AR")}
                                        </span>
                                    </div>
                                    <p className="text-text-secondary leading-relaxed bg-neutral-50 p-4 rounded-lg">
                                        {review.comment}
                                    </p>
                                </div>

                                {/* Moderation Actions */}
                                {selectedReview === review.id ? (
                                    <div className="space-y-3 border-t pt-4">
                                        <Input
                                            placeholder="Nota de moderación (opcional para aprobación, requerida para rechazo)"
                                            value={moderationNote}
                                            onChange={(e) => setModerationNote(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleModerate(review.id, "approved")}
                                                disabled={moderating === review.id}
                                                className="flex-1"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                {moderating === review.id ? "Aprobando..." : "Aprobar"}
                                            </Button>
                                            <Button
                                                onClick={() => handleModerate(review.id, "rejected")}
                                                disabled={moderating === review.id || !moderationNote.trim()}
                                                variant="outline"
                                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                {moderating === review.id ? "Rechazando..." : "Rechazar"}
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setSelectedReview(null);
                                                    setModerationNote("");
                                                }}
                                                variant="outline"
                                                disabled={moderating === review.id}
                                            >
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2 border-t pt-4">
                                        <Button
                                            onClick={() => setSelectedReview(review.id)}
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                        >
                                            Moderar
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
