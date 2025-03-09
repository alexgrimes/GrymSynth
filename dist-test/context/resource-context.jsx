"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useResourceContext = exports.ResourceProvider = void 0;
const react_1 = require("react");
const ResourceContext = (0, react_1.createContext)({
    resources: [],
    selectedResource: null,
    addResource: () => { },
    selectResource: () => { },
});
function ResourceProvider({ children }) {
    const [resources, setResources] = (0, react_1.useState)([]);
    const [selectedResource, setSelectedResource] = (0, react_1.useState)(null);
    const addResource = (resource) => {
        setResources(prev => [resource, ...prev]);
        setSelectedResource(resource);
    };
    const selectResource = (resource) => {
        setSelectedResource(resource);
    };
    return (<ResourceContext.Provider value={{
            resources,
            selectedResource,
            addResource,
            selectResource
        }}>
      {children}
    </ResourceContext.Provider>);
}
exports.ResourceProvider = ResourceProvider;
function useResourceContext() {
    return (0, react_1.useContext)(ResourceContext);
}
exports.useResourceContext = useResourceContext;
//# sourceMappingURL=resource-context.jsx.map