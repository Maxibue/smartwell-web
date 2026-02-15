import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
    runTransaction,
    deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Review {
    id: string;
    professionalId: string;
    patientId: string;
    patientName: string;
    appointmentId: string;
    rating: number; // 1-5
    comment: string;
    createdAt: Timestamp;
    status: "pending" | "approved" | "rejected";
    moderatedBy?: string;
    moderatedAt?: Timestamp;
    moderationNote?: string;
    // Professional response
    professionalResponse?: string;
    professionalResponseDate?: Timestamp;
    hasResponse?: boolean;
}

export interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

/**
 * Create a new review for a professional
 */
export async function createReview(
    professionalId: string,
    patientId: string,
    patientName: string,
    appointmentId: string,
    rating: number,
    comment: string
): Promise<string> {
    try {
        // Validate rating
        if (rating < 1 || rating > 5) {
            throw new Error("La calificación debe estar entre 1 y 5");
        }

        // Check if appointment exists and is completed
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));
        if (!appointmentDoc.exists()) {
            throw new Error("La cita no existe");
        }

        const appointmentData = appointmentDoc.data();
        if (appointmentData.status !== "completed") {
            throw new Error("Solo puedes calificar citas completadas");
        }

        if (appointmentData.patientId !== patientId) {
            throw new Error("No tienes permiso para calificar esta cita");
        }

        // Check if review already exists for this appointment
        const existingReviewQuery = query(
            collection(db, "reviews"),
            where("appointmentId", "==", appointmentId)
        );
        const existingReviews = await getDocs(existingReviewQuery);
        if (!existingReviews.empty) {
            throw new Error("Ya has calificado esta cita");
        }

        // Create review
        const reviewData = {
            professionalId,
            patientId,
            patientName,
            appointmentId,
            rating,
            comment: comment.trim(),
            createdAt: Timestamp.now(),
            status: "pending" as const,
        };

        const reviewRef = await addDoc(collection(db, "reviews"), reviewData);

        // Update appointment with review reference
        await updateDoc(doc(db, "appointments", appointmentId), {
            reviewId: reviewRef.id,
            hasReview: true,
        });

        return reviewRef.id;
    } catch (error) {
        console.error("Error creating review:", error);
        throw error;
    }
}

/**
 * Get all reviews for a professional (approved only by default)
 */
export async function getProfessionalReviews(
    professionalId: string,
    includeAll: boolean = false,
    maxReviews: number = 50
): Promise<Review[]> {
    try {
        let q;
        if (includeAll) {
            q = query(
                collection(db, "reviews"),
                where("professionalId", "==", professionalId),
                orderBy("createdAt", "desc"),
                limit(maxReviews)
            );
        } else {
            q = query(
                collection(db, "reviews"),
                where("professionalId", "==", professionalId),
                where("status", "==", "approved"),
                orderBy("createdAt", "desc"),
                limit(maxReviews)
            );
        }

        const querySnapshot = await getDocs(q);
        const reviews: Review[] = [];

        querySnapshot.forEach((doc) => {
            reviews.push({
                id: doc.id,
                ...doc.data(),
            } as Review);
        });

        return reviews;
    } catch (error) {
        console.error("Error fetching reviews:", error);
        return [];
    }
}

/**
 * Get review statistics for a professional
 */
export async function getReviewStats(professionalId: string): Promise<ReviewStats> {
    try {
        const reviews = await getProfessionalReviews(professionalId, false, 1000);

        if (reviews.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            };
        }

        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0;

        reviews.forEach((review) => {
            totalRating += review.rating;
            ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
        });

        const averageRating = totalRating / reviews.length;

        return {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviews.length,
            ratingDistribution,
        };
    } catch (error) {
        console.error("Error calculating review stats:", error);
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }
}

/**
 * Update professional's rating in their profile
 */
export async function updateProfessionalRating(professionalId: string): Promise<void> {
    try {
        const stats = await getReviewStats(professionalId);

        await updateDoc(doc(db, "professionals", professionalId), {
            rating: stats.averageRating,
            reviewCount: stats.totalReviews,
            lastRatingUpdate: Timestamp.now(),
        });
    } catch (error) {
        console.error("Error updating professional rating:", error);
    }
}

/**
 * Moderate a review (approve or reject)
 */
