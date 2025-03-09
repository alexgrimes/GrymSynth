"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.badgeVariants = exports.Badge = void 0;
const utils_1 = require("@/lib/utils");
const class_variance_authority_1 = require("class-variance-authority");
const react_1 = require("react");
const badgeVariants = (0, class_variance_authority_1.cva)("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
    variants: {
        variant: {
            default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
            secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
            outline: "text-foreground",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});
exports.badgeVariants = badgeVariants;
const Badge = (0, react_1.forwardRef)(({ className, variant, ...props }, ref) => {
    return (<div className={(0, utils_1.cn)(badgeVariants({ variant }), className)} ref={ref} {...props}/>);
});
exports.Badge = Badge;
Badge.displayName = "Badge";
//# sourceMappingURL=badge.jsx.map