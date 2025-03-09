"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notify = void 0;
const toast_service_1 = require("./toast-service");
exports.notify = {
    success: (message) => toast_service_1.toastService.success(message),
    error: (message) => toast_service_1.toastService.error(message),
    loading: (message = 'Processing...') => toast_service_1.toastService.loading(message),
    dismiss: () => { } // No-op since our toasts auto-dismiss
};
//# sourceMappingURL=notifications.js.map