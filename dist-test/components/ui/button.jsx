"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = void 0;
const React = __importStar(require("react"));
const utils_1 = require("../../lib/utils");
const Button = React.forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (<button className={(0, utils_1.cn)("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background", {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === 'default',
            "border border-input hover:bg-accent hover:text-accent-foreground": variant === 'outline',
            "hover:bg-accent hover:text-accent-foreground": variant === 'ghost',
        }, {
            "h-10 py-2 px-4": size === 'default',
            "h-8 px-3 text-xs": size === 'sm',
            "h-12 px-8": size === 'lg',
        }, className)} ref={ref} {...props}/>);
});
exports.Button = Button;
Button.displayName = "Button";
//# sourceMappingURL=button.jsx.map