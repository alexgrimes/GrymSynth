import { VariantProps } from "class-variance-authority";
import { HTMLAttributes } from "react";
declare const badgeVariants: (props?: ({
    variant?: "default" | "outline" | "secondary" | null | undefined;
} & import("class-variance-authority/dist/types").ClassProp) | undefined) => string;
export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
}
declare const Badge: import("react").ForwardRefExoticComponent<BadgeProps & import("react").RefAttributes<HTMLDivElement>>;
export { Badge, badgeVariants };
