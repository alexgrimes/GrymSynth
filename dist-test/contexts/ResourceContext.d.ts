import React from 'react';
import type { Resource, ResourceSubmission } from '../lib/types';
interface ResourceContextType {
    resources: Resource[];
    isLoading: boolean;
    error: string | null;
    addResource: (submission: ResourceSubmission) => Promise<void>;
    getResourcesByTopic: (topic: string) => Promise<Resource[]>;
}
export declare function ResourceProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export declare const useResources: () => ResourceContextType;
export {};
