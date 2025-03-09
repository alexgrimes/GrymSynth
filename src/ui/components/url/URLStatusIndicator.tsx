import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../state/store';
import { URLProcessingStatus } from '../../state/urlProcessingSlice';

interface URLStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export const URLStatusIndicator: React.FC<URLStatusIndicatorProps> = ({
  className = '',
  showDetails = true
}) => {
  const { status, currentUrl, securityStatus, metadata, processingTime } = useSelector(
    (state: RootState) => state.urlProcessing
  );

  // Don't render anything if idle and no URL has been processed
  if (status === URLProcessingStatus.IDLE && !currentUrl) {
    return null;
  }

  // Determine status color and icon
  let statusColor = 'gray';
  let statusIcon = '⚪';
  let statusText = 'Idle';

  switch (status) {
    case URLProcessingStatus.PROCESSING:
      statusColor = 'blue';
      statusIcon = '🔄';
      statusText = 'Processing...';
      break;
    case URLProcessingStatus.SUCCESS:
      statusColor = 'green';
      statusIcon = '✅';
      statusText = 'Success';
      break;
    case URLProcessingStatus.ERROR:
      statusColor = 'red';
      statusIcon = '❌';
      statusText = 'Error';
      break;
  }

  // Determine security status color and icon
  let securityColor = 'gray';
  let securityIcon = '⚪';
  let securityText = 'Unknown';

  if (securityStatus) {
    switch (securityStatus) {
      case 'safe':
        securityColor = 'green';
        securityIcon = '🔒';
        securityText = 'Safe';
        break;
      case 'suspicious':
        securityColor = 'yellow';
        securityIcon = '⚠️';
        securityText = 'Suspicious';
        break;
      case 'malicious':
        securityColor = 'red';
        securityIcon = '🚫';
        securityText = 'Malicious';
        break;
    }
  }

  return (
    <div className={`url-status-indicator ${className}`}>
      <div className="flex items-center space-x-2 mt-2">
        <div className={`text-${statusColor}-500 font-medium flex items-center`}>
          <span className="mr-1">{statusIcon}</span>
          <span>Status: {statusText}</span>
        </div>

        {status === URLProcessingStatus.SUCCESS && (
          <div className={`text-${securityColor}-500 font-medium flex items-center ml-4`}>
            <span className="mr-1">{securityIcon}</span>
            <span>Security: {securityText}</span>
          </div>
        )}
      </div>

      {showDetails && status === URLProcessingStatus.SUCCESS && (
        <div className="mt-2 text-sm text-gray-600">
          <div className="truncate">
            <span className="font-medium">URL:</span> {currentUrl}
          </div>

          {processingTime && (
            <div>
              <span className="font-medium">Processing Time:</span> {processingTime.toFixed(2)}ms
            </div>
          )}

          {metadata && metadata.audio && (
            <div className="mt-1">
              <div className="font-medium">Audio Information:</div>
              <ul className="list-disc list-inside pl-2">
                {metadata.audio.format && (
                  <li>Format: {metadata.audio.format}</li>
                )}
                {metadata.audio.duration && (
                  <li>Duration: {formatDuration(metadata.audio.duration)}</li>
                )}
                {metadata.audio.bitrate && (
                  <li>Bitrate: {metadata.audio.bitrate} kbps</li>
                )}
              </ul>
            </div>
          )}

          {metadata && metadata.content && metadata.content.title && (
            <div className="mt-1">
              <div className="font-medium">Content:</div>
              <div className="truncate">{metadata.content.title}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to format duration in seconds to mm:ss format
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
