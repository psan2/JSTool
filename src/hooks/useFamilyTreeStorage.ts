import { useEffect } from 'react';
import { useFamilyTree, generateId } from '../context/FamilyTreeContext';
import { StorageService } from '../services/StorageService';
import { FamilyTreeService } from '../services/FamilyTreeService';
import { Ancestor } from '../types';
import { TypeGuards } from '../types/guards';

export const useFamilyTreeStorage = () => {
  const { state, dispatch, ancestors, selfAncestor } = useFamilyTree();

  // Initialize data from storage on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Try to load from URL first
        const urlResult = StorageService.loadFromUrlOnInit();

        if (urlResult.data) {
          // Validate imported data
          if (TypeGuards.isFamilyHistoryData(urlResult.data)) {
            dispatch({ type: 'SET_DATA', payload: urlResult.data });

            if (urlResult.shouldCleanUrl) {
              StorageService.cleanUrlAfterImport();
            }
            return;
          }
        }

        // Load from localStorage
        const storedData = StorageService.loadFromStorage();

        // If no ancestors exist, create a default "Self" ancestor
        if (storedData.ancestors.length === 0) {
          const now = Date.now();
          const selfAncestor: Ancestor = {
            id: generateId(),
            firstName: 'Self',
            generation: 0,
            createdAt: now,
            updatedAt: now
          };

          const dataWithSelf = {
            ...storedData,
            ancestors: [selfAncestor]
          };

          StorageService.saveToStorage(dataWithSelf);
          dispatch({ type: 'SET_DATA', payload: dataWithSelf });
        } else {
          dispatch({ type: 'SET_DATA', payload: storedData });
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        // Create default data on error
        const emptyData = StorageService.createEmptyData();
        dispatch({ type: 'SET_DATA', payload: emptyData });
      }
    };

    initializeData();
  }, [dispatch]);

  // Save to storage whenever data changes
  useEffect(() => {
    if (state.data.ancestors.length > 0) {
      try {
        StorageService.saveToStorage(state.data);
      } catch (error) {
        console.error('Error saving to storage:', error);
      }
    }
  }, [state.data]);

  // CRUD operations with immediate state updates
  const addAncestor = (ancestorData: Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'>): { ancestor: Ancestor; updatedAncestors: Ancestor[] } => {
    const now = Date.now();
    const newAncestor: Ancestor = {
      ...ancestorData,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    };

    // Handle bidirectional relationships
    const updatedAncestors = FamilyTreeService.updateBidirectionalRelationships(
      [...ancestors, newAncestor],
      newAncestor
    );

    dispatch({
      type: 'SET_DATA',
      payload: {
        ...state.data,
        ancestors: updatedAncestors,
        updatedAt: now
      }
    });

    return { ancestor: newAncestor, updatedAncestors };
  };

  const updateAncestor = (id: string, updates: Partial<Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'>>, currentAncestors?: Ancestor[]): Ancestor | null => {
    if (!TypeGuards.isValidAncestorId(id)) {
      console.error('Invalid ancestor ID:', id);
      return null;
    }

    // Use provided ancestors or current state
    const ancestorsToUse = currentAncestors || ancestors;
    const existingAncestor = ancestorsToUse.find(a => a.id === id);

    if (!existingAncestor) {
      console.error('Ancestor not found:', id);
      return null;
    }

    const updatedAncestor: Ancestor = {
      ...existingAncestor,
      ...updates,
      updatedAt: Date.now()
    };

    // Handle bidirectional relationships
    const updatedAncestors = ancestorsToUse.map(a => a.id === id ? updatedAncestor : a);
    const finalAncestors = FamilyTreeService.updateBidirectionalRelationships(updatedAncestors, updatedAncestor);

    dispatch({
      type: 'SET_DATA',
      payload: {
        ...state.data,
        ancestors: finalAncestors,
        updatedAt: Date.now()
      }
    });

    return updatedAncestor;
  };

  const deleteAncestor = (id: string): boolean => {
    if (!TypeGuards.isValidAncestorId(id)) {
      console.error('Invalid ancestor ID:', id);
      return false;
    }

    const ancestorExists = ancestors.some(a => a.id === id);
    if (!ancestorExists) {
      console.error('Ancestor not found:', id);
      return false;
    }

    dispatch({ type: 'DELETE_ANCESTOR', payload: id });
    return true;
  };

  const batchUpdateAncestors = (updatedAncestors: Ancestor[]): boolean => {
    try {
      dispatch({
        type: 'SET_DATA',
        payload: {
          ...state.data,
          ancestors: updatedAncestors,
          updatedAt: Date.now()
        }
      });
      return true;
    } catch (error) {
      console.error('Error in batch update:', error);
      return false;
    }
  };

  const clearAllData = (): void => {
    const now = Date.now();
    const selfAncestor: Ancestor = {
      id: generateId(),
      firstName: 'Self',
      generation: 0,
      createdAt: now,
      updatedAt: now
    };

    dispatch({ type: 'CLEAR_ALL_DATA', payload: selfAncestor });
  };

  // Import/Export operations
  const importData = (jsonString: string): boolean => {
    try {
      const importedData = StorageService.importData(jsonString);
      if (TypeGuards.isFamilyHistoryData(importedData)) {
        dispatch({ type: 'SET_DATA', payload: importedData });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  };

  const importFromBase64 = (base64String: string): boolean => {
    try {
      const importedData = StorageService.importFromBase64(base64String);
      if (TypeGuards.isFamilyHistoryData(importedData)) {
        dispatch({ type: 'SET_DATA', payload: importedData });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing from base64:', error);
      return false;
    }
  };

  const importFromUrl = (url: string): boolean => {
    try {
      const importedData = StorageService.importFromUrl(url);
      if (TypeGuards.isFamilyHistoryData(importedData)) {
        dispatch({ type: 'SET_DATA', payload: importedData });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing from URL:', error);
      return false;
    }
  };

  const exportData = (): string => {
    return StorageService.exportData(state.data);
  };

  const exportAsBase64 = (): string => {
    return StorageService.exportAsBase64(state.data);
  };

  const exportAsUrl = (): string => {
    return StorageService.exportAsUrl(state.data);
  };

  const getDataInfo = () => {
    return {
      ancestorCount: ancestors.length,
      lastUpdated: new Date(state.data.updatedAt),
      version: state.data.version
    };
  };

  return {
    // State
    ancestors,
    selfAncestor,
    isLoading: state.isLoading,
    error: state.error,

    // CRUD operations
    addAncestor,
    updateAncestor,
    deleteAncestor,
    batchUpdateAncestors,
    clearAllData,

    // Import/Export
    importData,
    importFromBase64,
    importFromUrl,
    exportData,
    exportAsBase64,
    exportAsUrl,
    getDataInfo
  };
};
