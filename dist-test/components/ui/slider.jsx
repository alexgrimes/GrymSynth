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
exports.Slider = void 0;
const React = __importStar(require("react"));
const utils_1 = require("../../lib/utils");
const Slider = React.forwardRef(({ className, value, min, max, step, onValueChange, ...props }, ref) => {
    const handleChange = (event) => {
        onValueChange([parseFloat(event.target.value)]);
    };
    return (<div className={(0, utils_1.cn)("relative w-full touch-none select-none", className)}>
        <input type="range" ref={ref} min={min} max={max} step={step} value={value[0]} onChange={handleChange} className={(0, utils_1.cn)("h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary", "range-thumb:block range-thumb:h-5 range-thumb:w-5 range-thumb:rounded-full", "range-thumb:border-2 range-thumb:border-primary range-thumb:bg-background", "range-thumb:transition-colors range-thumb:focus-visible:outline-none", "range-thumb:focus-visible:ring-2 range-thumb:focus-visible:ring-ring", "range-thumb:focus-visible:ring-offset-2 range-thumb:disabled:pointer-events-none", "range-thumb:disabled:opacity-50")} {...props}/>
      </div>);
});
exports.Slider = Slider;
Slider.displayName = "Slider";
//# sourceMappingURL=slider.jsx.map