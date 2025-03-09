"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavLink = void 0;
const link_1 = __importDefault(require("next/link"));
function NavLink({ href, children }) {
    return (<link_1.default href={href} className="block px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
      {children}
    </link_1.default>);
}
exports.NavLink = NavLink;
//# sourceMappingURL=nav-link.jsx.map