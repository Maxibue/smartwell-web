"use client";

import { Star } from "lucide-react";
import { ReviewStats } from "@/lib/reviews";

interface ReviewStatsDisplayProps {
    stats: ReviewStats;
}

export function ReviewStatsDisplay({ stats }: ReviewStatsDisplayProps) {
    if (stats.totalReviews === 0) {
        return (
            <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-6 text-center">
                <Star className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-text-secondary">
                    Este profesional aún no tiene calificaciones
                </p>
            </div>
        );
    }

    const maxCount = Math.max(...Object.values(stats.ratingDistribution));

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="flex items-start gap-6">
                {/* Average Rating */}
                <div className="text-center">
                    <div className="text-5xl font-bold text-secondary mb-2">
                        {stats.averageRating.toFixed(1)}
                    </div>
                    <div className="flex gap-0.5 justify-center mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`h-5 w-5 ${star <= Math.round(stats.averageRating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-neutral-300"
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-text-secondary">
                        {stats.totalReviews} {stats.totalReviews === 1 ? "calificación" : "calificaciones"}
                    </p>
                </div>

                {/* Rating Distribution */}
                <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                        const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
                        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

                        return (
                            <div key={rating} className="flex items-center gap-3">
                                <div className="flex items-center gap-1 w-12">
                                    <span className="text-sm font-medium text-secondary">{rating}</span>
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                </div>
                                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-400 rounded-full transition-all"
                                        style={{ width: `${barWidth}%` }}
                                    />
                                </div>
                                <span className="text-sm text-text-secondary w-12 text-right">
                                    {count}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
