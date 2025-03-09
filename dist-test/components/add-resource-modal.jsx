"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddResourceModal = void 0;
const react_1 = require("react");
const dialog_1 = require("@/components/ui/dialog");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const select_1 = require("@/components/ui/select");
const lucide_react_1 = require("lucide-react");
const AddResourceModal = ({ open, onOpenChange, onSubmit }) => {
    const [url, setUrl] = (0, react_1.useState)('');
    const [type, setType] = (0, react_1.useState)('documentation');
    const [category, setCategory] = (0, react_1.useState)('dsp');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSubmit({ url, type, category });
            setUrl('');
            onOpenChange(false);
        }
        catch (error) {
            console.error('Failed to add resource:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<dialog_1.Dialog open={open} onOpenChange={onOpenChange}>
      <dialog_1.DialogContent className="sm:max-w-[425px]">
        <dialog_1.DialogHeader>
          <dialog_1.DialogTitle>Add Learning Resource</dialog_1.DialogTitle>
        </dialog_1.DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label_1.Label htmlFor="url">Resource URL</label_1.Label>
            <input_1.Input id="url" type="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} required/>
          </div>

          <div className="space-y-2">
            <label_1.Label htmlFor="type">Resource Type</label_1.Label>
            <select_1.Select value={type} onValueChange={(value) => setType(value)}>
              <select_1.SelectTrigger>
                <select_1.SelectValue placeholder="Select type"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="documentation">Documentation</select_1.SelectItem>
                <select_1.SelectItem value="tutorial">Tutorial</select_1.SelectItem>
                <select_1.SelectItem value="video">Video</select_1.SelectItem>
                <select_1.SelectItem value="book">Book</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
          </div>

          <div className="space-y-2">
            <label_1.Label htmlFor="category">Category</label_1.Label>
            <select_1.Select value={category} onValueChange={(value) => setCategory(value)}>
              <select_1.SelectTrigger>
                <select_1.SelectValue placeholder="Select category"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="dsp">DSP</select_1.SelectItem>
                <select_1.SelectItem value="juce">JUCE</select_1.SelectItem>
                <select_1.SelectItem value="midi">MIDI</select_1.SelectItem>
                <select_1.SelectItem value="realtime">Real-time Audio</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button_1.Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </button_1.Button>
            <button_1.Button type="submit" disabled={isLoading}>
              {isLoading && <lucide_react_1.Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Add Resource
            </button_1.Button>
          </div>
        </form>
      </dialog_1.DialogContent>
    </dialog_1.Dialog>);
};
exports.AddResourceModal = AddResourceModal;
//# sourceMappingURL=add-resource-modal.jsx.map