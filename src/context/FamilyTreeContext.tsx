import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Ancestor, FamilyHistoryData } from '../types';

// Action types
type FamilyTreeAction =
  | { type: 'SET_DATA'; payload: FamilyHistoryData }
  | { type: 'ADD_ANCESTOR'; payload: Ancestor }
  | { type: 'UPDATE_ANCESTOR'; payload: { id: string; updates: Partial<Ancestor> } }
  | { type: 'DELETE_ANCESTOR'; payload: string }
  | { type: 'CLEAR_ALL_DATA'; payload: Ancestor } // payload is the new Self ancestor

// State interface
interface FamilyTreeState {
  data: FamilyHistoryData;
  isLoading: boolean;
  error: string | null;
}

// Context interface
interface FamilyTreeContextType {
  state: FamilyTreeState;
  dispatch: React.Dispatch<FamilyTreeAction>;
  // Computed values
  ancestors: Ancestor[];
  selfAncestor: Ancestor | null;
}

// Initial state
const initialState: FamilyTreeState = {
  data: {
    ancestors: [],
    version: '2.0.0',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  isLoading: false,
  error: null
};

// Reducer function
function familyTreeReducer(state: FamilyTreeState, action: FamilyTreeAction): FamilyTreeState {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        error: null
      };

    case 'ADD_ANCESTOR':
      return {
        ...state,
        data: {
          ...state.data,
          ancestors: [...state.data.ancestors, action.payload],
          updatedAt: Date.now()
        },
        error: null
      };

    case 'UPDATE_ANCESTOR':
      const { id, updates } = action.payload;
      const ancestorIndex = state.data.ancestors.findIndex(a => a.id === id);

      if (ancestorIndex === -1) {
        return {
          ...state,
          error: `Ancestor with id ${id} not found`
        };
      }

      const updatedAncestors = [...state.data.ancestors];
      updatedAncestors[ancestorIndex] = {
        ...updatedAncestors[ancestorIndex],
        ...updates,
        updatedAt: Date.now()
      };

      return {
        ...state,
        data: {
          ...state.data,
          ancestors: updatedAncestors,
          updatedAt: Date.now()
        },
        error: null
      };

    case 'DELETE_ANCESTOR':
      return {
        ...state,
        data: {
          ...state.data,
          ancestors: state.data.ancestors.filter(a => a.id !== action.payload),
          updatedAt: Date.now()
        },
        error: null
      };

    case 'CLEAR_ALL_DATA':
      return {
        ...state,
        data: {
          ancestors: [action.payload], // New Self ancestor
          version: '2.0.0',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        error: null
      };

    default:
      return state;
  }
}

// Create context
const FamilyTreeContext = createContext<FamilyTreeContextType | null>(null);

// Provider component
interface FamilyTreeProviderProps {
  children: ReactNode;
  initialData?: FamilyHistoryData;
}

export const FamilyTreeProvider: React.FC<FamilyTreeProviderProps> = ({
  children,
  initialData
}) => {
  const [state, dispatch] = useReducer(familyTreeReducer, {
    ...initialState,
    data: initialData || initialState.data
  });

  // Computed values
  const ancestors = state.data.ancestors;
  const selfAncestor = ancestors.find(a => !a.parent1Id && !a.parent2Id) || ancestors[0] || null;

  const contextValue: FamilyTreeContextType = {
    state,
    dispatch,
    ancestors,
    selfAncestor
  };

  return (
    <FamilyTreeContext.Provider value={contextValue}>
      {children}
    </FamilyTreeContext.Provider>
  );
};

// Custom hook to use the context
export const useFamilyTree = (): FamilyTreeContextType => {
  const context = useContext(FamilyTreeContext);
  if (!context) {
    throw new Error('useFamilyTree must be used within a FamilyTreeProvider');
  }
  return context;
};

// Helper function to generate unique IDs
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
