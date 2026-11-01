/** Step sizes in seconds, in increasing order. Each is mirrored into a −/+ pair. */
export const TRIM_NUDGE_STEPS = [0.1, 1];
export const SKIP_STEPS = [1, 10, 30];

/** Turns increasing steps into mirrored button rows: [−largest … −smallest] and [+smallest … +largest] */
export function mirrorSteps(steps: number[]): { decrease: number[]; increase: number[] } {
    return { decrease: steps.map((step) => -step).reverse(), increase: steps };
}

export function formatStep(step: number): string {
    return `${step > 0 ? "+" : "−"}${Math.abs(step)}s`;
}
