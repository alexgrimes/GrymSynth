import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { ResourceProcessor } from '../lib/processors/resourceProcessor';
import type { Resource, ResourceSubmission } from '../lib/types';

interface ResourceContextType {
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
  addResource: (submission: ResourceSubmission) => Promise<void>;
  getResourcesByTopic: (topic: string) => Promise<Resource[]>;
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);
const processor = new ResourceProcessor();

export function ResourceProvider({ children }: { children: React.ReactNode }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial resources
  useEffect(() => {
    loadResources();
  }, []);

  async function loadResources() {
    try {
      setIsLoading(true);
      const loaded = await storage.getAllResources();
      setResources(loaded);
    } catch (error) {
      setError('Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  }

  async function addResource(submission: ResourceSubmission) {
    try {
      setIsLoading(true);
      const processed = await processor.processUrl(submission);
      await storage.saveResource(processed);
      setResources(prev => [...prev, processed]);
    } catch (error) {
      setError('Failed to add resource');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function getResourcesByTopic(topic: string) {
    return storage.getResourcesByTopic(topic);
  }

  return (
    <ResourceContext.Provider value={{
      resources,
      isLoading,
      error,
      addResource,
      getResourcesByTopic,
    }}>
      {children}
    </ResourceContext.Provider>
  );
}

export const useResources = () => {
  const context = useContext(ResourceContext);
  if (!context) {
    throw new Error('useResources must be used within a ResourceProvider');
  }
  return context;
};