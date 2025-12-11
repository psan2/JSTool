import React, { useState } from 'react';
import Modal from './Modal';

interface ImportExportModalProps {
  exportData: string;
  onImport: (data: string) => void;
  onCopyUrl: () => void;
  onCopyData: () => void;
  onClose: () => void;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  exportData,
  onImport,
  onCopyUrl,
  onCopyData,
  onClose
}) => {
  const [importData, setImportData] = useState('');

  const handleImport = () => {
    if (!importData.trim()) {
      alert('Please enter data to import.');
      return;
    }
    onImport(importData.trim());
    setImportData('');
  };

  return (
    <Modal title="Import/Export Data" onClose={onClose}>
      <div className="export-section">
        <h3>Export Options</h3>
        <button className="btn btn-secondary" onClick={onCopyUrl}>
          Copy Shareable URL
        </button>
        <button className="btn btn-secondary" onClick={onCopyData}>
          Copy Data String
        </button>
        <textarea
          className="export-data"
          value={exportData}
          readOnly
          placeholder="Your encoded data will appear here..."
        />
      </div>

      <div className="import-section">
        <h3>Import Data</h3>
        <textarea
          className="import-data"
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          placeholder="Paste your encoded data or URL here..."
        />
        <button className="btn btn-primary" onClick={handleImport}>
          Import
        </button>
      </div>
    </Modal>
  );
};

export default ImportExportModal;
