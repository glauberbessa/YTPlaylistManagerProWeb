"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Algo deu errado!</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                {error.message || "Ocorreu um erro inesperado."}
            </p>
            <div className="flex gap-4">
                <Button onClick={() => window.location.reload()} variant="outline">
                    Recarregar Página
                </Button>
                <Button onClick={() => reset()}>Tentar Novamente</Button>
            </div>
        </div>
    );
}
