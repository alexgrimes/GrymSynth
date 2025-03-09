"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
const google_1 = require("next/font/google");
const toast_provider_1 = __importDefault(require("@/components/providers/toast-provider"));
require("./globals.css");
const inter = (0, google_1.Inter)({ subsets: ['latin'] });
exports.metadata = {
    title: 'Audio Learning Hub',
    description: 'Your personal audio development learning platform',
};
function RootLayout({ children, }) {
    return (<html lang="en">
      <body className={inter.className}>
        <toast_provider_1.default>
          <main className="flex min-h-screen flex-col">
            {children}
          </main>
        </toast_provider_1.default>
      </body>
    </html>);
}
exports.default = RootLayout;
//# sourceMappingURL=layout.jsx.map