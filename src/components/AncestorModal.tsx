import React, { useState, useEffect, useCallback } from 'react';
import { Ancestor, LocationEvent, RelationshipLevel } from '../types';
import Modal from './Modal';
import EventEntry from './EventEntry';

interface AncestorModalProps {
  ancestor: Ancestor | null;
  availablePartners: Ancestor[];
  onSave: (ancestorData: Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

const AncestorModal: React.FC<AncestorModalProps> = ({ ancestor, availablePartners, onSave, onClose }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [relationship, setRelationship] = useState<RelationshipLevel | ''>('');

  // Birth info
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthCountry, setBirthCountry] = useState('');

  // Death info
  const [isAlive, setIsAlive] = useState(true);
  const [deathYear, setDeathYear] = useState('');
  const [deathMonth, setDeathMonth] = useState('');
  const [deathDay, setDeathDay] = useState('');
  const [deathCountry, setDeathCountry] = useState('');

  // Multiple events
  const [marriages, setMarriages] = useState<LocationEvent[]>([]);
  const [divorces, setDivorces] = useState<LocationEvent[]>([]);
  const [naturalizations, setNaturalizations] = useState<LocationEvent[]>([]);

  useEffect(() => {
    if (ancestor) {
      setFirstName(ancestor.firstName || '');
      setLastName(ancestor.lastName || '');
      setRelationship(ancestor.relationship);

      // Birth info
      setBirthYear(ancestor.birth?.date?.year?.toString() || '');
      setBirthMonth(ancestor.birth?.date?.month?.toString() || '');
      setBirthDay(ancestor.birth?.date?.day?.toString() || '');
      setBirthCountry(ancestor.birth?.country || '');

      // Death info
      const hasDeathInfo = ancestor.death && (ancestor.death.date || ancestor.death.country);
      setIsAlive(!hasDeathInfo);
      setDeathYear(ancestor.death?.date?.year?.toString() || '');
      setDeathMonth(ancestor.death?.date?.month?.toString() || '');
      setDeathDay(ancestor.death?.date?.day?.toString() || '');
      setDeathCountry(ancestor.death?.country || '');

      // Multiple events
      setMarriages(ancestor.marriages || []);
      setDivorces(ancestor.divorces || []);
      setNaturalizations(ancestor.naturalizations || []);
    } else {
      // Reset form for new ancestor
      setFirstName('');
      setLastName('');
      setRelationship('');
      setBirthYear('');
      setBirthMonth('');
      setBirthDay('');
      setBirthCountry('');
      setIsAlive(true);
      setDeathYear('');
      setDeathMonth('');
      setDeathDay('');
      setDeathCountry('');
      setMarriages([]);
      setDivorces([]);
      setNaturalizations([]);
    }
  }, [ancestor]);

  const createLocationEvent = (year: string, month: string, day: string, country: string): LocationEvent | undefined => {
    const hasDate = year || month || day;
    const hasCountry = country && country.trim();

    if (!hasDate && !hasCountry) {
      return undefined;
    }

    const event: LocationEvent = {};

    if (hasDate) {
      const date: any = {};
      if (year) date.year = parseInt(year);
      if (month) date.month = parseInt(month);
      if (day) date.day = parseInt(day);
      event.date = date;
    }

    if (hasCountry) {
      event.country = country.trim();
    }

    return event;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!relationship) {
      alert('Please select a relationship.');
      return;
    }

    const ancestorData: Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'> = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      relationship: relationship as RelationshipLevel,
      birth: createLocationEvent(birthYear, birthMonth, birthDay, birthCountry),
      marriages: marriages.filter(Boolean),
      divorces: divorces.filter(Boolean),
      naturalizations: naturalizations.filter(Boolean),
      death: isAlive ? undefined : createLocationEvent(deathYear, deathMonth, deathDay, deathCountry),
    };

