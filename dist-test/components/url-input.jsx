"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.UrlInput = void 0;
const react_1 = require("react");
const button_1 = require("./ui/button");
const input_1 = require("./ui/input");
function UrlInput({ onProcessed }) {
    const [url, setUrl] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch('/api/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });
            if (!response.ok) {
                throw new Error('Failed to process URL');
            }
            const resource = await response.json();
            onProcessed(resource);
        }
        catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            }
            else {
                setError('An unknown error occurred');
            }
        }
        finally {
            setLoading(false);
        }
    };
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <input_1.Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL to analyze" required/>
        <button_1.Button type="submit" disabled={loading}>
          {loading ? 'Processing...' : 'Analyze'}
        </button_1.Button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </form>);
}
exports.UrlInput = UrlInput;
//# sourceMappingURL=url-input.jsx.map