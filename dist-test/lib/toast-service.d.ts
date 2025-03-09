type ToastType = 'success' | 'error' | 'loading';
interface ToastEvent {
    message: string;
    type: ToastType;
}
type ToastCallback = (event: ToastEvent) => void;
declare class ToastService {
    private listeners;
    subscribe(callback: ToastCallback): () => void;
    private emit;
    success(message: string): string;
    error(message: string): string;
    loading(message?: string): string;
    dismiss(): void;
}
export declare const toastService: ToastService;
export {};
