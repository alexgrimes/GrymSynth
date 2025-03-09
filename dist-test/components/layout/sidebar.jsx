"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sidebar = void 0;
const lucide_react_1 = require("lucide-react");
const button_1 = require("../ui/button");
function Sidebar() {
    return (<div className="w-16 bg-white border-r flex flex-col items-center py-4">
      <button_1.Button variant="ghost" size="icon" className="mb-4">
        <lucide_react_1.BookOpen className="h-6 w-6 text-gray-700"/>
      </button_1.Button>
      <button_1.Button variant="ghost" size="icon" className="mb-4">
        <lucide_react_1.Code className="h-6 w-6 text-gray-700"/>
      </button_1.Button>
      <button_1.Button variant="ghost" size="icon" className="mb-4">
        <lucide_react_1.Music className="h-6 w-6 text-gray-700"/>
      </button_1.Button>
      <button_1.Button variant="ghost" size="icon" className="mt-auto">
        <lucide_react_1.Settings className="h-6 w-6 text-gray-700"/>
      </button_1.Button>
    </div>);
}
exports.Sidebar = Sidebar;
//# sourceMappingURL=sidebar.jsx.map