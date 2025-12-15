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
import { useAncestorHandlers } from "./hooks/useAncestorHandlers";

function App() {
  const storage = useFamilyTreeStorage();
  const { notifications, showNotification, removeNotification } = useNotification();
  const ancestorHandlers = useAncestorHandlers();

  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

  // Handle any storage errors
  if (storage.error) {
    console.error("Storage error:", storage.error);
  }

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

  const handleCopyJson = async () => {
    try {
      const jsonData = storage.exportData();
      await navigator.clipboard.writeText(jsonData);
      showNotification("JSON data copied to clipboard!", "success");
    } catch {
      showNotification("Failed to copy JSON to clipboard.", "error");
    }
  };

  return (
    <ErrorBoundary>
      <div className="container">
        <Header />

        <Controls
          onAddAncestor={ancestorHandlers.handleAddAncestor}
          onImport={() => setIsImportExportModalOpen(true)}
          onExportUrl={handleCopyUrl}
          onExportBase64={handleCopyData}
          onExportJson={handleCopyJson}
          onClearAll={handleClearAll}
        />

        <FamilyTreeGraph
          ancestors={storage.ancestors}
          onEditAncestor={ancestorHandlers.handleEditAncestor}
          onDeleteAncestor={ancestorHandlers.handleDeleteAncestor}
          onAddParent={ancestorHandlers.handleAddParent}
          onAddChild={ancestorHandlers.handleAddChild}
        />

        {ancestorHandlers.isAncestorModalOpen && (
          <AncestorModal
            ancestor={ancestorHandlers.editingAncestor}
            availablePartners={storage.ancestors}
            onSave={ancestorHandlers.handleSaveAncestor}
            onClose={ancestorHandlers.handleCloseModal}
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
