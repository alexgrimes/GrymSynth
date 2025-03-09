"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceSidebar = void 0;
const resource_context_1 = require("@/context/resource-context");
const url_input_1 = require("./url-input");
function ResourceSidebar() {
    const { resources, selectedResource, addResource, selectResource } = (0, resource_context_1.useResourceContext)();
    const handleUrlProcessed = (resource) => {
        addResource(resource);
    };
    return (<div className="h-[calc(100vh-64px)] overflow-y-auto p-6 border-r">
      <h2 className="text-xl font-semibold mb-6">Resources</h2>
      
      <div className="mb-6">
        <url_input_1.UrlInput onProcessed={handleUrlProcessed}/>
      </div>

      <div className="space-y-2">
        {resources.map(resource => (<button key={resource.url} onClick={() => selectResource(resource)} className={`w-full text-left p-2 rounded-lg hover:bg-muted transition-colors ${selectedResource?.url === resource.url ? 'bg-muted' : ''}`}>
            <h3 className="font-medium">{resource.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {resource.summary}
            </p>
          </button>))}
      </div>
    </div>);
}
exports.ResourceSidebar = ResourceSidebar;
//# sourceMappingURL=resource-sidebar.jsx.map