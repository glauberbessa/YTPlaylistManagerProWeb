export function calculateTransferCost(videoCount: number): number {
    // Cada transferência = insert (50) + delete (50) = 100 unidades
    return videoCount * 100;
}

export function calculateAssignCost(videoCount: number): number {
    // Cada atribuição = insert (50) = 50 unidades
    return videoCount * 50;
}

export function getMaxTransfersAvailable(remainingUnits: number): number {
    return Math.floor(remainingUnits / 100);
}

export function getMaxAssignsAvailable(remainingUnits: number): number {
    return Math.floor(remainingUnits / 50);
}
