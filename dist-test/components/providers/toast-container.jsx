"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToastContainer = void 0;
const react_hot_toast_1 = require("react-hot-toast");
function ToastContainer() {
    return (<react_hot_toast_1.Toaster position="bottom-right" toastOptions={{
            className: 'bg-background text-foreground',
            duration: 3000,
            style: {
                background: '#333',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
            },
        }}/>);
}
exports.ToastContainer = ToastContainer;
//# sourceMappingURL=toast-container.jsx.map