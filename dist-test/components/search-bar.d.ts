/// <reference types="react" />
interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
}
export declare function SearchBar({ value, onChange }: SearchBarProps): import("react").JSX.Element;
export {};
