import React, { useCallback, useEffect, useState } from "react";
import { Ancestor, LocationEvent, RelationshipLevel } from "../types";
import EventEntry from "./EventEntry";
import Modal from "./Modal";

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
  const [relationship, setRelationship] = useState<RelationshipLevel | "">("");
  const [parent1Id, setParent1Id] = useState("");
  const [parent2Id, setParent2Id] = useState("");

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
      setRelationship(ancestor.relationship);
      setParent1Id(ancestor.parent1Id || "");
      setParent2Id(ancestor.parent2Id || "");

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
        a.parent1Id === ancestor.id || a.parent2Id === ancestor.id
      ).map(child => child.id);
      setSelectedChildrenIds(currentChildren);
    } else {
      // Reset form for new ancestor
      setFirstName("");
      setLastName("");
      setRelationship("");
      setParent1Id("");
      setParent2Id("");
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
  }, [ancestor]);

  const validateDateField = (
    field: string,
    value: string,
    currentValue: string
  ): string => {
    if (!value) return "";

    switch (field) {
      case "year":
        const yearStr = value.toString();
        const yearNum = parseInt(yearStr);

        // If it's a valid 4-digit year, return it as-is
        if (yearStr.length === 4 && yearNum >= 1800 && yearNum <= 2024) {
          return yearStr;
        }

        // If it's a partial year being typed, allow it
        if (yearStr.length < 4 && yearNum > 0) {
          return yearStr;
        }

        // If it's invalid, keep the previous value
        return currentValue;
      case "month":
        const monthNum = parseInt(value);
        if (monthNum < 1 || monthNum > 12) return currentValue;
        return monthNum.toString();
      case "day":
        const dayNum = parseInt(value);
        if (dayNum < 1 || dayNum > 31) return currentValue;
        return dayNum.toString();
      default:
        return value;
    }
  };

  const createLocationEvent = (
    year: string,
    month: string,
    day: string,
    country: string
  ): LocationEvent | undefined => {
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
      alert("Please select a relationship.");
      return;
    }

    const ancestorData: Omit<Ancestor, "id" | "createdAt" | "updatedAt"> = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      relationship: relationship as RelationshipLevel,
      parent1Id: parent1Id || undefined,
      parent2Id: parent2Id || undefined,
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

  const getEligibleChildren = useCallback(() => {
    if (!availablePartners || availablePartners.length === 0) return [];

    const currentAncestorBirthYear = ancestor?.birth?.date?.year || (birthYear ? parseInt(birthYear) : null);

    return availablePartners.filter(potentialChild => {
      // Can't be a child of themselves
      if (potentialChild.id === ancestor?.id) return false;


      // Birth date validation - parents must be older than children
      const childBirthYear = potentialChild.birth?.date?.year;
      if (currentAncestorBirthYear && childBirthYear) {
        if (childBirthYear <= currentAncestorBirthYear) {
          return false; // Child was born before or same year as potential parent
        }
      }

      return true;
    });
  }, [availablePartners, ancestor, birthYear]);

  const handleChildToggle = useCallback((childId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedChildrenIds(prev => [...prev, childId]);
    } else {
      setSelectedChildrenIds(prev => prev.filter(id => id !== childId));
    }
  }, []);

  return (
    <Modal
      title={ancestor ? "Edit Ancestor" : "Add Ancestor"}
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
            onChange={(e) =>
              setRelationship(e.target.value as RelationshipLevel)
            }
            required
          >
            <option value="">Select relationship</option>
            <option value="self">Self</option>
            <option value="parent">Parent</option>
            <option value="grandparent">Grandparent</option>
            <option value="great-grandparent">Great Grandparent</option>
            <option value="great-great-grandparent">
              Great Great Grandparent
            </option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="parent1">Parent 1 (optional):</label>
          <select
            id="parent1"
            value={parent1Id}
            onChange={(e) => setParent1Id(e.target.value)}
          >
            <option value="">Select parent 1 (optional)</option>
            {availablePartners
              .filter(
                (partner) =>
                  partner.id !== ancestor?.id && partner.id !== parent2Id
              )
              .map((partner) => {
                const displayName =
                  partner.firstName || partner.lastName
                    ? `${partner.firstName || ""} ${
                        partner.lastName || ""
                      }`.trim()
                    : partner.relationship.charAt(0).toUpperCase() +
                      partner.relationship.slice(1).replace("-", " ");
                return (
                  <option key={partner.id} value={partner.id}>
                    {displayName}
                  </option>
                );
              })}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="parent2">Parent 2 (optional):</label>
          <select
            id="parent2"
            value={parent2Id}
            onChange={(e) => setParent2Id(e.target.value)}
          >
            <option value="">Select parent 2 (optional)</option>
            {availablePartners
              .filter(
                (partner) =>
                  partner.id !== ancestor?.id && partner.id !== parent1Id
              )
              .map((partner) => {
                const displayName =
                  partner.firstName || partner.lastName
                    ? `${partner.firstName || ""} ${
                        partner.lastName || ""
                      }`.trim()
                    : partner.relationship.charAt(0).toUpperCase() +
                      partner.relationship.slice(1).replace("-", " ");
                return (
                  <option key={partner.id} value={partner.id}>
                    {displayName}
                  </option>
                );
              })}
          </select>
        </div>

        <fieldset className="fieldset">
          <legend>Birth Information</legend>
          <div className="date-input-group">
            <label>Year:</label>
            <input
              type="number"
              value={birthYear}
              onChange={(e) =>
                setBirthYear(
                  validateDateField("year", e.target.value, birthYear)
                )
              }
              min="1800"
              max="2024"
              placeholder="YYYY"
              maxLength={4}
            />
            <label>Month:</label>
            <input
              type="number"
              value={birthMonth}
              onChange={(e) =>
                setBirthMonth(
                  validateDateField("month", e.target.value, birthMonth)
                )
              }
              min="1"
              max="12"
              placeholder="MM"
              maxLength={2}
            />
            <label>Day:</label>
            <input
              type="number"
              value={birthDay}
              onChange={(e) =>
                setBirthDay(validateDateField("day", e.target.value, birthDay))
              }
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
            <div className="date-input-group">
              <label>Year:</label>
              <input
                type="number"
                value={deathYear}
                onChange={(e) =>
                  setDeathYear(
                    validateDateField("year", e.target.value, deathYear)
                  )
                }
                min="1800"
                max="2024"
                placeholder="YYYY"
                maxLength={4}
              />
              <label>Month:</label>
              <input
                type="number"
                value={deathMonth}
                onChange={(e) =>
                  setDeathMonth(
                    validateDateField("month", e.target.value, deathMonth)
                  )
                }
                min="1"
                max="12"
                placeholder="MM"
                maxLength={2}
              />
              <label>Day:</label>
              <input
                type="number"
                value={deathDay}
                onChange={(e) =>
                  setDeathDay(
                    validateDateField("day", e.target.value, deathDay)
                  )
                }
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
                value={deathCountry}
                onChange={(e) => setDeathCountry(e.target.value)}
              />
            </div>
          </fieldset>
        )}

        <fieldset className="fieldset">
          <legend>Children</legend>
          {getEligibleChildren().map(child => {
            const isSelected = selectedChildrenIds.includes(child.id);
            const displayName = child.firstName || child.lastName
              ? `${child.firstName || ""} ${child.lastName || ""}`.trim()
              : child.relationship.charAt(0).toUpperCase() + child.relationship.slice(1).replace("-", " ");

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
                No eligible children available. Parents must be older than their children.
              </p>
            </div>
          )}
        </fieldset>

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
