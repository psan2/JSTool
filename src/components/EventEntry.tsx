import React, { useState, useEffect } from 'react';
import { LocationEvent, Ancestor } from '../types';

interface EventEntryProps {
  title: string;
  event: LocationEvent;
  onChange: (event: LocationEvent) => void;
  onRemove: () => void;
  showPartnerSelector?: boolean;
  availablePartners?: Ancestor[];
  currentAncestorId?: string;
}

const EventEntry: React.FC<EventEntryProps> = ({
  title,
  event,
  onChange,
  onRemove,
  showPartnerSelector = false,
  availablePartners = [],
  currentAncestorId
}) => {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [country, setCountry] = useState('');
  const [partnerId, setPartnerId] = useState('');

  useEffect(() => {
    setYear(event.date?.year?.toString() || '');
    setMonth(event.date?.month?.toString() || '');
    setDay(event.date?.day?.toString() || '');
    setCountry(event.country || '');
    setPartnerId(event.partnerId || '');
  }, [event]);

  useEffect(() => {
    const hasDate = year || month || day;
    const hasCountry = country && country.trim();
    const hasPartner = partnerId && partnerId.trim();

    const newEvent: LocationEvent = {};

    if (hasDate) {
      const date: any = {};
      if (year) date.year = parseInt(year);
      if (month) date.month = parseInt(month);
      if (day) date.day = parseInt(day);
      newEvent.date = date;
    }

    if (hasCountry) {
      newEvent.country = country.trim();
    }

    if (hasPartner) {
      newEvent.partnerId = partnerId.trim();
    }

    // Only call onChange if there's actual data or if we need to clear it
    const hasAnyData = hasDate || hasCountry || hasPartner;
    const currentEventHasData = event.date || event.country || event.partnerId;

    if (hasAnyData || currentEventHasData) {
      onChange(newEvent);
    }
  }, [year, month, day, country, partnerId]);

  return (
    <div className="event-entry">
      <div className="event-entry-header">
        <span className="event-entry-title">{title}</span>
        <button type="button" className="remove-event-btn" onClick={onRemove}>
          Remove
        </button>
      </div>
      <div className="date-input-group">
        <label>Year:</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          min="1800"
          max="2024"
        />
        <label>Month:</label>
        <input
          type="number"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          min="1"
          max="12"
        />
        <label>Day:</label>
        <input
          type="number"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          min="1"
          max="31"
        />
      </div>
      <div className="form-group">
        <label>Country:</label>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
      </div>
      {showPartnerSelector && (
        <div className="form-group">
          <label>Partner (optional):</label>
          <select
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
          >
            <option value="">Select partner (optional)</option>
            {availablePartners
              .filter(partner => partner.id !== currentAncestorId)
              .map(partner => {
                const displayName = partner.firstName || partner.lastName
                  ? `${partner.firstName || ''} ${partner.lastName || ''}`.trim()
                  : partner.relationship.charAt(0).toUpperCase() + partner.relationship.slice(1).replace('-', ' ');
                return (
                  <option key={partner.id} value={partner.id}>
                    {displayName}
                  </option>
                );
              })}
          </select>
        </div>
      )}
    </div>
  );
};

export default EventEntry;
