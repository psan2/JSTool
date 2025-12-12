import React from 'react';
import { Ancestor, LocationEvent, PartialDate } from '../types';

interface AncestorCardProps {
  ancestor: Ancestor;
  allAncestors: Ancestor[];
  onEdit: (ancestor: Ancestor) => void;
  onDelete: (id: string) => void;
}

const AncestorCard: React.FC<AncestorCardProps> = ({ ancestor, allAncestors, onEdit, onDelete }) => {
  const getDisplayName = (ancestor: Ancestor): string => {
    if (ancestor.firstName || ancestor.lastName) {
      return `${ancestor.firstName || ''} ${ancestor.lastName || ''}`.trim();
    }
    // Default to "Person" if no name provided
    return 'Person';
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
    const parentIds = ancestor.parentIds || [];
    if (parentIds.length === 0) {
      return null;
    }

    const parents = parentIds
      .map(id => allAncestors.find(a => a.id === id))
      .filter((p): p is Ancestor => p !== undefined);

    if (parents.length === 0) {
      return null;
    }

    const getParentName = (parent: Ancestor) => {
      return parent.firstName || parent.lastName
        ? `${parent.firstName || ''} ${parent.lastName || ''}`.trim()
        : 'Person';
    };

    return (
      <div className="detail-group" key="parents">
        <h4>Parents</h4>
        {parents.map((parent, index) => (
          <div key={parent.id} className="detail-item">
            Parent {index + 1}: {getParentName(parent)}
          </div>
        ))}
      </div>
    );
  };

  const createChildrenDetails = (ancestor: Ancestor, allAncestors: Ancestor[]) => {
    // Find all children where this ancestor is a parent
    const children = allAncestors.filter(a =>
      a.parentIds?.includes(ancestor.id)
    );

    if (children.length === 0) {
      return null;
    }

    const getChildName = (child: Ancestor) => {
      return child.firstName || child.lastName
        ? `${child.firstName || ''} ${child.lastName || ''}`.trim()
        : 'Person';
    };

    return (
      <div className="detail-group" key="children">
        <h4>Children</h4>
        {children.map(child => (
          <div key={child.id} className="detail-item">
            {getChildName(child)}
          </div>
        ))}
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
            : 'Person';
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
