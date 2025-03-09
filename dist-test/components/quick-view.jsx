"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseViewer = void 0;
const resource_context_1 = require("@/context/resource-context");
function ResponseViewer() {
    const { selectedResource } = (0, resource_context_1.useResourceContext)();
    return (<div className="h-[calc(100vh-64px)] overflow-y-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Response Viewer</h2>
      
      {selectedResource && (<div className="mb-6 p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2 text-lg">{selectedResource.title}</h3>
          <p className="text-muted-foreground">{selectedResource.summary}</p>
        </div>)}

      {selectedResource?.response && (<div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2 text-lg">Analysis</h3>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap">{selectedResource.response}</pre>
          </div>
        </div>)}
    </div>);
}
exports.ResponseViewer = ResponseViewer;
//# sourceMappingURL=quick-view.jsx.map