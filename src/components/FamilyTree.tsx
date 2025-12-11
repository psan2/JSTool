import React from 'react';
import { Ancestor } from '../types';
import AncestorCard from './AncestorCard';

interface FamilyTreeProps {
  ancestors: Ancestor[];
  onEditAncestor: (ancestor: Ancestor) => void;
  onDeleteAncestor: (id: string) => void;
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ ancestors, onEditAncestor, onDeleteAncestor }) => {
  if (ancestors.length === 0) {
    return (
      <div className="family-tree">
        <div className="ancestors-container">
          <p className="empty-state">No ancestors added yet. Click "Add Ancestor" to get started.</p>
        </div>
      </div>
    );
  }

  // Sort ancestors by creation date
  const sortedAncestors = [...ancestors].sort((a, b) => {
    return a.createdAt - b.createdAt;
  });

  return (
    <div className="family-tree">
      <div className="ancestors-container">
        {sortedAncestors.map(ancestor => (
          <AncestorCard
            key={ancestor.id}
            ancestor={ancestor}
            allAncestors={ancestors}
            onEdit={onEditAncestor}
            onDelete={onDeleteAncestor}
          />
        ))}
      </div>
    </div>
  );
};

export default FamilyTree;
