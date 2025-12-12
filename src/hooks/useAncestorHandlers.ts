import { useState } from "react";
import { Ancestor } from "../types";
import { TypeGuards, ValidatedFormData } from "../types/guards";
import { FamilyTreeService } from "../services/FamilyTreeService";
import { useFamilyTreeStorage } from "./useFamilyTreeStorage";
import { useNotification } from "./useNotification";
import {
  getParentRelationshipName,
  getChildRelationshipName,
} from "../utils/relationshipUtils";

export function useAncestorHandlers() {
  const storage = useFamilyTreeStorage();
  const { showNotification } = useNotification();

  const [isAncestorModalOpen, setIsAncestorModalOpen] = useState(false);
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
      const selectedChildrenIds = formData.selectedChildrenIds || [];

      if (!TypeGuards.isValidAncestorIdArray(selectedChildrenIds)) {
        showNotification("Invalid children data.", "error");
        return;
      }

      const { selectedChildrenIds: _, ...cleanAncestorData } = formData;
      let workingAncestors = [...storage.ancestors];
      let savedAncestor: Ancestor;

      if (editingAncestor) {
        // Update existing ancestor
        const ancestorIndex = workingAncestors.findIndex(
          (a) => a.id === editingAncestor.id
        );
        if (ancestorIndex === -1) {
          showNotification("Failed to update person.", "error");
          return;
        }

        savedAncestor = {
          ...workingAncestors[ancestorIndex],
          ...cleanAncestorData,
          updatedAt: Date.now(),
        };
        workingAncestors[ancestorIndex] = savedAncestor;

        // Handle children relationships
        const childUpdates = new Map<
          string,
          Partial<Omit<Ancestor, "id" | "createdAt" | "updatedAt">>
        >();

        // Add new children relationships
        selectedChildrenIds.forEach((childId) => {
          const childInWorking = workingAncestors.find((a) => a.id === childId);
          if (childInWorking && TypeGuards.isAncestor(childInWorking)) {
            const currentParentIds = childInWorking.parentIds || [];
            const isCurrentlyParent = currentParentIds.includes(
              savedAncestor.id
            );

            if (!isCurrentlyParent) {
              const updates = childUpdates.get(childId) || {};
              updates.parentIds = [...currentParentIds, savedAncestor.id];
              childUpdates.set(childId, updates);
            }
          }
        });

        // Handle removed children
        const currentChildren = workingAncestors.filter((a) =>
          a.parentIds?.includes(editingAncestor.id)
        );

        currentChildren.forEach((child) => {
          if (!selectedChildrenIds.includes(child.id)) {
            const updates = childUpdates.get(child.id) || {};
            const currentParentIds = child.parentIds || [];
            updates.parentIds = currentParentIds.filter(
              (id) => id !== editingAncestor.id
            );
            if (updates.parentIds.length === 0) {
              updates.parentIds = undefined;
            }
            childUpdates.set(child.id, updates);
          }
        });

        // Apply all child updates
        childUpdates.forEach((updates, childId) => {
          const childIndex = workingAncestors.findIndex(
            (a) => a.id === childId
          );
          if (childIndex !== -1) {
            workingAncestors[childIndex] = {
              ...workingAncestors[childIndex],
              ...updates,
              updatedAt: Date.now(),
            };
          }
        });

        // Handle bidirectional relationships
        const finalAncestors =
          FamilyTreeService.updateBidirectionalRelationships(
            workingAncestors,
            savedAncestor
          );

        if (storage.batchUpdateAncestors(finalAncestors)) {
          showNotification("Person updated successfully!", "success");
        } else {
          showNotification("Failed to update person.", "error");
          return;
        }
      } else {
        // Add new ancestor
        const ancestorWithGeneration = {
          generation: 0,
          ...cleanAncestorData,
        };
        const result = storage.addAncestor(ancestorWithGeneration);
        savedAncestor = result.ancestor;
        workingAncestors = result.updatedAncestors;

        // Handle children relationships for new ancestor
        const childUpdates = new Map<
          string,
          Partial<Omit<Ancestor, "id" | "createdAt" | "updatedAt">>
        >();

        selectedChildrenIds.forEach((childId) => {
          const childInWorking = workingAncestors.find((a) => a.id === childId);
          if (childInWorking && TypeGuards.isAncestor(childInWorking)) {
            const currentParentIds = childInWorking.parentIds || [];
            const isCurrentlyParent = currentParentIds.includes(
              savedAncestor.id
            );

            if (!isCurrentlyParent) {
              const updates = childUpdates.get(childId) || {};
              updates.parentIds = [...currentParentIds, savedAncestor.id];
              childUpdates.set(childId, updates);
            }
          }
        });

        // Apply child updates
        childUpdates.forEach((updates, childId) => {
          const childIndex = workingAncestors.findIndex(
            (a) => a.id === childId
          );
          if (childIndex !== -1) {
            workingAncestors[childIndex] = {
              ...workingAncestors[childIndex],
              ...updates,
              updatedAt: Date.now(),
            };
          }
        });

        // Handle bidirectional relationships
        const finalAncestors =
          FamilyTreeService.updateBidirectionalRelationships(
            workingAncestors,
            savedAncestor
          );

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
    const child = storage.ancestors.find((a) => a.id === childId);
    if (!child) {
      showNotification("Error: Child not found.", "error");
      return;
    }

    const relationshipName = getParentRelationshipName(child, storage.ancestors);
    const parentGeneration = child.generation + 1;

    const parentData: Omit<Ancestor, "id" | "createdAt" | "updatedAt"> = {
      firstName: relationshipName,
      generation: parentGeneration,
    };

    const parentResult = storage.addAncestor(parentData);
    const newParent = parentResult.ancestor;
    const updatedAncestorsAfterParentAdd = parentResult.updatedAncestors;

    // Link the child to the parent
    const childInUpdated = updatedAncestorsAfterParentAdd.find(
      (a) => a.id === childId
    );
    if (childInUpdated) {
      const currentParentIds = childInUpdated.parentIds || [];
      const updates: Partial<Omit<Ancestor, "id" | "createdAt" | "updatedAt">> =
        {
          parentIds: [...currentParentIds, newParent.id],
        };

      const updateResult = storage.updateAncestor(
        childId,
        updates,
        updatedAncestorsAfterParentAdd
      );

      if (!updateResult) {
        showNotification("Failed to update person.", "error");
        return;
      }
    }

    setEditingAncestor(newParent);
    setIsAncestorModalOpen(true);
  };

  const handleAddChild = (parentId: string) => {
    const relationshipName = getChildRelationshipName(
      parentId,
      storage.ancestors
    );

    const parent = storage.ancestors.find((a) => a.id === parentId);
    const childGeneration = parent ? parent.generation - 1 : -1;

    const childData: Omit<Ancestor, "id" | "createdAt" | "updatedAt"> = {
      parentIds: [parentId],
      firstName: relationshipName,
      generation: childGeneration,
    };

    const result = storage.addAncestor(childData);
    const newChild = result.ancestor;

    setEditingAncestor(newChild);
    setIsAncestorModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAncestorModalOpen(false);
    setEditingAncestor(null);
  };

  return {
    isAncestorModalOpen,
    editingAncestor,
    handleAddAncestor,
    handleEditAncestor,
    handleDeleteAncestor,
    handleSaveAncestor,
    handleAddParent,
    handleAddChild,
    handleCloseModal,
  };
}
