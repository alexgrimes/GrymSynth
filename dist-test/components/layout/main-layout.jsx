"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/components/layout/main-layout.tsx
const react_1 = require("react");
const button_1 = require("@/components/ui/button");
const scroll_area_1 = require("@/components/ui/scroll-area");
const resource_card_1 = require("@/components/resource-card");
const lucide_react_1 = require("lucide-react");
const ResourceContext_1 = require("@/contexts/ResourceContext");
const AddResourceDialog_1 = require("@/components/AddResourceDialog");
function isExtendedResource(resource) {
    if (!resource || typeof resource !== 'object')
        return false;
    const hasCategory = ('category' in resource &&
        typeof resource.category === 'string' &&
        ['dsp', 'juce', 'midi', 'realtime'].includes(resource.category));
    const hasMetadata = ('metadata' in resource &&
        resource.metadata &&
        typeof resource.metadata === 'object' &&
        'title' in resource.metadata &&
        typeof resource.metadata.title === 'string' &&
        'description' in resource.metadata &&
        typeof resource.metadata.description === 'string' &&
        'topics' in resource.metadata &&
        Array.isArray(resource.metadata.topics) &&
        'difficulty' in resource.metadata &&
        typeof resource.metadata.difficulty === 'string' &&
        ['beginner', 'intermediate', 'advanced'].includes(resource.metadata.difficulty));
    return Boolean(hasCategory && hasMetadata);
}
const MainLayout = () => {
    const { resources, isLoading, addResource } = (0, ResourceContext_1.useResources)();
    const [selectedCategory, setSelectedCategory] = (0, react_1.useState)(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = (0, react_1.useState)(false);
    const handleAddResource = async (submission) => {
        try {
            await addResource({
                url: submission.url,
                categories: [],
                topics: submission.topics
            });
            setIsAddDialogOpen(false);
        }
        catch (error) {
            console.error('Failed to add resource:', error);
        }
    };
    const categories = [
        {
            title: "Algorithmic Composition",
            topics: [
                { id: 'stochastic', label: 'Stochastic Processes', icon: <lucide_react_1.Binary /> },
                { id: 'markov', label: 'Markov Chains', icon: <lucide_react_1.Workflow /> },
                { id: 'generative', label: 'Generative Systems', icon: <lucide_react_1.Brain /> }
            ]
        },
        {
            title: "DSP & Spectral",
            topics: [
                { id: 'spectral', label: 'Spectral Analysis', icon: <lucide_react_1.Activity /> },
                { id: 'granular', label: 'Granular Synthesis', icon: <lucide_react_1.Layers /> },
                { id: 'convolution', label: 'Convolution', icon: <lucide_react_1.Box /> }
            ]
        }
    ];
    return (<div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <scroll_area_1.ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {resources?.map((resource) => (isExtendedResource(resource) ? (<resource_card_1.ResourceCard key={resource.id} resource={resource}/>) : null))}
          </div>
        </scroll_area_1.ScrollArea>
      </div>
      
      <div className="p-4 border-t">
        <button_1.Button onClick={() => setIsAddDialogOpen(true)} className="w-full">
          <lucide_react_1.Plus className="mr-2 h-4 w-4"/>
          Add Resource
        </button_1.Button>
      </div>

      <AddResourceDialog_1.AddResourceDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onSubmit={handleAddResource}/>
    </div>);
};
exports.default = MainLayout;
//# sourceMappingURL=main-layout.jsx.map