import React from 'react';
import { Ancestor, LocationEvent, PartialDate } from '../types';

interface AncestorCardProps {
  ancestor: Ancestor;
  allAncestors: Ancestor[];
  onEdit: (ancestor: Ancestor) => void;
  onDelete: (id: string) => void;
  onUpdateChildren: (ancestorId: string, childIds: string[]) => void;
}

const AncestorCard: React.FC<AncestorCardProps> = ({ ancestor, allAncestors, onEdit, onDelete, onUpdateChildren }) => {
  const getDisplayName = (ancestor: Ancestor): string => {
    if (ancestor.firstName || ancestor.lastName) {
      return `${ancestor.firstName || ''} ${ancestor.lastName || ''}`.trim();
    }
    // Default to relationship name if no name provided
    return ancestor.relationship.charAt(0).toUpperCase() + ancestor.relationship.slice(1).replace('-', ' ');
  };

  const formatPartialDate = (date?: PartialDate): string => {
    if (!date) {
      return '';
    }

    const parts: string[] = [];
    if (date.year) parts.push(date.year.toString());
    if (date.month) parts.push(date.month.toString().padStart(2, '0'));
    if (date.day) parts.push(date.day.toString().padStart(2, '0'));

    return parts.join('-');
  };

  const createParentDetails = (ancestor: Ancestor, allAncestors: Ancestor[]) => {
    const parent1 = ancestor.parent1Id ? allAncestors.find(a => a.id === ancestor.parent1Id) : null;
    const parent2 = ancestor.parent2Id ? allAncestors.find(a => a.id === ancestor.parent2Id) : null;

    if (!parent1 && !parent2) {
      return null;
    }

    const getParentName = (parent: Ancestor) => {
      return parent.firstName || parent.lastName
        ? `${parent.firstName || ''} ${parent.lastName || ''}`.trim()
        : parent.relationship.charAt(0).toUpperCase() + parent.relationship.slice(1).replace('-', ' ');
    };

    return (
      <div className="detail-group" key="parents">
        <h4>Parents</h4>
        {parent1 && <div className="detail-item">Parent 1: {getParentName(parent1)}</div>}
        {parent2 && <div className="detail-item">Parent 2: {getParentName(parent2)}</div>}
      </div>
    );
  };

  const createChildrenDetails = (ancestor: Ancestor, allAncestors: Ancestor[]) => {
    // Find all children where this ancestor is parent1 or parent2
    const children = allAncestors.filter(a =>
      a.parent1Id === ancestor.id || a.parent2Id === ancestor.id
    );

    // Find potential children (ancestors that don't have this person as parent yet)
    const potentialChildren = allAncestors.filter(a =>
      a.id !== ancestor.id &&
      a.parent1Id !== ancestor.id &&
      a.parent2Id !== ancestor.id
    );

    const getChildName = (child: Ancestor) => {
      return child.firstName || child.lastName
        ? `${child.firstName || ''} ${child.lastName || ''}`.trim()
        : child.relationship.charAt(0).toUpperCase() + child.relationship.slice(1).replace('-', ' ');
    };

    const handleChildToggle = (childId: string, isSelected: boolean) => {
      if (isSelected) {
        // Add this ancestor as a parent to the child
        const child = allAncestors.find(a => a.id === childId);
        if (child) {
          // Determine if we should be parent1 or parent2
          const newParent1Id = child.parent1Id || ancestor.id;
          const newParent2Id = child.parent1Id ? ancestor.id : child.parent2Id;

          // Update the child's parent relationships
          onUpdateChildren(childId, [newParent1Id, newParent2Id].filter(Boolean) as string[]);
        }
      } else {
        // Remove this ancestor as a parent from the child
        const child = allAncestors.find(a => a.id === childId);
        if (child) {
          const newParent1Id = child.parent1Id === ancestor.id ? child.parent2Id : child.parent1Id;
          const newParent2Id = child.parent2Id === ancestor.id ? undefined : child.parent2Id;

          onUpdateChildren(childId, [newParent1Id, newParent2Id].filter(Boolean) as string[]);
        }
      }
    };

    return (
      <div className="detail-group" key="children">
        <h4>Children</h4>
        {children.length > 0 && (
          <div>
            {children.map(child => (
              <div key={child.id} className="detail-item">
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={(e) => handleChildToggle(child.id, e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  {getChildName(child)}
                </label>
              </div>
            ))}
          </div>
        )}
        {potentialChildren.length > 0 && (
          <div>
            <div className="detail-item" style={{ fontStyle: 'italic', marginBottom: '8px' }}>
              Add children:
            </div>
            {potentialChildren.map(child => (
              <div key={child.id} className="detail-item">
                <label style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={(e) => handleChildToggle(child.id, e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  {getChildName(child)}
                </label>
              </div>
            ))}
          </div>
        )}
        {children.length === 0 && potentialChildren.length === 0 && (
          <div className="detail-item" style={{ fontStyle: 'italic' }}>
            No children or potential children available
          </div>
        )}
      </div>
    );
  };

  const createEventDetail = (eventName: string, event?: LocationEvent) => {
    if (!event) {
      return null;
    }

    const dateStr = formatPartialDate(event.date);
    const countryStr = event.country || '';

    if (!dateStr && !countryStr) {
      return null;
    }

    return (
      <div className="detail-group" key={eventName}>
        <h4>{eventName}</h4>
        {dateStr && <div className="detail-item">Date: {dateStr}</div>}
        {countryStr && <div className="detail-item">Country: {countryStr}</div>}
      </div>
    );
  };

  const createMultipleEventDetails = (eventName: string, events?: LocationEvent[], allAncestors?: Ancestor[]) => {
    if (!events || events.length === 0) {
      return null;
    }

    const eventItems = events.map((event, index) => {
      const dateStr = formatPartialDate(event.date);
      const countryStr = event.country || '';

      // Find partner name if partnerId exists
      let partnerStr = '';
      if (event.partnerId && allAncestors) {
        const partner = allAncestors.find(a => a.id === event.partnerId);
        if (partner) {
          const partnerName = partner.firstName || partner.lastName
            ? `${partner.firstName || ''} ${partner.lastName || ''}`.trim()
            : partner.relationship.charAt(0).toUpperCase() + partner.relationship.slice(1).replace('-', ' ');
          partnerStr = ` to ${partnerName}`;
        }
      }

      if (!dateStr && !countryStr && !partnerStr) {
        return null;
      }

      return (
        <div className="detail-item" key={index}>
          <strong>{eventName.slice(0, -1)} {index + 1}:</strong>
          {dateStr && ` ${dateStr}`}
          {countryStr && ` (${countryStr})`}
          {partnerStr}
        </div>
      );
    }).filter(Boolean);

    if (eventItems.length === 0) {
      return null;
    }

    return (
      <div className="detail-group" key={eventName}>
        <h4>{eventName}</h4>
        {eventItems}
      </div>
    );
  };

  const displayName = getDisplayName(ancestor);

  return (
    <div className="ancestor-card">
      <div className="ancestor-header">
        <div className="ancestor-name">{displayName}</div>
        <div className="ancestor-relationship">{ancestor.relationship.replace('-', ' ')}</div>
        <div className="ancestor-actions">
          <button
            className="btn btn-small btn-secondary"
            onClick={() => onEdit(ancestor)}
          >
            Edit
          </button>
          <button
            className="btn btn-small btn-danger"
            onClick={() => onDelete(ancestor.id)}
          >
            Delete
          </button>
        </div>
      </div>
      <div className="ancestor-details">
        {createParentDetails(ancestor, allAncestors)}
        {createChildrenDetails(ancestor, allAncestors)}
        {createEventDetail('Birth', ancestor.birth)}
        {createMultipleEventDetails('Marriages', ancestor.marriages, allAncestors)}
        {createMultipleEventDetails('Divorces', ancestor.divorces, allAncestors)}
        {createMultipleEventDetails('Naturalizations', ancestor.naturalizations)}
        {createEventDetail('Death', ancestor.death)}
      </div>
    </div>
  );
};

export default AncestorCard;
