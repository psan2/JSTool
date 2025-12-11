import { useState, useEffect, useCallback } from 'react';
import { Ancestor, FamilyHistoryData, LocationEvent } from '../types';

const STORAGE_KEY = 'family-history-data';
const CURRENT_VERSION = '2.0.0';

export const useStorage = () => {
  const [data, setData] = useState<FamilyHistoryData>(() => loadFromStorage());

  const createEmptyData = useCallback((): FamilyHistoryData => {
    const now = Date.now();
    return {
      ancestors: [],
      version: CURRENT_VERSION,
      createdAt: now,
      updatedAt: now
    };
  }, []);

  function loadFromStorage(): FamilyHistoryData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        const now = Date.now();
        return {
          ancestors: [],
          version: CURRENT_VERSION,
          createdAt: now,
          updatedAt: now
        };
      }

      const parsed = JSON.parse(stored) as FamilyHistoryData;

      // Validate the structure
      if (!parsed.ancestors || !Array.isArray(parsed.ancestors)) {
        console.warn('Invalid data structure in storage, creating new data');
        const now = Date.now();
        return {
          ancestors: [],
          version: CURRENT_VERSION,
          createdAt: now,
          updatedAt: now
        };
      }

      return parsed;
    } catch (error) {
      console.error('Error loading data from storage:', error);
      const now = Date.now();
      return {
        ancestors: [],
        version: CURRENT_VERSION,
        createdAt: now,
        updatedAt: now
      };
    }
  }

  const saveToStorage = useCallback((newData: FamilyHistoryData) => {
    try {
      const updatedData = { ...newData, updatedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      setData(updatedData);
    } catch (error) {
      console.error('Error saving data to storage:', error);
      throw new Error('Failed to save data to local storage');
    }
  }, []);

  const addAncestor = useCallback((ancestor: Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'>): Ancestor => {
    const now = Date.now();
    const newAncestor: Ancestor = {
      ...ancestor,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };

    let updatedAncestors = [...data.ancestors, newAncestor];

    // Handle bidirectional relationships for marriages and divorces
    updatedAncestors = updateBidirectionalRelationships(updatedAncestors, newAncestor);

    const newData = {
      ...data,
      ancestors: updatedAncestors
    };

    saveToStorage(newData);
    return newAncestor;
  }, [data, saveToStorage]);

  const updateAncestor = useCallback((id: string, updates: Partial<Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'>>): Ancestor | null => {
    const index = data.ancestors.findIndex(a => a.id === id);
    if (index === -1) {
      return null;
    }

    const updatedAncestor = {
      ...data.ancestors[index],
      ...updates,
      updatedAt: Date.now()
    };

    let newAncestors = [...data.ancestors];
    newAncestors[index] = updatedAncestor;

    // Handle bidirectional relationships for marriages and divorces
    newAncestors = updateBidirectionalRelationships(newAncestors, updatedAncestor);

    const newData = {
      ...data,
      ancestors: newAncestors
    };

    saveToStorage(newData);
    return updatedAncestor;
  }, [data, saveToStorage]);

  const deleteAncestor = useCallback((id: string): boolean => {
    const index = data.ancestors.findIndex(a => a.id === id);
    if (index === -1) {
      return false;
    }

    const newAncestors = data.ancestors.filter(a => a.id !== id);
    const newData = {
      ...data,
      ancestors: newAncestors
    };

    saveToStorage(newData);
    return true;
  }, [data, saveToStorage]);

  const clearAllData = useCallback(() => {
    const emptyData = createEmptyData();
    saveToStorage(emptyData);
  }, [createEmptyData, saveToStorage]);

  const exportData = useCallback((): string => {
    return JSON.stringify(data);
  }, [data]);

  const exportAsBase64 = useCallback((): string => {
    const jsonString = exportData();
    return btoa(encodeURIComponent(jsonString));
  }, [exportData]);

  const exportAsUrl = useCallback((): string => {
    const base64Data = exportAsBase64();
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('data', base64Data);
    return currentUrl.toString();
  }, [exportAsBase64]);

  const importData = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString) as FamilyHistoryData;

      // Validate the structure
      if (!parsed.ancestors || !Array.isArray(parsed.ancestors)) {
        throw new Error('Invalid data structure');
      }

      // Validate each ancestor has required fields
      for (const ancestor of parsed.ancestors) {
        if (!ancestor.id || !ancestor.relationship) {
          throw new Error('Invalid ancestor data structure');
        }
      }

      const importedData = {
        ...parsed,
        updatedAt: Date.now()
      };

      saveToStorage(importedData);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }, [saveToStorage]);

  const importFromBase64 = useCallback((base64String: string): boolean => {
    try {
      const jsonString = decodeURIComponent(atob(base64String));
      return importData(jsonString);
    } catch (error) {
      console.error('Error decoding base64 data:', error);
      return false;
    }
  }, [importData]);

  const importFromUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url);
      const dataParam = urlObj.searchParams.get('data');
      if (!dataParam) {
        throw new Error('No data parameter found in URL');
      }
      return importFromBase64(dataParam);
    } catch (error) {
      console.error('Error importing from URL:', error);
      return false;
    }
  }, [importFromBase64]);

  const loadFromUrlOnInit = useCallback((): boolean => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('data');
      if (dataParam) {
        const success = importFromBase64(dataParam);
        if (success) {
          // Clean up URL after successful import
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('data');
          window.history.replaceState({}, document.title, newUrl.toString());
        }
        return success;
      }
      return false;
    } catch (error) {
      console.error('Error loading from URL on init:', error);
      return false;
    }
  }, [importFromBase64]);

  const getDataInfo = useCallback(() => {
    return {
      ancestorCount: data.ancestors.length,
      lastUpdated: new Date(data.updatedAt),
      version: data.version
    };
  }, [data]);

  // Load data from URL on mount
  useEffect(() => {
    const loaded = loadFromUrlOnInit();
    if (loaded) {
      // Data will be updated through the importFromBase64 callback
    }
  }, [loadFromUrlOnInit]);

  return {
    ancestors: data.ancestors,
    addAncestor,
    updateAncestor,
    deleteAncestor,
    clearAllData,
    exportData,
    exportAsBase64,
    exportAsUrl,
    importData,
    importFromBase64,
    importFromUrl,
    getDataInfo
  };
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function updateBidirectionalRelationships(ancestors: Ancestor[], changedAncestor: Ancestor): Ancestor[] {
  const updatedAncestors = [...ancestors];

  // Handle marriages
  if (changedAncestor.marriages) {
    changedAncestor.marriages.forEach(marriage => {
      if (marriage.partnerId) {
        const partnerIndex = updatedAncestors.findIndex(a => a.id === marriage.partnerId);
        if (partnerIndex !== -1) {
          const partner = updatedAncestors[partnerIndex];

          // Check if partner already has this marriage
          const partnerMarriages = partner.marriages || [];
          const hasExistingMarriage = partnerMarriages.some(m => m.partnerId === changedAncestor.id);

          if (!hasExistingMarriage) {
            // Add the reciprocal marriage to the partner
            const reciprocalMarriage: LocationEvent = {
              ...marriage,
              partnerId: changedAncestor.id
            };

            updatedAncestors[partnerIndex] = {
              ...partner,
              marriages: [...partnerMarriages, reciprocalMarriage],
              updatedAt: Date.now()
            };
          }
        }
      }
    });
  }

  // Handle divorces
  if (changedAncestor.divorces) {
    changedAncestor.divorces.forEach(divorce => {
      if (divorce.partnerId) {
        const partnerIndex = updatedAncestors.findIndex(a => a.id === divorce.partnerId);
        if (partnerIndex !== -1) {
          const partner = updatedAncestors[partnerIndex];

          // Check if partner already has this divorce
          const partnerDivorces = partner.divorces || [];
          const hasExistingDivorce = partnerDivorces.some(d => d.partnerId === changedAncestor.id);

          if (!hasExistingDivorce) {
            // Add the reciprocal divorce to the partner
            const reciprocalDivorce: LocationEvent = {
              ...divorce,
              partnerId: changedAncestor.id
            };

            updatedAncestors[partnerIndex] = {
              ...partner,
              divorces: [...partnerDivorces, reciprocalDivorce],
              updatedAt: Date.now()
            };
          }
        }
      }
    });
  }

  return updatedAncestors;
}
