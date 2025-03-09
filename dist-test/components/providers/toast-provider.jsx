"use strict";
'use client';
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
const React = __importStar(require("react"));
const react_dom_1 = require("react-dom");
const icons_1 = require("@/components/ui/icons");
const toast_service_1 = require("@/lib/toast-service");
const ToastProvider = ({ children }) => {
    const [messages, setMessages] = React.useState([]);
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);
    React.useEffect(() => {
        if (!mounted)
            return;
        const unsubscribe = toast_service_1.toastService.subscribe(({ message, type }) => {
            const id = Math.random().toString(36).slice(2);
            setMessages((prev) => [...prev, { id, message, type }]);
            setTimeout(() => {
                setMessages((prev) => prev.filter((m) => m.id !== id));
            }, type === 'error' ? 4000 : 3000);
        });
        return () => unsubscribe();
    }, [mounted]);
    if (!mounted)
        return null;
    return (<>
      {children}
      {mounted &&
            (0, react_dom_1.createPortal)(<div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
            {messages.map((msg) => (<div key={msg.id} className={`rounded-lg px-4 py-3 text-white shadow-lg 
                  animate-in slide-in-from-right duration-300 
                  transition-all hover:translate-x-[-4px] cursor-pointer
                  ${msg.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                        msg.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                            'bg-blue-600 hover:bg-blue-700'}`} onClick={() => {
                        setMessages(prev => prev.filter(m => m.id !== msg.id));
                    }}>
                <div className="flex items-center gap-2">
                  {msg.type === 'success' ? (<icons_1.CheckIcon />) : msg.type === 'error' ? (<icons_1.ErrorIcon />) : (<icons_1.LoadingIcon />)}
                  {msg.message}
                </div>
              </div>))}
          </div>, document.body)}
    </>);
};
exports.default = ToastProvider;
//# sourceMappingURL=toast-provider.jsx.map