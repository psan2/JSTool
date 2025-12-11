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

  // Initialize state from event prop
  useEffect(() => {
    setYear(event.date?.year?.toString() || '');
    setMonth(event.date?.month?.toString() || '');
    setDay(event.date?.day?.toString() || '');
    setCountry(event.country || '');
    setPartnerId(event.partnerId || '');
  }, [event]);

  const buildEventFromState = (newYear?: string, newMonth?: string, newDay?: string, newCountry?: string, newPartnerId?: string): LocationEvent => {
    const currentYear = newYear !== undefined ? newYear : year;
    const currentMonth = newMonth !== undefined ? newMonth : month;
    const currentDay = newDay !== undefined ? newDay : day;
    const currentCountry = newCountry !== undefined ? newCountry : country;
    const currentPartnerId = newPartnerId !== undefined ? newPartnerId : partnerId;

    const hasDate = currentYear || currentMonth || currentDay;
    const hasCountry = currentCountry && currentCountry.trim();
    const hasPartner = currentPartnerId && currentPartnerId.trim();

    const newEvent: LocationEvent = {};

    if (hasDate) {
      const date: any = {};
      if (currentYear) date.year = parseInt(currentYear);
      if (currentMonth) date.month = parseInt(currentMonth);
      if (currentDay) date.day = parseInt(currentDay);
      newEvent.date = date;
    }

    if (hasCountry) {
      newEvent.country = currentCountry.trim();
    }

    if (hasPartner) {
      newEvent.partnerId = currentPartnerId.trim();
    }

    return newEvent;
  };

  const validateDateValue = (field: string, value: string): string => {
    if (!value) return '';

    switch (field) {
      case 'year':
        const yearNum = parseInt(value);
        // Allow partial years while typing, but validate complete years
        if (value.length <= 4 && yearNum > 0) {
          if (value.length === 4 && (yearNum < 1800 || yearNum > 2024)) {
            return year; // Keep previous if invalid complete year
          }
          return value;
        }
        return year;
      case 'month':
        const monthNum = parseInt(value);
        if (monthNum >= 1 && monthNum <= 12) return value;
        return month;
      case 'day':
        const dayNum = parseInt(value);
        if (dayNum >= 1 && dayNum <= 31) return value;
        return day;
      default:
        return value;
    }
  };

  const handleYearChange = (value: string) => {
    const validatedValue = validateDateValue('year', value);
    setYear(validatedValue);
    onChange(buildEventFromState(validatedValue));
  };

  const handleMonthChange = (value: string) => {
    const validatedValue = validateDateValue('month', value);
    setMonth(validatedValue);
    onChange(buildEventFromState(undefined, validatedValue));
  };

  const handleDayChange = (value: string) => {
    const validatedValue = validateDateValue('day', value);
    setDay(validatedValue);
    onChange(buildEventFromState(undefined, undefined, validatedValue));
  };

  const handleCountryChange = (value: string) => {
    setCountry(value);
    onChange(buildEventFromState(undefined, undefined, undefined, value));
  };

  const handlePartnerChange = (value: string) => {
    setPartnerId(value);
    onChange(buildEventFromState(undefined, undefined, undefined, undefined, value));
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
          onChange={(e) => handleYearChange(e.target.value)}
          min="1800"
          max="2024"
          placeholder="YYYY"
        />
        <label>Month:</label>
        <input
          type="number"
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          min="1"
          max="12"
          placeholder="MM"
        />
        <label>Day:</label>
        <input
          type="number"
          value={day}
          onChange={(e) => handleDayChange(e.target.value)}
          min="1"
          max="31"
          placeholder="DD"
        />
      </div>
      <div className="form-group">
        <label>Country:</label>
        <input
          type="text"
          value={country}
          onChange={(e) => handleCountryChange(e.target.value)}
        />
      </div>
      {showPartnerSelector && (
        <div className="form-group">
          <label>Partner (optional):</label>
          <select
            value={partnerId}
            onChange={(e) => handlePartnerChange(e.target.value)}
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
