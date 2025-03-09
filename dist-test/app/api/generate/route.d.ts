import { NextResponse } from 'next/server';
export declare function OPTIONS(): Promise<NextResponse<{}>>;
export declare function POST(request: Request): Promise<NextResponse<any>>;
