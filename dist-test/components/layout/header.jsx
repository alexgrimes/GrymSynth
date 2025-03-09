"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = void 0;
const react_1 = __importStar(require("react"));
const search_bar_1 = require("@/components/search-bar");
const button_1 = require("@/components/ui/button");
const lucide_react_1 = require("lucide-react");
function Header({ className, onAddResource }) {
    const [searchValue, setSearchValue] = (0, react_1.useState)('');
    return (<header className={`border-b p-4 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h1 className="text-xl font-semibold">Audio Learning Hub</h1>
        <div className="flex items-center gap-4">
          <search_bar_1.SearchBar value={searchValue} onChange={setSearchValue}/>
          {onAddResource && (<button_1.Button onClick={onAddResource} className="ml-4">
              <lucide_react_1.Plus className="h-5 w-5 mr-2"/>
              Add Resource
            </button_1.Button>)}
        </div>
      </div>
    </header>);
}
exports.Header = Header;
//# sourceMappingURL=header.jsx.map