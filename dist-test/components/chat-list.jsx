"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatList = void 0;
const button_1 = require("./ui/button");
const scroll_area_1 = require("./ui/scroll-area");
function ChatList({ chats, currentChat, onChatSelect }) {
    return (<div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Chats</h2>
      </div>
      <scroll_area_1.ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {chats.map((chat) => (<button_1.Button key={chat.id} variant={chat.id === currentChat.id ? 'default' : 'ghost'} className="w-full justify-start text-left" onClick={() => onChatSelect(chat)}>
              <div className="truncate">
                {chat.messages.length > 0
                ? chat.messages[0].content.slice(0, 30) + '...'
                : 'New conversation'}
              </div>
              <div className="text-xs opacity-50 mt-1">
                {new Date(chat.messages[0]?.timestamp ?? Date.now()).toLocaleString()}
              </div>
            </button_1.Button>))}
        </div>
      </scroll_area_1.ScrollArea>
    </div>);
}
exports.ChatList = ChatList;
//# sourceMappingURL=chat-list.jsx.map