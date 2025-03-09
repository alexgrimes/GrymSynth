/// <reference types="react" />
interface AddResourceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: ResourceSubmission) => Promise<void>;
}
interface ResourceSubmission {
    url: string;
    type: 'book' | 'video' | 'tutorial' | 'documentation';
    category: 'dsp' | 'juce' | 'midi' | 'realtime';
}
export declare const AddResourceModal: ({ open, onOpenChange, onSubmit }: AddResourceModalProps) => import("react").JSX.Element;
export {};
