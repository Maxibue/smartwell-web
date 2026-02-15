"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";
import { AlertTriangle, X } from "lucide-react";

interface ReportReviewModalProps {
    reviewId: string;
    onSubmit: (reason: string) => Promise<void>;
    onClose: () => void;
}

export function ReportReviewModal({
    onSubmit,
    onClose,
}: ReportReviewModalProps) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (reason.trim().length < 10) {
            setError("Por favor describe el motivo del reporte (mínimo 10 caracteres)");
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit(reason);
            setSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al enviar el reporte");
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">✓</span>
                    </div>
                    <h3 className="text-xl font-bold text-secondary mb-2">
                        Reporte Enviado
                    </h3>
                    <p className="text-text-secondary">
                        Gracias por tu reporte. Lo revisaremos pronto.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <h3 className="text-lg font-bold text-secondary">
                            Reportar Calificación
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-muted hover:text-secondary transition-colors"
                        disabled={submitting}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <p className="text-sm text-text-secondary mb-4">
                    Si consideras que esta calificación es inapropiada, ofensiva o falsa,
                    por favor cuéntanos el motivo.
                </p>

                <form onSubmit={handleSubmit}>
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Describe el motivo del reporte..."
                        rows={4}
                        className="resize-none mb-2"
                        maxLength={500}
                        disabled={submitting}
                    />

                    <p className="text-xs text-text-muted mb-4">
                        {reason.length}/500 caracteres
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting || reason.trim().length < 10}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {submitting ? "Enviando..." : "Enviar Reporte"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
