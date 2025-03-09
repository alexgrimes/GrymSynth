"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorBoundary = void 0;
const react_1 = require("react");
const button_1 = require("./ui/button");
function ErrorBoundary({ children }) {
    const [error, setError] = (0, react_1.useState)(null);
    if (error) {
        return (<div className="p-4 bg-red-50 text-red-700">
        <h3 className="font-medium mb-2">Something went wrong</h3>
        <button_1.Button onClick={() => setError(null)} variant="destructive">
          Try Again
        </button_1.Button>
      </div>);
    }
    return children;
}
exports.ErrorBoundary = ErrorBoundary;
//# sourceMappingURL=error-boundary.jsx.map