export async function moderateReview(
    reviewId: string,
    status: "approved" | "rejected",
    moderatorId: string,
    moderationNote?: string
): Promise<void> {
    try {
        await runTransaction(db, async (transaction) => {
            const reviewRef = doc(db, "reviews", reviewId);
            const reviewDoc = await transaction.get(reviewRef);

            if (!reviewDoc.exists()) {
                throw new Error("Review no encontrada");
            }

            const reviewData = reviewDoc.data();

            // Update review status
            transaction.update(reviewRef, {
                status,
                moderatedBy: moderatorId,
                moderatedAt: Timestamp.now(),
                moderationNote: moderationNote || null,
            });

            // If approved, update professional rating
            if (status === "approved") {
                // This will be done after transaction completes
                setTimeout(() => {
                    updateProfessionalRating(reviewData.professionalId);
                }, 100);
            }
        });

        // Send notification to patient after transaction
        const reviewDoc = await getDoc(doc(db, "reviews", reviewId));
        if (reviewDoc.exists()) {
            const reviewData = reviewDoc.data();
            const { createNotification } = await import('./notifications');

            if (status === "approved") {
                await createNotification({
                    userId: reviewData.patientId,
                    type: 'review_approved',
                    title: 'Calificación Aprobada',
                    message: 'Tu calificación ha sido aprobada y ahora es visible públicamente.',
                    actionUrl: `/profesionales/${reviewData.professionalId}`,
                });
            } else if (status === "rejected") {
                await createNotification({
                    userId: reviewData.patientId,
                    type: 'review_rejected',
                    title: 'Calificación No Aprobada',
                    message: moderationNote || 'Tu calificación no cumple con nuestras políticas.',
                });
            }
        }
    } catch (error) {
        console.error("Error moderating review:", error);
        throw error;
    }
}

/**
 * Get pending reviews for moderation
 */
export async function getPendingReviews(maxReviews: number = 50): Promise<Review[]> {
    try {
        const q = query(
            collection(db, "reviews"),
            where("status", "==", "pending"),
            orderBy("createdAt", "desc"),
            limit(maxReviews)
        );

        const querySnapshot = await getDocs(q);
        const reviews: Review[] = [];

        querySnapshot.forEach((doc) => {
            reviews.push({
                id: doc.id,
                ...doc.data(),
            } as Review);
        });

        return reviews;
    } catch (error) {
        console.error("Error fetching pending reviews:", error);
        return [];
    }
}

/**
 * Delete a review (admin only)
 */
export async function deleteReview(reviewId: string): Promise<void> {
    try {
        const reviewDoc = await getDoc(doc(db, "reviews", reviewId));
        if (!reviewDoc.exists()) {
            throw new Error("Review no encontrada");
        }

        const reviewData = reviewDoc.data();
        await deleteDoc(doc(db, "reviews", reviewId));

        // Update professional rating
        await updateProfessionalRating(reviewData.professionalId);
    } catch (error) {
        console.error("Error deleting review:", error);
        throw error;
    }
}

/**
 * Check if user can review an appointment
 */
export async function canReviewAppointment(
    appointmentId: string,
    userId: string
): Promise<{ canReview: boolean; reason?: string }> {
    try {
        const appointmentDoc = await getDoc(doc(db, "appointments", appointmentId));

        if (!appointmentDoc.exists()) {
            return { canReview: false, reason: "La cita no existe" };
        }

        const appointmentData = appointmentDoc.data();

        if (appointmentData.patientId !== userId) {
            return { canReview: false, reason: "No tienes permiso para calificar esta cita" };
        }

        if (appointmentData.status !== "completed") {
            return { canReview: false, reason: "Solo puedes calificar citas completadas" };
        }

        if (appointmentData.hasReview) {
            return { canReview: false, reason: "Ya has calificado esta cita" };
        }

        return { canReview: true };
    } catch (error) {
        console.error("Error checking review eligibility:", error);
        return { canReview: false, reason: "Error al verificar elegibilidad" };
    }
}

/**
 * Add a professional's response to a review
 */
export async function addProfessionalResponse(
    reviewId: string,
    professionalId: string,
    response: string
): Promise<void> {
    try {
        // Validate response
        if (response.trim().length < 10) {
            throw new Error("La respuesta debe tener al menos 10 caracteres");
        }

        if (response.trim().length > 500) {
            throw new Error("La respuesta no puede exceder 500 caracteres");
        }

        // Get review
        const reviewDoc = await getDoc(doc(db, "reviews", reviewId));
        if (!reviewDoc.exists()) {
            throw new Error("Review no encontrada");
        }

        const reviewData = reviewDoc.data();

        // Verify professional owns this review
        if (reviewData.professionalId !== professionalId) {
            throw new Error("No tienes permiso para responder esta review");
        }

        // Verify review is approved
        if (reviewData.status !== "approved") {
            throw new Error("Solo puedes responder reviews aprobadas");
        }

        // Update review with response
        await updateDoc(doc(db, "reviews", reviewId), {
            professionalResponse: response.trim(),
            professionalResponseDate: Timestamp.now(),
            hasResponse: true,
        });
    } catch (error) {
        console.error("Error adding professional response:", error);
        throw error;
    }
}

/**
 * Report a review as inappropriate
 */
export async function reportReview(
    reviewId: string,
    reporterId: string,
    reason: string
): Promise<void> {
    try {
        // Create report
        await addDoc(collection(db, "reviewReports"), {
            reviewId,
            reporterId,
            reason: reason.trim(),
            createdAt: Timestamp.now(),
            status: "pending",
        });
    } catch (error) {
        console.error("Error reporting review:", error);
        throw error;
    }
}
