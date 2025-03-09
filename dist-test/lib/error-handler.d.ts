import { NextResponse } from 'next/server';
export interface RecoveryStatus {
    isRetrying: boolean;
    attempt: number;
    maxAttempts: number;
    message: string;
    error?: Error;
}
export declare class ErrorHandler {
    private config;
    withRecovery<T>(operation: () => Promise<T>, onStatusUpdate?: (status: RecoveryStatus) => void): Promise<T>;
    private isRecoverable;
    private handleRecoverableError;
    private createFinalError;
}
export declare function handleApiError(error: unknown): NextResponse<{
    error: string;
}>;
export declare const errorHandler: ErrorHandler;
