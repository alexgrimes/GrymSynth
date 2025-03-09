/// <reference types="react" />
import { Resource } from '@shared/types';
interface ResourceGridProps {
    resources: Resource[];
    onResourceClick?: (resource: Resource) => void;
}
export declare function ResourceGrid({ resources, onResourceClick }: ResourceGridProps): import("react").JSX.Element;
export {};
