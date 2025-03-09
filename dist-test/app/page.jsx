"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chat_panel_1 = require("../components/chat-panel");
function Home() {
    return (<main className="flex h-screen">
      <div className="flex-1 flex">
        {/* Left side - Resource/URL handling (later) */}
        <div className="w-[600px] border-r bg-white">
          <div className="p-4">
            Future URL/Resource Input
          </div>
        </div>

        {/* Right side - Chat */}
        <div className="flex-1">
          <chat_panel_1.ChatPanel />
        </div>
      </div>
    </main>);
}
exports.default = Home;
//# sourceMappingURL=page.jsx.map