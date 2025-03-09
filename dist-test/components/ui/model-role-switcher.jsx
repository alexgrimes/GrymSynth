"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRoleSwitcher = void 0;
const button_1 = require("./button");
const lucide_react_1 = require("lucide-react");
// This component will show which model is in which role and allow switching
function ModelRoleSwitcher({ models, onSwitch, disabled }) {
    return (<div className="flex items-center gap-4 p-4 border-b">
      {/* The active responder is highlighted */}
      <div className="flex-1 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="text-sm font-medium">Responder</div>
        <div className="text-blue-600">{models.responder}</div>
      </div>

      {/* Switch button with clear visual feedback */}
      <button_1.Button variant="outline" onClick={onSwitch} disabled={disabled} title="Switch model roles" className="h-10 w-10 p-0">
        <lucide_react_1.ArrowUpDown className="h-4 w-4"/>
      </button_1.Button>

      {/* The listener is shown in a more subtle style */}
      <div className="flex-1 p-3 rounded-lg bg-gray-50 border border-gray-200">
        <div className="text-sm font-medium">Listener</div>
        <div className="text-gray-600">{models.listener}</div>
      </div>
    </div>);
}
exports.ModelRoleSwitcher = ModelRoleSwitcher;
//# sourceMappingURL=model-role-switcher.jsx.map