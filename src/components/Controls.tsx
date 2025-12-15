import React from 'react';
import ExportButton from './ExportButton';

interface ControlsProps {
  onAddAncestor: () => void;
  onImport: () => void;
  onExportUrl: () => void;
  onExportBase64: () => void;
  onExportJson: () => void;
  onClearAll: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  onAddAncestor,
  onImport,
  onExportUrl,
  onExportBase64,
  onExportJson,
  onClearAll
}) => {
  return (
    <div className="controls">
      <button className="btn btn-primary" onClick={onAddAncestor}>
        Add Ancestor
      </button>
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
