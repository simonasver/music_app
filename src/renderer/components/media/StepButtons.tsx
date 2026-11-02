import { Button } from "@/components/ui/button";
import { formatStep, mirrorSteps } from "@/lib/steps";

interface StepButtonsProps {
    /** Step sizes in increasing order */
    steps: number[];
    direction: "decrease" | "increase";
    onStep: (step: number) => void;
    disabled: boolean;
}

export function StepButtons({ steps, direction, onStep, disabled }: StepButtonsProps) {
    const mirrored = mirrorSteps(steps)[direction];

    return (
        <>
            {mirrored.map((step) => (
                <Button
                    key={step}
                    variant="outline"
                    size="sm"
                    className="px-2 tabular-nums"
                    onClick={() => onStep(step)}
                    disabled={disabled}
                >
                    {formatStep(step)}
                </Button>
            ))}
        </>
    );
}