    onSave(ancestorData);
  };

  const addMarriage = useCallback(() => {
    setMarriages(prev => [...prev, {}]);
  }, []);

  const updateMarriage = useCallback((index: number, event: LocationEvent) => {
    setMarriages(prev => {
      const newMarriages = [...prev];
      newMarriages[index] = event;
      return newMarriages;
    });
  }, []);

  const removeMarriage = useCallback((index: number) => {
    setMarriages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addDivorce = useCallback(() => {
    setDivorces(prev => [...prev, {}]);
  }, []);

  const updateDivorce = useCallback((index: number, event: LocationEvent) => {
    setDivorces(prev => {
      const newDivorces = [...prev];
      newDivorces[index] = event;
      return newDivorces;
    });
  }, []);

  const removeDivorce = useCallback((index: number) => {
    setDivorces(prev => prev.filter((_, i) => i !== index));
  }, []);

  const addNaturalization = useCallback(() => {
    setNaturalizations(prev => [...prev, {}]);
  }, []);

  const updateNaturalization = useCallback((index: number, event: LocationEvent) => {
    setNaturalizations(prev => {
      const newNaturalizations = [...prev];
      newNaturalizations[index] = event;
      return newNaturalizations;
    });
  }, []);

  const removeNaturalization = useCallback((index: number) => {
    setNaturalizations(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <Modal
      title={ancestor ? 'Edit Ancestor' : 'Add Ancestor'}
      onClose={onClose}
    >
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="first-name">First Name (optional):</label>
          <input
            type="text"
            id="first-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Leave blank to use relationship as label"
          />
        </div>

        <div className="form-group">
          <label htmlFor="last-name">Last Name (optional):</label>
          <input
            type="text"
            id="last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Leave blank to use relationship as label"
          />
        </div>

        <div className="form-group">
          <label htmlFor="relationship">Relationship:</label>
          <select
            id="relationship"
            value={relationship}
            onChange={(e) => setRelationship(e.target.value as RelationshipLevel)}
            required
          >
            <option value="">Select relationship</option>
            <option value="self">Self</option>
            <option value="parent">Parent</option>
            <option value="grandparent">Grandparent</option>
            <option value="great-grandparent">Great Grandparent</option>
            <option value="great-great-grandparent">Great Great Grandparent</option>
          </select>
        </div>

        <fieldset className="fieldset">
          <legend>Birth Information</legend>
          <div className="date-input-group">
            <label>Year:</label>
            <input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              min="1800"
              max="2024"
            />
            <label>Month:</label>
            <input
              type="number"
              value={birthMonth}
              onChange={(e) => setBirthMonth(e.target.value)}
              min="1"
              max="12"
            />
            <label>Day:</label>
            <input
              type="number"
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
              min="1"
              max="31"
            />
          </div>
          <div className="form-group">
            <label>Country:</label>
            <input
              type="text"
              value={birthCountry}
              onChange={(e) => setBirthCountry(e.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend>Marriage Information</legend>
          {marriages.map((marriage, index) => (
            <EventEntry
              key={index}
              title={`Marriage ${index + 1}`}
              event={marriage}
              onChange={(event) => updateMarriage(index, event)}
              onRemove={() => removeMarriage(index)}
              showPartnerSelector={true}
              availablePartners={availablePartners}
              currentAncestorId={ancestor?.id}
            />
          ))}
          <button type="button" className="btn btn-secondary btn-small" onClick={addMarriage}>
            Add Marriage
          </button>
        </fieldset>

        <fieldset className="fieldset">
          <legend>Divorce Information</legend>
          {divorces.map((divorce, index) => (
            <EventEntry
              key={index}
              title={`Divorce ${index + 1}`}
              event={divorce}
              onChange={(event) => updateDivorce(index, event)}
              onRemove={() => removeDivorce(index)}
              showPartnerSelector={true}
              availablePartners={availablePartners}
              currentAncestorId={ancestor?.id}
            />
          ))}
          <button type="button" className="btn btn-secondary btn-small" onClick={addDivorce}>
            Add Divorce
          </button>
        </fieldset>

        <fieldset className="fieldset">
          <legend>Naturalization Information</legend>
          {naturalizations.map((naturalization, index) => (
            <EventEntry
              key={index}
              title={`Naturalization ${index + 1}`}
              event={naturalization}
              onChange={(event) => updateNaturalization(index, event)}
              onRemove={() => removeNaturalization(index)}
            />
          ))}
          <button type="button" className="btn btn-secondary btn-small" onClick={addNaturalization}>
            Add Naturalization
          </button>
        </fieldset>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isAlive}
              onChange={(e) => setIsAlive(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Alive
          </label>
        </div>

        {!isAlive && (
          <fieldset className="fieldset">
            <legend>Death Information</legend>
            <div className="date-input-group">
              <label>Year:</label>
              <input
                type="number"
                value={deathYear}
                onChange={(e) => setDeathYear(e.target.value)}
                min="1800"
                max="2024"
              />
              <label>Month:</label>
              <input
                type="number"
                value={deathMonth}
                onChange={(e) => setDeathMonth(e.target.value)}
                min="1"
                max="12"
              />
              <label>Day:</label>
              <input
                type="number"
                value={deathDay}
                onChange={(e) => setDeathDay(e.target.value)}
                min="1"
                max="31"
              />
            </div>
            <div className="form-group">
              <label>Country:</label>
              <input
                type="text"
                value={deathCountry}
                onChange={(e) => setDeathCountry(e.target.value)}
              />
            </div>
          </fieldset>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save Ancestor
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AncestorModal;
