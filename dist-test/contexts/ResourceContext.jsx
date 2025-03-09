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
exports.useResources = exports.ResourceProvider = void 0;
const react_1 = __importStar(require("react"));
const storage_1 = require("../lib/storage");
const resourceProcessor_1 = require("../lib/processors/resourceProcessor");
const ResourceContext = (0, react_1.createContext)(undefined);
const processor = new resourceProcessor_1.ResourceProcessor();
function ResourceProvider({ children }) {
    const [resources, setResources] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    // Load initial resources
    (0, react_1.useEffect)(() => {
        loadResources();
    }, []);
    async function loadResources() {
        try {
            setIsLoading(true);
            const loaded = await storage_1.storage.getAllResources();
            setResources(loaded);
        }
        catch (error) {
            setError('Failed to load resources');
        }
        finally {
            setIsLoading(false);
        }
    }
    async function addResource(submission) {
        try {
            setIsLoading(true);
            const processed = await processor.processUrl(submission);
            await storage_1.storage.saveResource(processed);
            setResources(prev => [...prev, processed]);
        }
        catch (error) {
            setError('Failed to add resource');
            throw error;
        }
        finally {
            setIsLoading(false);
        }
    }
    async function getResourcesByTopic(topic) {
        return storage_1.storage.getResourcesByTopic(topic);
    }
    return (<ResourceContext.Provider value={{
            resources,
            isLoading,
            error,
            addResource,
            getResourcesByTopic,
        }}>
      {children}
    </ResourceContext.Provider>);
}
exports.ResourceProvider = ResourceProvider;
const useResources = () => {
    const context = (0, react_1.useContext)(ResourceContext);
    if (!context) {
        throw new Error('useResources must be used within a ResourceProvider');
    }
    return context;
};
exports.useResources = useResources;
//# sourceMappingURL=ResourceContext.jsx.map