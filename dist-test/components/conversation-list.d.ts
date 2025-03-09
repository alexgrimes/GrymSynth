/// <reference types="react" />
import type { Conversation } from '../lib/storage/types';
export declare function ConversationList({ conversations, currentId, onSelect }: {
    conversations: Conversation[];
    currentId: string;
    onSelect: (id: string) => void;
}): import("react").JSX.Element;
