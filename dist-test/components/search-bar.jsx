"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchBar = void 0;
const lucide_react_1 = require("lucide-react");
const input_1 = require("@/components/ui/input");
function SearchBar({ value, onChange }) {
    return (<div className="relative flex-1 max-w-xl">
      <lucide_react_1.Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"/>
      <input_1.Input placeholder="Search resources..." className="pl-10 w-full" value={value} onChange={(e) => onChange(e.target.value)}/>
    </div>);
}
exports.SearchBar = SearchBar;
//# sourceMappingURL=search-bar.jsx.map