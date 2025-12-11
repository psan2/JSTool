import React, { useState, useEffect, useRef } from 'react';
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
  const isInitialLoad = useRef(true);

  useEffect(() => {
    setYear(event.date?.year?.toString() || '');
    setMonth(event.date?.month?.toString() || '');
    setDay(event.date?.day?.toString() || '');
    setCountry(event.country || '');
    setPartnerId(event.partnerId || '');
    isInitialLoad.current = true;
  }, [event]);

  const validateAndFormatValue = (field: string, value: string): string => {
    if (!value) return '';

    switch (field) {
      case 'year':
        // Ensure 4 digits for year
        const yearNum = parseInt(value);
        if (yearNum < 1800 || yearNum > 2024) return year; // Keep previous value if invalid
        return yearNum.toString();
      case 'month':
        // Ensure 1-2 digits for month
        const monthNum = parseInt(value);
        if (monthNum < 1 || monthNum > 12) return month; // Keep previous value if invalid
        return monthNum.toString();
      case 'day':
        // Ensure 1-2 digits for day
        const dayNum = parseInt(value);
        if (dayNum < 1 || dayNum > 31) return day; // Keep previous value if invalid
        return dayNum.toString();
      default:
        return value;
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    // Validate and format the value
    const validatedValue = validateAndFormatValue(field, value);

    // Update the appropriate state
    switch (field) {
      case 'year':
        setYear(validatedValue);
        break;
      case 'month':
        setMonth(validatedValue);
        break;
      case 'day':
        setDay(validatedValue);
        break;
      case 'country':
        setCountry(value);
        break;
      case 'partnerId':
        setPartnerId(value);
        break;
    }

    // Skip onChange call during initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    // Build the new event with the updated value
    const newYear = field === 'year' ? validatedValue : year;
    const newMonth = field === 'month' ? validatedValue : month;
    const newDay = field === 'day' ? validatedValue : day;
    const newCountry = field === 'country' ? value : country;
    const newPartnerId = field === 'partnerId' ? value : partnerId;

    const hasDate = newYear || newMonth || newDay;
    const hasCountry = newCountry && newCountry.trim();
    const hasPartner = newPartnerId && newPartnerId.trim();

    const newEvent: LocationEvent = {};

    if (hasDate) {
      const date: any = {};
      if (newYear) date.year = parseInt(newYear);
      if (newMonth) date.month = parseInt(newMonth);
      if (newDay) date.day = parseInt(newDay);
      newEvent.date = date;
    }

    if (hasCountry) {
      newEvent.country = newCountry.trim();
    }

    if (hasPartner) {
      newEvent.partnerId = newPartnerId.trim();
    }

    onChange(newEvent);
  };

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
          onChange={(e) => handleFieldChange('year', e.target.value)}
          min="1800"
          max="2024"
          placeholder="YYYY"
          maxLength={4}
        />
        <label>Month:</label>
        <input
          type="number"
          value={month}
          onChange={(e) => handleFieldChange('month', e.target.value)}
          min="1"
          max="12"
          placeholder="MM"
          maxLength={2}
        />
        <label>Day:</label>
        <input
          type="number"
          value={day}
          onChange={(e) => handleFieldChange('day', e.target.value)}
          min="1"
          max="31"
          placeholder="DD"
          maxLength={2}
        />
      </div>
      <div className="form-group">
        <label>Country:</label>
        <input
          type="text"
          value={country}
          onChange={(e) => handleFieldChange('country', e.target.value)}
        />
      </div>
      {showPartnerSelector && (
        <div className="form-group">
          <label>Partner (optional):</label>
          <select
            value={partnerId}
            onChange={(e) => handleFieldChange('partnerId', e.target.value)}
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
