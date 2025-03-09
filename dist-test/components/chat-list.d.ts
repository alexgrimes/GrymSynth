/// <reference types="react" />
import type { StoredChat } from '../lib/storage/chat-storage';
interface ChatListProps {
    chats: StoredChat[];
    currentChat: StoredChat;
    onChatSelect: (chat: StoredChat) => void;
}
export declare function ChatList({ chats, currentChat, onChatSelect }: ChatListProps): import("react").JSX.Element;
export {};
