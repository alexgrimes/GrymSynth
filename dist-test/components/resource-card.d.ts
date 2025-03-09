/// <reference types="react" />
import type { Resource } from "@/lib/types";
interface ResourceCardProps {
    resource: Resource & {
        category: string;
        metadata: {
            title: string;
            description: string;
            topics: string[];
        };
    };
}
export declare const ResourceCard: ({ resource }: ResourceCardProps) => import("react").JSX.Element;
export {};
