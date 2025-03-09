/// <reference types="react" />
import { Resource } from '@shared/types';
interface UrlInputProps {
    onProcessed: (resource: Resource) => void;
}
export declare function UrlInput({ onProcessed }: UrlInputProps): import("react").JSX.Element;
export {};
