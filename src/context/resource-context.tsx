'use client';

import { createContext, useContext, useState } from 'react';
import { Resource } from '@shared/types';

interface ResourceContextType {
  resources: Resource[];
  selectedResource: Resource | null;
  addResource: (resource: Resource) => void;
  selectResource: (resource: Resource | null) => void;
}

const ResourceContext = createContext<ResourceContextType>({
  resources: [],
  selectedResource: null,
  addResource: () => {},
  selectResource: () => {},
});

export function ResourceProvider({ children }: { children: React.ReactNode }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const addResource = (resource: Resource) => {
    setResources(prev => [resource, ...prev]);
    setSelectedResource(resource);
  };

  const selectResource = (resource: Resource | null) => {
    setSelectedResource(resource);
  };

  return (
    <ResourceContext.Provider 
      value={{ 
        resources, 
        selectedResource,
        addResource,
        selectResource
      }}
    >
      {children}
    </ResourceContext.Provider>
  );
}

export function useResourceContext() {
  return useContext(ResourceContext);
}