import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import {
  submitURL,
  clearURLError,
  URLProcessingStatus
} from '../../state/urlProcessingSlice';
import { URLStatusIndicator } from './URLStatusIndicator';

interface URLInputFormProps {
  className?: string;
  placeholder?: string;
  buttonText?: string;
  onSuccess?: (url: string) => void;
}

export const URLInputForm: React.FC<URLInputFormProps> = ({
  className = '',
  placeholder = 'Enter audio URL...',
  buttonText = 'Process',
  onSuccess
}) => {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);

  const dispatch = useDispatch();
  const { status, error, currentUrl } = useSelector((state: RootState) => state.urlProcessing);

  // Validate URL as user types
  useEffect(() => {
    // Simple URL validation
    const isValid = url.trim() !== '' && (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.match(/^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/)
    );

    setIsValidUrl(isValid);

    // Clear error when user starts typing again
    if (error) {
      dispatch(clearURLError());
    }
  }, [url, dispatch, error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidUrl) return;

    // Normalize URL (add https:// if missing)
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    dispatch(submitURL(normalizedUrl));
  };

  // Call onSuccess when processing completes successfully
  useEffect(() => {
    if (status === URLProcessingStatus.SUCCESS && currentUrl && onSuccess) {
      onSuccess(currentUrl);
    }
  }, [status, currentUrl, onSuccess]);

  return (
    <div className={`url-input-form ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
        <div className="flex items-center">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            className={`flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 ${
              error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
            }`}
            aria-label="URL input"
          />
          <button
            type="submit"
            disabled={!isValidUrl || status === URLProcessingStatus.PROCESSING}
            className={`px-4 py-2 rounded-r font-medium ${
              !isValidUrl || status === URLProcessingStatus.PROCESSING
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {status === URLProcessingStatus.PROCESSING ? 'Processing...' : buttonText}
          </button>
        </div>

        {error && (
          <div className="text-red-500 text-sm mt-1" role="alert">
            {error}
          </div>
        )}

        <URLStatusIndicator />
      </form>
    </div>
  );
};
