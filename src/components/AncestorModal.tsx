import React, { useCallback, useEffect, useState } from "react";
import { Ancestor, LocationEvent } from "../types";
import EventEntry from "./EventEntry";
import Modal from "./Modal";
import CountryAutocomplete from "./CountryAutocomplete";
import DateInputGroup from "./DateInputGroup";
import { createLocationEvent } from "../utils/locationUtils";
import { getDisplayName as getAncestorDisplayName } from "../utils/relationshipUtils";
import {
  getEligibleParents as getEligibleParentsUtil,
  getEligibleChildren as getEligibleChildrenUtil,
} from "../utils/ancestorFilterUtils";

interface AncestorModalProps {
  ancestor: Ancestor | null;
  availablePartners: Ancestor[];
  onSave: (
    ancestorData: Omit<Ancestor, "id" | "createdAt" | "updatedAt">
  ) => void;
  onClose: () => void;
}

const AncestorModal: React.FC<AncestorModalProps> = ({
  ancestor,
  availablePartners,
  onSave,
  onClose,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);

  // Birth info
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthCountry, setBirthCountry] = useState("");

  // Death info
  const [isAlive, setIsAlive] = useState(true);
  const [deathYear, setDeathYear] = useState("");
  const [deathMonth, setDeathMonth] = useState("");
  const [deathDay, setDeathDay] = useState("");
  const [deathCountry, setDeathCountry] = useState("");

  // Multiple events
  const [marriages, setMarriages] = useState<LocationEvent[]>([]);
  const [divorces, setDivorces] = useState<LocationEvent[]>([]);
  const [naturalizations, setNaturalizations] = useState<LocationEvent[]>([]);

  // Children management
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);

  useEffect(() => {
    if (ancestor) {
      setFirstName(ancestor.firstName || "");
      setLastName(ancestor.lastName || "");
      setSelectedParentIds(ancestor.parentIds || []);

      // Birth info
      setBirthYear(ancestor.birth?.date?.year?.toString() || "");
      setBirthMonth(ancestor.birth?.date?.month?.toString() || "");
      setBirthDay(ancestor.birth?.date?.day?.toString() || "");
      setBirthCountry(ancestor.birth?.country || "");

      // Death info
      const hasDeathInfo =
        ancestor.death && (ancestor.death.date || ancestor.death.country);
      setIsAlive(!hasDeathInfo);
      setDeathYear(ancestor.death?.date?.year?.toString() || "");
      setDeathMonth(ancestor.death?.date?.month?.toString() || "");
      setDeathDay(ancestor.death?.date?.day?.toString() || "");
      setDeathCountry(ancestor.death?.country || "");

      // Multiple events
      setMarriages(ancestor.marriages || []);
      setDivorces(ancestor.divorces || []);
      setNaturalizations(ancestor.naturalizations || []);

      // Children - find all ancestors where this person is a parent
      const currentChildren = availablePartners.filter(a =>
        a.parentIds?.includes(ancestor.id)
      ).map(child => child.id);
      setSelectedChildrenIds(currentChildren);
    } else {
      // Reset form for new ancestor
      setFirstName("");
      setLastName("");
      setSelectedParentIds([]);
      setBirthYear("");
      setBirthMonth("");
      setBirthDay("");
      setBirthCountry("");
      setIsAlive(true);
      setDeathYear("");
      setDeathMonth("");
      setDeathDay("");
      setDeathCountry("");
      setMarriages([]);
      setDivorces([]);
      setNaturalizations([]);
      setSelectedChildrenIds([]);
    }
  }, [ancestor, availablePartners]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const ancestorData: Omit<Ancestor, "id" | "createdAt" | "updatedAt"> = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      parentIds: selectedParentIds.length > 0 ? selectedParentIds : undefined,
      generation: ancestor?.generation ?? 0, // Preserve existing generation or default to 0
      birth: createLocationEvent(birthYear, birthMonth, birthDay, birthCountry),
      marriages: marriages.filter(Boolean),
      divorces: divorces.filter(Boolean),
      naturalizations: naturalizations.filter(Boolean),
      death: isAlive
        ? undefined
        : createLocationEvent(deathYear, deathMonth, deathDay, deathCountry),
    };

    // Store selected children IDs for processing after save
    (ancestorData as any).selectedChildrenIds = selectedChildrenIds;

    onSave(ancestorData);
  };

  const addMarriage = useCallback(() => {
    setMarriages((prev) => [...prev, {}]);
  }, []);

  const updateMarriage = useCallback((index: number, event: LocationEvent) => {
    setMarriages((prev) => {
      const newMarriages = [...prev];
      newMarriages[index] = event;
      return newMarriages;
    });
  }, []);

  const removeMarriage = useCallback((index: number) => {
    setMarriages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addDivorce = useCallback(() => {
    setDivorces((prev) => [...prev, {}]);
  }, []);

  const updateDivorce = useCallback((index: number, event: LocationEvent) => {
    setDivorces((prev) => {
      const newDivorces = [...prev];
      newDivorces[index] = event;
      return newDivorces;
    });
  }, []);

  const removeDivorce = useCallback((index: number) => {
    setDivorces((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addNaturalization = useCallback(() => {
    setNaturalizations((prev) => [...prev, {}]);
  }, []);

  const updateNaturalization = useCallback(
    (index: number, event: LocationEvent) => {
      setNaturalizations((prev) => {
        const newNaturalizations = [...prev];
        newNaturalizations[index] = event;
        return newNaturalizations;
      });
    },
    []
  );

  const removeNaturalization = useCallback((index: number) => {
    setNaturalizations((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const getEligibleParents = useCallback(() => {
    return getEligibleParentsUtil(ancestor, availablePartners, selectedChildrenIds);
  }, [ancestor, availablePartners, selectedChildrenIds]);

  const getEligibleChildren = useCallback(() => {
    return getEligibleChildrenUtil(
      ancestor,
      availablePartners,
      selectedParentIds,
      marriages,
      divorces,
      birthYear
    );
  }, [ancestor, availablePartners, selectedParentIds, marriages, divorces, birthYear]);

  const handleChildToggle = useCallback((childId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedChildrenIds(prev => [...prev, childId]);
    } else {
      setSelectedChildrenIds(prev => prev.filter(id => id !== childId));
    }
  }, []);

  // Use the utility function for display names
  const getDisplayName = (person: Ancestor): string => {
    return getAncestorDisplayName(person);
  };

  return (
    <Modal
      title={ancestor ? "Edit Person" : "Add Person"}
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
            placeholder="Enter first name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="last-name">Last Name (optional):</label>
          <input
            type="text"
            id="last-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter last name"
          />
        </div>

        <fieldset className="fieldset">
          <legend>Parents</legend>
          {getEligibleParents().map((partner) => {
              const displayName = getDisplayName(partner);
              const isSelected = selectedParentIds.includes(partner.id);

              return (
                <div key={partner.id} className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Add as parent
                          setSelectedParentIds(prev => [...prev, partner.id]);
                        } else {
                          // Remove as parent
                          setSelectedParentIds(prev => prev.filter(id => id !== partner.id));
                        }
                      }}
                      style={{ marginRight: "8px" }}
                    />
                    {displayName}
                    {partner.birth?.date?.year && ` (born ${partner.birth.date.year})`}
                  </label>
                </div>
              );
            })}
          {getEligibleParents().length === 0 && (
            <div className="form-group">
              <p style={{ fontStyle: 'italic', color: '#666' }}>
                No eligible parents available.
              </p>
            </div>
          )}
        </fieldset>

        <fieldset className="fieldset">
          <legend>Birth Information</legend>
          <DateInputGroup
            year={birthYear}
            month={birthMonth}
            day={birthDay}
            onYearChange={setBirthYear}
            onMonthChange={setBirthMonth}
            onDayChange={setBirthDay}
          />
          <div className="form-group">
            <label>Country:</label>
            <CountryAutocomplete
              value={birthCountry}
              onChange={setBirthCountry}
              placeholder="Enter birth country"
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
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={addMarriage}
          >
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
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={addDivorce}
          >
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
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={addNaturalization}
          >
            Add Naturalization
          </button>
        </fieldset>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isAlive}
              onChange={(e) => setIsAlive(e.target.checked)}
              style={{ marginRight: "8px" }}
            />
            Alive
          </label>
        </div>

        {!isAlive && (
          <fieldset className="fieldset">
            <legend>Death Information</legend>
            <DateInputGroup
              year={deathYear}
              month={deathMonth}
              day={deathDay}
              onYearChange={setDeathYear}
              onMonthChange={setDeathMonth}
              onDayChange={setDeathDay}
            />
            <div className="form-group">
              <label>Country:</label>
              <CountryAutocomplete
                value={deathCountry}
                onChange={setDeathCountry}
                placeholder="Enter death country"
              />
            </div>
          </fieldset>
        )}

        <fieldset className="fieldset">
          <legend>Children</legend>
          {getEligibleChildren().map(child => {
              const isSelected = selectedChildrenIds.includes(child.id);
              const displayName = getDisplayName(child);

              return (
                <div key={child.id} className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleChildToggle(child.id, e.target.checked)}
                      style={{ marginRight: "8px" }}
                    />
                    {displayName}
                    {child.birth?.date?.year && ` (born ${child.birth.date.year})`}
                  </label>
                </div>
              );
            })}
          {getEligibleChildren().length === 0 && (
            <div className="form-group">
              <p style={{ fontStyle: 'italic', color: '#666' }}>
                No eligible children available. Parents must be older than their children and cannot be current or former spouses.
              </p>
            </div>
          )}
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Save Person
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
