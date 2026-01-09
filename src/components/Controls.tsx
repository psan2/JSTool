import React from 'react';
import AddAncestorButton from './AddAncestorButton';
import ExportButton from './ExportButton';

interface ControlsProps {
  onAddAncestor: () => void;
  onBulkEdit: () => void;
  onImport: () => void;
  onExportUrl: () => void;
  onExportBase64: () => void;
  onExportJson: () => void;
  onClearAll: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  onAddAncestor,
  onBulkEdit,
  onImport,
  onExportUrl,
  onExportBase64,
  onExportJson,
  onClearAll
}) => {
  return (
    <div className="controls">
      <AddAncestorButton
        onAddAncestor={onAddAncestor}
        onBulkEdit={onBulkEdit}
      />
      <button className="btn btn-secondary" onClick={onImport}>
        Import Data
      </button>
      <ExportButton
        onExportUrl={onExportUrl}
        onExportBase64={onExportBase64}
        onExportJson={onExportJson}
      />
      <button className="btn btn-danger" onClick={onClearAll}>
        Clear All
      </button>
    </div>
  );
};

export default Controls;
