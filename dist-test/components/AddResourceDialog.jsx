"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddResourceDialog = void 0;
const react_1 = require("react");
const dialog_1 = require("@/components/ui/dialog");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const ResourceContext_1 = require("@/contexts/ResourceContext");
function AddResourceDialog({ open, onOpenChange, onSubmit }) {
    const { isLoading } = (0, ResourceContext_1.useResources)();
    const [url, setUrl] = (0, react_1.useState)('');
    const [selectedTopics, setSelectedTopics] = (0, react_1.useState)([]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await onSubmit({
                url,
                topics: selectedTopics
            });
            onOpenChange(false);
            setUrl('');
            setSelectedTopics([]);
        }
        catch (error) {
            console.error('Failed to add resource:', error);
        }
    };
    return (<dialog_1.Dialog open={open} onOpenChange={onOpenChange}>
      <dialog_1.DialogContent>
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>Add New Resource</dialog_1.DialogTitle>
        </dialog_1.DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input_1.Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL" type="url" required/>
          {/* TODO: Add topic selection */}
          <button_1.Button type="submit" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Resource'}
          </button_1.Button>
        </form>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
}
exports.AddResourceDialog = AddResourceDialog;
//# sourceMappingURL=AddResourceDialog.jsx.map