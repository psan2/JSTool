import React from 'react';

interface ControlsProps {
  onAddAncestor: () => void;
  onImportExport: () => void;
  onClearAll: () => void;
}

const Controls: React.FC<ControlsProps> = ({ onAddAncestor, onImportExport, onClearAll }) => {
  return (
    <div className="controls">
      <button className="btn btn-primary" onClick={onAddAncestor}>
        Add Ancestor
      </button>
      <button className="btn btn-secondary" onClick={onImportExport}>
        Import Data
      </button>
      <button className="btn btn-secondary" onClick={onImportExport}>
        Export Data
      </button>
      <button className="btn btn-danger" onClick={onClearAll}>
        Clear All
      </button>
    </div>
  );
};

export default Controls;
