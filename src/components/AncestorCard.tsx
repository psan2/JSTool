import React from 'react';
import { Ancestor, LocationEvent, PartialDate } from '../types';

interface AncestorCardProps {
  ancestor: Ancestor;
  onEdit: (ancestor: Ancestor) => void;
  onDelete: (id: string) => void;
}

const AncestorCard: React.FC<AncestorCardProps> = ({ ancestor, onEdit, onDelete }) => {
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

  const createMultipleEventDetails = (eventName: string, events?: LocationEvent[]) => {
    if (!events || events.length === 0) {
      return null;
    }

    const eventItems = events.map((event, index) => {
      const dateStr = formatPartialDate(event.date);
      const countryStr = event.country || '';

      if (!dateStr && !countryStr) {
        return null;
      }

      return (
        <div className="detail-item" key={index}>
          <strong>{eventName.slice(0, -1)} {index + 1}:</strong>
          {dateStr && ` ${dateStr}`}
          {countryStr && ` (${countryStr})`}
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
        {createEventDetail('Birth', ancestor.birth)}
        {createMultipleEventDetails('Marriages', ancestor.marriages)}
        {createMultipleEventDetails('Divorces', ancestor.divorces)}
        {createMultipleEventDetails('Naturalizations', ancestor.naturalizations)}
        {createEventDetail('Death', ancestor.death)}
      </div>
    </div>
  );
};

export default AncestorCard;
