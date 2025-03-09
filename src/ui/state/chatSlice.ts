import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define types for the chat state
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  relatedPatternIds?: string[];
  relatedAudioSegment?: {
    start: number;
    end: number;
  };
}

interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isTyping: boolean;
  pendingMessage: string;
  isProcessing: boolean;
  error: string | null;
  llmContext: {
    includePatternContext: boolean;
    includeAudioContext: boolean;
    contextWindowSize: number;
  };
}

// Generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Initial state
const initialState: ChatState = {
  sessions: [],
  currentSessionId: null,
  isTyping: false,
  pendingMessage: '',
  isProcessing: false,
  error: null,
  llmContext: {
    includePatternContext: true,
    includeAudioContext: true,
    contextWindowSize: 4096,
  },
};

// Create the slice
const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Session management
    createSession: (state, action: PayloadAction<{ name: string }>) => {
      const newSession: ChatSession = {
        id: generateId(),
        name: action.payload.name,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.sessions.push(newSession);
      state.currentSessionId = newSession.id;
    },

    deleteSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(session => session.id !== action.payload);
      if (state.currentSessionId === action.payload) {
        state.currentSessionId = state.sessions.length > 0 ? state.sessions[0].id : null;
      }
    },

    setCurrentSession: (state, action: PayloadAction<string>) => {
      state.currentSessionId = action.payload;
    },

    renameSession: (state, action: PayloadAction<{ sessionId: string; name: string }>) => {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) {
        session.name = action.payload.name;
        session.updatedAt = Date.now();
      }
    },

    // Message management
    addMessage: (state, action: PayloadAction<Omit<ChatMessage, 'id' | 'timestamp'>>) => {
      const currentSession = state.sessions.find(s => s.id === state.currentSessionId);
      if (currentSession) {
        const newMessage: ChatMessage = {
          id: generateId(),
          ...action.payload,
          timestamp: Date.now(),
        };
        currentSession.messages.push(newMessage);
        currentSession.updatedAt = Date.now();
      }
    },

    deleteMessage: (state, action: PayloadAction<{ sessionId: string; messageId: string }>) => {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) {
        session.messages = session.messages.filter(m => m.id !== action.payload.messageId);
        session.updatedAt = Date.now();
      }
    },

    editMessage: (state, action: PayloadAction<{ sessionId: string; messageId: string; content: string }>) => {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      if (session) {
        const message = session.messages.find(m => m.id === action.payload.messageId);
        if (message) {
          message.content = action.payload.content;
          session.updatedAt = Date.now();
        }
      }
    },

    // UI state
    setIsTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },

    setPendingMessage: (state, action: PayloadAction<string>) => {
      state.pendingMessage = action.payload;
    },

    setIsProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // LLM context settings
    togglePatternContext: (state) => {
      state.llmContext.includePatternContext = !state.llmContext.includePatternContext;
    },

    toggleAudioContext: (state) => {
      state.llmContext.includeAudioContext = !state.llmContext.includeAudioContext;
    },

    setContextWindowSize: (state, action: PayloadAction<number>) => {
      state.llmContext.contextWindowSize = action.payload;
    },

    // Link messages to patterns or audio segments
    linkMessageToPattern: (state, action: PayloadAction<{ messageId: string; patternId: string }>) => {
      const currentSession = state.sessions.find(s => s.id === state.currentSessionId);
      if (currentSession) {
        const message = currentSession.messages.find(m => m.id === action.payload.messageId);
        if (message) {
          if (!message.relatedPatternIds) {
            message.relatedPatternIds = [];
          }
          if (!message.relatedPatternIds.includes(action.payload.patternId)) {
            message.relatedPatternIds.push(action.payload.patternId);
          }
        }
      }
    },

    linkMessageToAudioSegment: (state, action: PayloadAction<{
      messageId: string;
      segment: { start: number; end: number }
    }>) => {
      const currentSession = state.sessions.find(s => s.id === state.currentSessionId);
      if (currentSession) {
        const message = currentSession.messages.find(m => m.id === action.payload.messageId);
        if (message) {
          message.relatedAudioSegment = action.payload.segment;
        }
      }
    },
  },
});

// Export actions and reducer
export const {
  // Session management
  createSession,
  deleteSession,
  setCurrentSession,
  renameSession,

  // Message management
  addMessage,
  deleteMessage,
  editMessage,

  // UI state
  setIsTyping,
  setPendingMessage,
  setIsProcessing,
  setError,

  // LLM context settings
  togglePatternContext,
  toggleAudioContext,
  setContextWindowSize,

  // Linking
  linkMessageToPattern,
  linkMessageToAudioSegment,
} = chatSlice.actions;

export default chatSlice.reducer;

// Export types for use in other files
export type { ChatMessage, ChatSession };
