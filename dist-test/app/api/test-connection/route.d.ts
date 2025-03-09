import { NextResponse } from 'next/server';
export declare function OPTIONS(): Promise<NextResponse<{}>>;
export declare function GET(): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    success: boolean;
    version: any;
    models: any;
}>>;
