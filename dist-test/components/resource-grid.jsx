"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceGrid = void 0;
const resource_card_1 = require("./resource-card");
function ResourceGrid({ resources, onResourceClick }) {
    return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((resource) => (<resource_card_1.ResourceCard key={resource.id} resource={resource} onClick={() => onResourceClick?.(resource)}/>))}
    </div>);
}
exports.ResourceGrid = ResourceGrid;
//# sourceMappingURL=resource-grid.jsx.map