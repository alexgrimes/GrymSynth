/// <reference types="react" />
interface AddResourceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (submission: {
        url: string;
        topics: string[];
    }) => Promise<void>;
}
export declare function AddResourceDialog({ open, onOpenChange, onSubmit }: AddResourceDialogProps): import("react").JSX.Element;
export {};
