import { useState } from "react";
import AncestorModal from "./components/AncestorModal";
import Controls from "./components/Controls";
import { ErrorBoundary } from "./components/ErrorBoundary";
import FamilyTreeGraph from "./components/FamilyTreeGraph";
import Header from "./components/Header";
import ImportExportModal from "./components/ImportExportModal";
import NotificationContainer from "./components/NotificationContainer";
import { useFamilyTreeStorage } from "./hooks/useFamilyTreeStorage";
import { useNotification } from "./hooks/useNotification";
import { FamilyTreeService } from "./services/FamilyTreeService";
import { Ancestor } from "./types";
import { TypeGuards, ValidatedFormData } from "./types/guards";

function App() {
  const storage = useFamilyTreeStorage();
  const { notifications, showNotification, removeNotification } =
    useNotification();

  const [isAncestorModalOpen, setIsAncestorModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [editingAncestor, setEditingAncestor] = useState<Ancestor | null>(null);

  // Handle any storage errors
  if (storage.error) {
    console.error("Storage error:", storage.error);
    // Could show error notification or handle gracefully
  }

  const handleAddAncestor = () => {
    setEditingAncestor(null);
    setIsAncestorModalOpen(true);
  };

  const handleEditAncestor = (ancestor: Ancestor) => {
    console.log("Editing ancestor:", ancestor); // Debug log
    setEditingAncestor(ancestor);
    setIsAncestorModalOpen(true);
  };

  const handleDeleteAncestor = (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this ancestor? This action cannot be undone."
      )
    ) {
      if (storage.deleteAncestor(id)) {
        showNotification("Ancestor deleted successfully.", "success");
      } else {
        showNotification("Failed to delete ancestor.", "error");
      }
    }
  };

  const handleSaveAncestor = (formData: ValidatedFormData) => {
    try {
      // Extract children IDs with proper type checking
      const selectedChildrenIds = formData.selectedChildrenIds || [];

      if (!TypeGuards.isValidAncestorIdArray(selectedChildrenIds)) {
        showNotification("Invalid children data.", "error");
        return;
      }

      // Clean the ancestor data
      const { selectedChildrenIds: _, ...cleanAncestorData } = formData;

      // Start with current ancestors array
      let workingAncestors = [...storage.ancestors];
      let savedAncestor: Ancestor;

      if (editingAncestor) {
        console.log("Updating existing ancestor:", editingAncestor.id);

        // Update the main ancestor
        const ancestorIndex = workingAncestors.findIndex(a => a.id === editingAncestor.id);
        if (ancestorIndex === -1) {
          showNotification("Failed to update person.", "error");
          return;
        }

        savedAncestor = {
          ...workingAncestors[ancestorIndex],
          ...cleanAncestorData,
          updatedAt: Date.now()
        };
        workingAncestors[ancestorIndex] = savedAncestor;

        console.log("SavedAncestor after main update:", savedAncestor); // Debug
        console.log("Selected children IDs:", selectedChildrenIds); // Debug

        // Handle children relationships - collect all updates first
        const childUpdates = new Map<string, Partial<Omit<Ancestor, "id" | "createdAt" | "updatedAt">>>();

        // Add new children relationships
        selectedChildrenIds.forEach((childId) => {
          const childInWorking = workingAncestors.find((a) => a.id === childId);
          if (childInWorking && TypeGuards.isAncestor(childInWorking)) {
            // Check if we're already a parent
            const currentParentIds = childInWorking.parentIds || [];
            const isCurrentlyParent = currentParentIds.includes(savedAncestor.id);

            if (!isCurrentlyParent) {
              const updates = childUpdates.get(childId) || {};
              // Add this ancestor as a parent
              updates.parentIds = [...currentParentIds, savedAncestor.id];
              childUpdates.set(childId, updates);
            }
          }
        });

        // Handle removed children
        const currentChildren = workingAncestors.filter(
          (a) => a.parentIds?.includes(editingAncestor.id)
        );

        currentChildren.forEach((child) => {
          if (!selectedChildrenIds.includes(child.id)) {
            const updates = childUpdates.get(child.id) || {};
            // Remove this ancestor from the child's parent list
            const currentParentIds = child.parentIds || [];
            updates.parentIds = currentParentIds.filter(id => id !== editingAncestor.id);
            if (updates.parentIds.length === 0) {
              updates.parentIds = undefined;
            }
            childUpdates.set(child.id, updates);
          }
        });

        console.log("Child updates to apply:", Array.from(childUpdates.entries())); // Debug

        // Apply all child updates to working array
        childUpdates.forEach((updates, childId) => {
          const childIndex = workingAncestors.findIndex(a => a.id === childId);
          if (childIndex !== -1) {
            console.log(`Applying updates to child ${childId}:`, updates); // Debug
            workingAncestors[childIndex] = {
              ...workingAncestors[childIndex],
              ...updates,
              updatedAt: Date.now()
            };
          }
        });

        console.log("Working ancestors before bidirectional update:", workingAncestors.map(a => ({ id: a.id, firstName: a.firstName, parentIds: a.parentIds }))); // Debug

        // Handle bidirectional relationships for the saved ancestor
        const finalAncestors = FamilyTreeService.updateBidirectionalRelationships(
          workingAncestors,
          savedAncestor
        );

        console.log("Final ancestors after bidirectional update:", finalAncestors.map(a => ({ id: a.id, firstName: a.firstName, parentIds: a.parentIds }))); // Debug

        // Now make a single state update with all changes
        if (storage.batchUpdateAncestors(finalAncestors)) {
          showNotification("Person updated successfully!", "success");
        } else {
          showNotification("Failed to update person.", "error");
          return;
        }
      } else {
        console.log("Adding new ancestor");
        // When adding a new ancestor manually, default to generation 0 if not specified
        const ancestorWithGeneration = {
          generation: 0,
          ...cleanAncestorData
        };
        const result = storage.addAncestor(ancestorWithGeneration);
        savedAncestor = result.ancestor;

        // Update working ancestors with the new ancestor
        workingAncestors = result.updatedAncestors;

        // Handle children relationships for new ancestor
        const childUpdates = new Map<string, Partial<Omit<Ancestor, "id" | "createdAt" | "updatedAt">>>();

        selectedChildrenIds.forEach((childId) => {
          const childInWorking = workingAncestors.find((a) => a.id === childId);
          if (childInWorking && TypeGuards.isAncestor(childInWorking)) {
            const currentParentIds = childInWorking.parentIds || [];
            const isCurrentlyParent = currentParentIds.includes(savedAncestor.id);

            if (!isCurrentlyParent) {
              const updates = childUpdates.get(childId) || {};
              updates.parentIds = [...currentParentIds, savedAncestor.id];
              childUpdates.set(childId, updates);
            }
          }
        });

        // Apply child updates
        childUpdates.forEach((updates, childId) => {
          const childIndex = workingAncestors.findIndex(a => a.id === childId);
          if (childIndex !== -1) {
            workingAncestors[childIndex] = {
              ...workingAncestors[childIndex],
              ...updates,
              updatedAt: Date.now()
            };
          }
        });

        // Handle bidirectional relationships
        const finalAncestors = FamilyTreeService.updateBidirectionalRelationships(
          workingAncestors,
          savedAncestor
        );

        // Update state with all changes
        if (storage.batchUpdateAncestors(finalAncestors)) {
          showNotification("Person added successfully!", "success");
        } else {
          showNotification("Failed to add person.", "error");
          return;
        }
      }

      setIsAncestorModalOpen(false);
      setEditingAncestor(null);
    } catch (error) {
      console.error("Error saving ancestor:", error);
      showNotification("Failed to save person.", "error");
    }
  };

  const handleAddParent = (childId: string) => {
    console.log("handleAddParent called for childId:", childId); // Debug log

    const child = storage.ancestors.find((a) => a.id === childId);
    if (!child) {
      console.error("Child not found:", childId);
      showNotification("Error: Child not found.", "error");
      return;
    }

    console.log("Found child:", child); // Debug log

    // Determine the relationship name for the new parent
    // Find Self to calculate proper relationship
    const selfPerson = storage.ancestors.reduce((oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest
    , storage.ancestors[0]);

    let relationshipName = "Parent";

    // If the child is Self, the new person is Parent
    if (child.id === selfPerson.id) {
      relationshipName = "Parent";
    }
    // If the child is a Parent of Self, the new person is Grandparent
    else if (selfPerson.parentIds?.includes(child.id)) {
      relationshipName = "Grandparent";
    }
    // Otherwise, use generic Relative
    else {
      relationshipName = "Relative";
    }

    // Determine the generation for the new parent (one level up from child)
    const parentGeneration = child.generation + 1;

    // Create a new parent ancestor with default name and generation
    const parentData: Omit<Ancestor, "id" | "createdAt" | "updatedAt"> = {
      firstName: relationshipName,
      generation: parentGeneration
    };
    const parentResult = storage.addAncestor(parentData);
    const newParent = parentResult.ancestor;
    const updatedAncestorsAfterParentAdd = parentResult.updatedAncestors;

    console.log("Created new parent:", newParent); // Debug log

    // Link the child to the parent using the updated ancestors array
    const childInUpdated = updatedAncestorsAfterParentAdd.find(a => a.id === childId);
    if (childInUpdated) {
      const currentParentIds = childInUpdated.parentIds || [];
      const updates: Partial<Omit<Ancestor, "id" | "createdAt" | "updatedAt">> = {
        parentIds: [...currentParentIds, newParent.id]
      };

      console.log("Updating child with:", updates); // Debug log
      const updateResult = storage.updateAncestor(
        childId,
        updates,
        updatedAncestorsAfterParentAdd
      );

      if (!updateResult) {
        console.error("Failed to update child ancestor"); // Debug log
        showNotification("Failed to update person.", "error");
        return;
      }

      console.log("Successfully updated child"); // Debug log
    }

    // Open the edit modal for the new parent
    setEditingAncestor(newParent);
    setIsAncestorModalOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    // Determine the relationship name for the new child
    // Find Self to calculate proper relationship
    const selfPerson = storage.ancestors.reduce((oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest
    , storage.ancestors[0]);

    let relationshipName = "Child";

    // If the parent is Self, the new person is Child
    if (parentId === selfPerson.id) {
      relationshipName = "Child";
    }
    // If the parent is a Child of Self, the new person is Grandchild
    else {
      const parent = storage.ancestors.find(a => a.id === parentId);
      if (parent && parent.parentIds?.includes(selfPerson.id)) {
        relationshipName = "Grandchild";
      } else {
        relationshipName = "Relative";
      }
    }

    // Determine the generation for the new child (one level down from parent)
    const parent = storage.ancestors.find(a => a.id === parentId);
    const childGeneration = parent ? parent.generation - 1 : -1;

    // Create a new child ancestor with parent relationship, default name, and generation
    const childData: Omit<Ancestor, "id" | "createdAt" | "updatedAt"> = {
      parentIds: [parentId],
      firstName: relationshipName,
      generation: childGeneration
    };
    const result = storage.addAncestor(childData);
    const newChild = result.ancestor;

    // Open the edit modal for the new child
    setEditingAncestor(newChild);
    setIsAncestorModalOpen(true);
  };

  const handleClearAll = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all data? This action cannot be undone."
      )
    ) {
      storage.clearAllData();
      showNotification("All data cleared.", "success");
    }
  };

  const handleImportData = (data: string) => {
    let success = false;

    // Try to import as URL first
    if (data.includes("://")) {
      success = storage.importFromUrl(data);
    } else {
      // Try as base64 encoded data
      success = storage.importFromBase64(data);
    }

    if (success) {
      showNotification("Data imported successfully!", "success");
      setIsImportExportModalOpen(false);
    } else {
      showNotification(
        "Failed to import data. Please check the format.",
        "error"
      );
    }
  };

  const handleCopyUrl = async () => {
    try {
      const url = storage.exportAsUrl();
      await navigator.clipboard.writeText(url);
      showNotification("Shareable URL copied to clipboard!", "success");
    } catch {
      showNotification("Failed to copy URL to clipboard.", "error");
    }
  };

  const handleCopyData = async () => {
    try {
      const data = storage.exportAsBase64();
      await navigator.clipboard.writeText(data);
      showNotification("Data string copied to clipboard!", "success");
    } catch {
      showNotification("Failed to copy data to clipboard.", "error");
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
