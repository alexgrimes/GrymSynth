import * as React from "react";
export interface SliderProps {
    value: number[];
    min: number;
    max: number;
    step: number;
    onValueChange: (value: number[]) => void;
    className?: string;
    disabled?: boolean;
    id?: string;
    "aria-label"?: string;
}
declare const Slider: React.ForwardRefExoticComponent<SliderProps & React.RefAttributes<HTMLInputElement>>;
export { Slider };
