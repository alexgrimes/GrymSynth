/// <reference types="react" />
import { Resource } from '@shared/types';
interface ResourceContextType {
    resources: Resource[];
    selectedResource: Resource | null;
    addResource: (resource: Resource) => void;
    selectResource: (resource: Resource | null) => void;
}
export declare function ResourceProvider({ children }: {
    children: React.ReactNode;
}): import("react").JSX.Element;
export declare function useResourceContext(): ResourceContextType;
export {};
