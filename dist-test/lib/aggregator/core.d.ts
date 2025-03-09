import { z } from 'zod';
import type { Page, ExtractOptions } from '@browserbasehq/stagehand';
export type { Page, ExtractOptions };
export interface Resource {
    url: string;
    title: string;
    content: string;
    metadata: Record<string, unknown>;
}
export interface SiteAdapter {
    canHandle(url: string): boolean;
    extract(page: Page): Promise<Resource>;
}
export declare function normalizeResources(resources: Resource[]): NormalizedResource[];
export declare const NormalizedResourceSchema: z.ZodObject<{
    id: z.ZodString;
    source: z.ZodString;
    type: z.ZodEnum<["tutorial", "documentation", "video", "book"]>;
    title: z.ZodString;
    description: z.ZodString;
    content: z.ZodDefault<z.ZodString>;
    tags: z.ZodArray<z.ZodString, "many">;
    url: z.ZodString;
    publishedAt: z.ZodOptional<z.ZodDate>;
    author: z.ZodOptional<z.ZodString>;
    language: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    url: string;
    id: string;
    title: string;
    content: string;
    source: string;
    type: "tutorial" | "documentation" | "video" | "book";
    description: string;
    tags: string[];
    language: string;
    author?: string | undefined;
    publishedAt?: Date | undefined;
}, {
    url: string;
    id: string;
    title: string;
    source: string;
    type: "tutorial" | "documentation" | "video" | "book";
    description: string;
    tags: string[];
    content?: string | undefined;
    author?: string | undefined;
    publishedAt?: Date | undefined;
    language?: string | undefined;
}>;
export type NormalizedResource = z.infer<typeof NormalizedResourceSchema>;
export declare const SearchResultSchema: z.ZodObject<{
    query: z.ZodString;
    results: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        source: z.ZodString;
        type: z.ZodEnum<["tutorial", "documentation", "video", "book"]>;
        title: z.ZodString;
        description: z.ZodString;
        content: z.ZodDefault<z.ZodString>;
        tags: z.ZodArray<z.ZodString, "many">;
        url: z.ZodString;
        publishedAt: z.ZodOptional<z.ZodDate>;
        author: z.ZodOptional<z.ZodString>;
        language: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        id: string;
        title: string;
        content: string;
        source: string;
        type: "tutorial" | "documentation" | "video" | "book";
        description: string;
        tags: string[];
        language: string;
        author?: string | undefined;
        publishedAt?: Date | undefined;
    }, {
        url: string;
        id: string;
        title: string;
        source: string;
        type: "tutorial" | "documentation" | "video" | "book";
        description: string;
        tags: string[];
        content?: string | undefined;
        author?: string | undefined;
        publishedAt?: Date | undefined;
        language?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    query: string;
    results: {
        url: string;
        id: string;
        title: string;
        content: string;
        source: string;
        type: "tutorial" | "documentation" | "video" | "book";
        description: string;
        tags: string[];
        language: string;
        author?: string | undefined;
        publishedAt?: Date | undefined;
    }[];
}, {
    query: string;
    results: {
        url: string;
        id: string;
        title: string;
        source: string;
        type: "tutorial" | "documentation" | "video" | "book";
        description: string;
        tags: string[];
        content?: string | undefined;
        author?: string | undefined;
        publishedAt?: Date | undefined;
        language?: string | undefined;
    }[];
}>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export interface ExtractionConfig {
    maxDepth: number;
    parallelRequests: number;
    timeout: number;
    allowedDomains: string[];
}
