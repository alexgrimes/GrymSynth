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
exports.ScrollBar = exports.ScrollArea = void 0;
const React = __importStar(require("react"));
const ScrollAreaPrimitive = __importStar(require("@radix-ui/react-scroll-area"));
const utils_1 = require("@/lib/utils");
const ScrollArea = React.forwardRef(({ className, children, ...props }, forwardedRef) => (<ScrollAreaPrimitive.Root className={(0, utils_1.cn)("relative overflow-hidden", className)} {...props}>
    <ScrollAreaPrimitive.Viewport ref={forwardedRef} className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>));
exports.ScrollArea = ScrollArea;
ScrollArea.displayName = "ScrollArea";
const ScrollBar = React.forwardRef(({ className, orientation = "vertical", ...props }, forwardedRef) => (<ScrollAreaPrimitive.ScrollAreaScrollbar ref={forwardedRef} orientation={orientation} className={(0, utils_1.cn)("flex touch-none select-none transition-colors", orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]", orientation === "horizontal" &&
        "h-2.5 border-t border-t-transparent p-[1px]", className)} {...props}>
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border"/>
  </ScrollAreaPrimitive.ScrollAreaScrollbar>));
exports.ScrollBar = ScrollBar;
ScrollBar.displayName = "ScrollBar";
//# sourceMappingURL=scroll-area.jsx.map