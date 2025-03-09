"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toastService = void 0;
class ToastService {
    constructor() {
        this.listeners = [];
    }
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }
    emit(event) {
        this.listeners.forEach(callback => callback(event));
    }
    success(message) {
        this.emit({ message, type: 'success' });
        return message;
    }
    error(message) {
        this.emit({ message, type: 'error' });
        return message;
    }
    loading(message = 'Processing...') {
        this.emit({ message, type: 'loading' });
        return message;
    }
    dismiss() { } // No-op since our toasts auto-dismiss
}
exports.toastService = new ToastService();
//# sourceMappingURL=toast-service.js.map