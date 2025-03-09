import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../ui/state/store';
import {
  addMessage,
  setIsTyping,
  setPendingMessage,
  setIsProcessing,
  togglePatternContext,
  toggleAudioContext
} from '../../ui/state/chatSlice';

const ChatInterface: React.FC = () => {
  const dispatch = useDispatch();

  // Get state from Redux
  const {
    sessions,
    currentSessionId,
    isTyping,
    pendingMessage,
    isProcessing,
    llmContext
  } = useSelector((state: RootState) => state.chat);

  // Get current session and messages
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  // Refs for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(setPendingMessage(e.target.value));
  };

  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pendingMessage.trim() || isProcessing) return;

    // Add user message
    dispatch(addMessage({
      role: 'user',
      content: pendingMessage
    }));

    // Clear input
    dispatch(setPendingMessage(''));

    // Simulate processing
    dispatch(setIsProcessing(true));

    // Simulate AI response after a delay
    setTimeout(() => {
      dispatch(addMessage({
        role: 'assistant',
        content: `I've analyzed the audio patterns in your request. The spectral visualization shows interesting frequency distributions around ${Math.floor(Math.random() * 5000) + 1000}Hz.`
      }));
      dispatch(setIsProcessing(false));
    }, 1500);
  };

  // Handle context toggle
  const handlePatternContextToggle = () => {
    dispatch(togglePatternContext());
  };

  const handleAudioContextToggle = () => {
    dispatch(toggleAudioContext());
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Chat Header */}
      <div className="px-4 py-2 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-sm font-medium text-white">AI Assistant</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePatternContextToggle}
            className={`px-2 py-1 text-xs rounded ${
              llmContext.includePatternContext
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Pattern Context
          </button>
          <button
            onClick={handleAudioContextToggle}
            className={`px-2 py-1 text-xs rounded ${
              llmContext.includeAudioContext
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            Audio Context
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <p className="text-sm">No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3/4 rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'system'
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-800 text-gray-200'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className="text-xs mt-1 opacity-70 text-right">
                  {formatTime(message.timestamp)}
                </div>

                {/* Pattern reference if available */}
                {message.relatedPatternIds && message.relatedPatternIds.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-gray-600 text-xs">
                    <span className="opacity-70">Related patterns: </span>
                    {message.relatedPatternIds.map((id, index) => (
                      <span key={id} className="bg-blue-900 px-1 rounded text-blue-200 text-xs mr-1">
                        {id.substring(0, 6)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg px-4 py-2 text-gray-300">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-800 rounded-lg px-4 py-2 text-gray-300">
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-sm">Processing your request...</span>
              </div>
            </div>
          </div>
        )}

        {/* Invisible element for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex items-center">
          <textarea
            value={pendingMessage}
            onChange={handleInputChange}
            placeholder="Ask about audio patterns or visualization..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded-l-md px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-10 max-h-32 overflow-auto"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={!pendingMessage.trim() || isProcessing}
            className={`px-4 py-2 h-10 rounded-r-md ${
              !pendingMessage.trim() || isProcessing
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
