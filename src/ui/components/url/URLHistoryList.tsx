import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import {
  fetchURLHistory,
  clearURLHistory,
  selectURL,
  URLHistoryEntry
} from '../../state/urlProcessingSlice';

interface URLHistoryListProps {
  className?: string;
  maxItems?: number;
  onSelect?: (url: string) => void;
}

export const URLHistoryList: React.FC<URLHistoryListProps> = ({
  className = '',
  maxItems = 10,
  onSelect
}) => {
  const dispatch = useDispatch();
  const { history, historyLoading } = useSelector((state: RootState) => state.urlProcessing);

  // Fetch history on component mount
  useEffect(() => {
    dispatch(fetchURLHistory(maxItems));
  }, [dispatch, maxItems]);

  // Handle URL selection
  const handleSelect = (entry: URLHistoryEntry) => {
    dispatch(selectURL(entry.url));
    if (onSelect) {
      onSelect(entry.url);
    }
  };

  // Handle history clear
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your URL history?')) {
      dispatch(clearURLHistory());
    }
  };

  if (historyLoading) {
    return (
      <div className={`url-history-list ${className}`}>
        <div className="p-4 text-center text-gray-500">Loading history...</div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className={`url-history-list ${className}`}>
        <div className="p-4 text-center text-gray-500">No URL history</div>
      </div>
    );
  }

  return (
    <div className={`url-history-list ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium">Recent URLs</h3>
        <button
          onClick={handleClearHistory}
          className="text-sm text-red-500 hover:text-red-700"
          aria-label="Clear history"
        >
          Clear
        </button>
      </div>

      <ul className="divide-y divide-gray-200">
        {history.slice(0, maxItems).map((entry) => (
          <li key={`${entry.url}-${entry.timestamp}`} className="py-2">
            <button
              onClick={() => handleSelect(entry)}
              className="w-full text-left hover:bg-gray-50 p-2 rounded transition-colors"
            >
              <div className="flex justify-between">
                <div className="truncate flex-grow">
                  <span className="font-medium">{getDisplayUrl(entry.url)}</span>
                </div>
                <div className="text-sm text-gray-500 ml-2 whitespace-nowrap">
                  {formatTimestamp(entry.timestamp)}
                </div>
              </div>

              {entry.metadata && entry.metadata.content && entry.metadata.content.title && (
                <div className="text-sm text-gray-600 truncate mt-1">
                  {entry.metadata.content.title}
                </div>
              )}

              <div className="flex items-center mt-1 text-xs">
                {entry.metadata && entry.metadata.audio && entry.metadata.audio.format && (
                  <span className="bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 mr-2">
                    {entry.metadata.audio.format.toUpperCase()}
                  </span>
                )}

                {entry.status === 'success' ? (
                  <span className="text-green-500">✓ Processed</span>
                ) : (
                  <span className="text-red-500">✗ Failed</span>
                )}

                {entry.metadata && entry.metadata.audio && entry.metadata.audio.duration && (
                  <span className="ml-2 text-gray-500">
                    {formatDuration(entry.metadata.audio.duration)}
                  </span>
                )}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Helper function to format URL for display
const getDisplayUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.hostname}${urlObj.pathname.length > 1 ? urlObj.pathname : ''}`;
  } catch (e) {
    return url;
  }
};

// Helper function to format timestamp
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return `${diffHours}h ago`;
  } else if (diffMins > 0) {
    return `${diffMins}m ago`;
  } else {
    return 'Just now';
  }
};

// Helper function to format duration in seconds to mm:ss format
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
