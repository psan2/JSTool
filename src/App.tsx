import React, { useState } from 'react';
import { useNotification } from './hooks/useNotification';
import { useFamilyTreeStorage } from './hooks/useFamilyTreeStorage';
import { FamilyTreeService } from './services/FamilyTreeService';
import { Ancestor } from './types';
import { TypeGuards, ValidatedFormData } from './types/guards';
import Header from './components/Header';
import Controls from './components/Controls';
import FamilyTreeGraph from './components/FamilyTreeGraph';
import AncestorModal from './components/AncestorModal';
import ImportExportModal from './components/ImportExportModal';
import NotificationContainer from './components/NotificationContainer';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const storage = useFamilyTreeStorage();
  const { notifications, showNotification, removeNotification } = useNotification();

  const [isAncestorModalOpen, setIsAncestorModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [editingAncestor, setEditingAncestor] = useState<Ancestor | null>(null);

  // Handle any storage errors
  if (storage.error) {
    console.error('Storage error:', storage.error);
    // Could show error notification or handle gracefully
  }

  const handleAddAncestor = () => {
    setEditingAncestor(null);
    setIsAncestorModalOpen(true);
  };

  const handleEditAncestor = (ancestor: Ancestor) => {
    console.log('Editing ancestor:', ancestor); // Debug log
    setEditingAncestor(ancestor);
    setIsAncestorModalOpen(true);
  };

  const handleDeleteAncestor = (id: string) => {
    if (window.confirm('Are you sure you want to delete this ancestor? This action cannot be undone.')) {
      if (storage.deleteAncestor(id)) {
        showNotification('Ancestor deleted successfully.', 'success');
      } else {
        showNotification('Failed to delete ancestor.', 'error');
      }
    }
  };

  const handleSaveAncestor = (formData: ValidatedFormData) => {
    try {
      // Extract children IDs with proper type checking
      const selectedChildrenIds = formData.selectedChildrenIds || [];

      if (!TypeGuards.isValidAncestorIdArray(selectedChildrenIds)) {
        showNotification('Invalid children data.', 'error');
        return;
      }

      // Clean the ancestor data
      const { selectedChildrenIds: _, ...cleanAncestorData } = formData;

      let savedAncestor: Ancestor;

      if (editingAncestor) {
        console.log('Updating existing ancestor:', editingAncestor.id);
        const updated = storage.updateAncestor(editingAncestor.id, cleanAncestorData);
        if (updated) {
          savedAncestor = updated;
          showNotification('Person updated successfully!', 'success');
        } else {
          showNotification('Failed to update person.', 'error');
          return;
        }
      } else {
        console.log('Adding new ancestor');
        const result = storage.addAncestor(cleanAncestorData);
        savedAncestor = result.ancestor;
        showNotification('Person added successfully!', 'success');
      }

      // Handle children relationships with proper validation
      if (selectedChildrenIds.length > 0) {
        selectedChildrenIds.forEach(childId => {
          const child = storage.ancestors.find(a => a.id === childId);
          if (child && TypeGuards.isAncestor(child)) {
            // Check if we're already a parent
            const isCurrentlyParent = child.parent1Id === savedAncestor.id || child.parent2Id === savedAncestor.id;

            if (!isCurrentlyParent) {
              // Determine if we should be parent1 or parent2
              const updates: Partial<Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'>> = {};

              if (!child.parent1Id) {
                updates.parent1Id = savedAncestor.id;
              } else if (!child.parent2Id) {
                updates.parent2Id = savedAncestor.id;
              }

              if (Object.keys(updates).length > 0) {
                storage.updateAncestor(childId, updates);
              }
            }
          }
        });
      }

      // Handle removed children (if editing existing ancestor)
      if (editingAncestor) {
        const currentChildren = storage.ancestors.filter(a =>
          a.parent1Id === editingAncestor.id || a.parent2Id === editingAncestor.id
        );

        currentChildren.forEach(child => {
          if (!selectedChildrenIds.includes(child.id)) {
            // This child was removed, update their parent relationships
            const updates: Partial<Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'>> = {};

            if (child.parent1Id === editingAncestor.id) {
              updates.parent1Id = child.parent2Id;
              updates.parent2Id = undefined;
            } else if (child.parent2Id === editingAncestor.id) {
              updates.parent2Id = undefined;
            }

            if (Object.keys(updates).length > 0) {
              storage.updateAncestor(child.id, updates);
            }
          }
        });
      }

      setIsAncestorModalOpen(false);
      setEditingAncestor(null);
    } catch (error) {
      console.error('Error saving ancestor:', error);
      showNotification('Failed to save person.', 'error');
    }
  };

  const handleAddParent = (childId: string) => {
    console.log('handleAddParent called for childId:', childId); // Debug log

    const child = storage.ancestors.find(a => a.id === childId);
    if (!child) {
      console.error('Child not found:', childId);
      showNotification('Error: Child not found.', 'error');
      return;
    }

    console.log('Found child:', child); // Debug log

    // Check if child already has both parents
    if (child.parent1Id && child.parent2Id) {
      console.log('Child already has both parents'); // Debug log
      showNotification('This person already has two parents assigned.', 'error');
      return;
    }

    // Create a new parent ancestor
    const parentData: Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'> = {};
    const parentResult = storage.addAncestor(parentData);
    const newParent = parentResult.ancestor;
    const updatedAncestorsAfterParentAdd = parentResult.updatedAncestors;

    console.log('Created new parent:', newParent); // Debug log

    // Link the parent to the child using the updated ancestors array (not stale storage data)
    const updates: Partial<Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'>> = {};
    if (!child.parent1Id) {
      updates.parent1Id = newParent.id;
      console.log('Setting as parent1Id:', newParent.id); // Debug log
    } else if (!child.parent2Id) {
      updates.parent2Id = newParent.id;
      console.log('Setting as parent2Id:', newParent.id); // Debug log
    }

    console.log('Updating child with:', updates); // Debug log
    const updateResult = storage.updateAncestor(childId, updates, updatedAncestorsAfterParentAdd);

    if (!updateResult) {
      console.error('Failed to update child ancestor'); // Debug log
      showNotification('Failed to update person.', 'error');
      return;
    }

    console.log('Successfully updated child'); // Debug log

    // Open the edit modal for the new parent
    setEditingAncestor(newParent);
    setIsAncestorModalOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    // Create a new child ancestor
    const childData: Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'> = {
      parent1Id: parentId
    };
    const result = storage.addAncestor(childData);
    const newChild = result.ancestor;

    // Open the edit modal for the new child
    setEditingAncestor(newChild);
    setIsAncestorModalOpen(true);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      storage.clearAllData();
      showNotification('All data cleared.', 'success');
    }
  };

  const handleImportData = (data: string) => {
    let success = false;

    // Try to import as URL first
    if (data.includes('://')) {
      success = storage.importFromUrl(data);
    } else {
      // Try as base64 encoded data
      success = storage.importFromBase64(data);
    }

    if (success) {
      showNotification('Data imported successfully!', 'success');
      setIsImportExportModalOpen(false);
    } else {
      showNotification('Failed to import data. Please check the format.', 'error');
    }
  };

  const handleCopyUrl = async () => {
    try {
      const url = storage.exportAsUrl();
      await navigator.clipboard.writeText(url);
      showNotification('Shareable URL copied to clipboard!', 'success');
    } catch {
      showNotification('Failed to copy URL to clipboard.', 'error');
    }
  };

  const handleCopyData = async () => {
    try {
      const data = storage.exportAsBase64();
      await navigator.clipboard.writeText(data);
      showNotification('Data string copied to clipboard!', 'success');
    } catch {
      showNotification('Failed to copy data to clipboard.', 'error');
    }
  };


  return (
    <ErrorBoundary>
      <div className="container">
        <Header />

        <Controls
          onAddAncestor={handleAddAncestor}
          onImportExport={() => setIsImportExportModalOpen(true)}
          onClearAll={handleClearAll}
        />

        <FamilyTreeGraph
          ancestors={storage.ancestors}
          onEditAncestor={handleEditAncestor}
          onDeleteAncestor={handleDeleteAncestor}
          onAddParent={handleAddParent}
          onAddChild={handleAddChild}
        />

        {isAncestorModalOpen && (
          <AncestorModal
            ancestor={editingAncestor}
            availablePartners={storage.ancestors}
            onSave={handleSaveAncestor}
            onClose={() => {
              setIsAncestorModalOpen(false);
              setEditingAncestor(null);
            }}
          />
        )}

        {isImportExportModalOpen && (
          <ImportExportModal
            exportData={storage.exportAsBase64()}
            onImport={handleImportData}
            onCopyUrl={handleCopyUrl}
            onCopyData={handleCopyData}
            onClose={() => setIsImportExportModalOpen(false)}
          />
        )}

        <NotificationContainer
          notifications={notifications}
          onRemove={removeNotification}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
