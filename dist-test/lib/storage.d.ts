interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}
export declare function saveChatMessage(message: Message): Promise<void>;
export declare function getChatHistory(): Promise<Message[]>;
export declare function clearChatHistory(): Promise<void>;
export {};
