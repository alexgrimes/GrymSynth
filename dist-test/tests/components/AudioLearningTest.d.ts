import React from 'react';
export declare function AudioLearningTest(): React.JSX.Element;
declare global {
    interface Window {
        webkitAudioContext: typeof AudioContext;
    }
}
