import React, { useState } from 'react';
import { useStorage } from './hooks/useStorage';
import { useNotification } from './hooks/useNotification';
import { Ancestor } from './types';
import Header from './components/Header';
import Controls from './components/Controls';
import FamilyTree from './components/FamilyTree';
import AncestorModal from './components/AncestorModal';
import ImportExportModal from './components/ImportExportModal';
import NotificationContainer from './components/NotificationContainer';

function App() {
  const storage = useStorage();
  const { notifications, showNotification, removeNotification } = useNotification();

  const [isAncestorModalOpen, setIsAncestorModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [editingAncestor, setEditingAncestor] = useState<Ancestor | null>(null);

  const handleAddAncestor = () => {
    setEditingAncestor(null);
    setIsAncestorModalOpen(true);
  };

  const handleEditAncestor = (ancestor: Ancestor) => {
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

  const handleSaveAncestor = (ancestorData: Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Extract children IDs if they exist
      const selectedChildrenIds = (ancestorData as any).selectedChildrenIds as string[] || [];

      // Clean the ancestor data
      const cleanAncestorData = { ...ancestorData };
      delete (cleanAncestorData as any).selectedChildrenIds;

      let savedAncestor: Ancestor;

      if (editingAncestor) {
        const updated = storage.updateAncestor(editingAncestor.id, cleanAncestorData);
        if (updated) {
          savedAncestor = updated;
          showNotification('Ancestor updated successfully!', 'success');
        } else {
          showNotification('Failed to update ancestor.', 'error');
          return;
        }
      } else {
        savedAncestor = storage.addAncestor(cleanAncestorData);
        showNotification('Ancestor added successfully!', 'success');
      }

      // Handle children relationships
      if (selectedChildrenIds.length > 0) {
        selectedChildrenIds.forEach(childId => {
          const child = storage.ancestors.find(a => a.id === childId);
          if (child) {
            // Determine if we should be parent1 or parent2
            const updates: Partial<Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'>> = {};

            if (!child.parent1Id) {
              updates.parent1Id = savedAncestor.id;
            } else if (!child.parent2Id) {
              updates.parent2Id = savedAncestor.id;
            } else if (child.parent1Id === savedAncestor.id || child.parent2Id === savedAncestor.id) {
              // Already a parent, no change needed
              return;
            }

            if (Object.keys(updates).length > 0) {
              storage.updateAncestor(childId, updates);
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
      showNotification('Failed to save ancestor.', 'error');
    }
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
    <div className="container">
      <Header />

      <Controls
        onAddAncestor={handleAddAncestor}
        onImportExport={() => setIsImportExportModalOpen(true)}
        onClearAll={handleClearAll}
      />

      <FamilyTree
        ancestors={storage.ancestors}
        onEditAncestor={handleEditAncestor}
        onDeleteAncestor={handleDeleteAncestor}
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
  );
}

export default App;
