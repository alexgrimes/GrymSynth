import { NextResponse } from 'next/server';
export declare function OPTIONS(): Promise<NextResponse<{}>>;
export declare function POST(request: Request): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    url: any;
    response: any;
    timestamp: number;
}>>;
