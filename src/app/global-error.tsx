"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("Global Error:", error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">
                        Erro Crítico no Sistema
                    </h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        {error.message || "Ocorreu um erro irrecuperável."}
                    </p>
                    <div className="flex gap-4">
                        <Button onClick={() => window.location.reload()} variant="outline">
                            Recarregar Página
                        </Button>
                        <Button onClick={() => reset()}>Tentar Novamente</Button>
                    </div>
                </div>
            </body>
        </html>
    );
}
