import { configureStore } from '@reduxjs/toolkit';
import visualizationReducer from './visualizationSlice';
import controlsReducer from './controlsSlice';
import audioProcessingReducer from './audioProcessingSlice';
import chatReducer from './chatSlice';
import urlProcessingReducer from './urlProcessingSlice';

export const store = configureStore({
  reducer: {
    visualization: visualizationReducer,
    controls: controlsReducer,
    audioProcessing: audioProcessingReducer,
    chat: chatReducer,
    urlProcessing: urlProcessingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in the state
        ignoredActions: [
          'visualization/setXenakisLDMField',
          'urlProcessing/seekToPosition' // Ignore setTimeout side effect in the reducer
        ],
        ignoredPaths: [
          'visualization.xenakisLDMField',
          'urlProcessing.currentStreamingSession'
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
