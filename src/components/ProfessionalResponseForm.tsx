"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { Textarea } from "./ui/Textarea";
import { MessageSquare, X } from "lucide-react";

interface ProfessionalResponseFormProps {
    reviewId: string;
    onSubmit: (response: string) => Promise<void>;
    onCancel: () => void;
}

export function ProfessionalResponseForm({
    reviewId,
    onSubmit,
    onCancel,
}: ProfessionalResponseFormProps) {
    const [response, setResponse] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (response.trim().length < 10) {
            setError("La respuesta debe tener al menos 10 caracteres");
            return;
        }

        try {
            setSubmitting(true);
            await onSubmit(response);
            setResponse("");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error al enviar la respuesta");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <h4 className="text-sm font-semibold text-secondary">
                        Responder a esta calificación
                    </h4>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-text-muted hover:text-secondary transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Escribe tu respuesta..."
                rows={3}
                className="resize-none mb-2"
                maxLength={500}
                disabled={submitting}
            />

            <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">
                    {response.length}/500 caracteres
                </p>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={submitting || response.trim().length < 10}
                    >
                        {submitting ? "Enviando..." : "Enviar Respuesta"}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="mt-2 text-xs text-red-600">
                    {error}
                </div>
            )}
        </form>
    );
}
