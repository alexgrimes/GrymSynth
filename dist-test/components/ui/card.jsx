"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardContent = exports.CardTitle = exports.CardHeader = exports.Card = void 0;
const react_1 = __importDefault(require("react"));
function Card({ className, ...props }) {
    return (<div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}/>);
}
exports.Card = Card;
function CardHeader({ className, ...props }) {
    return (<div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}/>);
}
exports.CardHeader = CardHeader;
function CardTitle({ className, ...props }) {
    return (<h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}/>);
}
exports.CardTitle = CardTitle;
function CardContent({ className, ...props }) {
    return (<div className={`p-6 pt-0 ${className}`} {...props}/>);
}
exports.CardContent = CardContent;
//# sourceMappingURL=card.jsx.map