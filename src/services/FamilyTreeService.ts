import { Ancestor, LocationEvent } from '../types';

export class FamilyTreeService {
  // Helper function to infer relationship based on family tree position
  static inferRelationship(ancestor: Ancestor, allAncestors: Ancestor[], selfId: string): string {
    if (ancestor.id === selfId) return 'Self';

    // Check if this person is a parent of self
    const selfAncestor = allAncestors.find(a => a.id === selfId);
    if (selfAncestor && (selfAncestor.parent1Id === ancestor.id || selfAncestor.parent2Id === ancestor.id)) {
      return 'Parent';
    }

    // Check if this person is a child of self
    if (ancestor.parent1Id === selfId || ancestor.parent2Id === selfId) {
      return 'Child';
    }

    // Check if this person is a grandparent (parent of self's parent)
    if (selfAncestor) {
      const parent1 = allAncestors.find(a => a.id === selfAncestor.parent1Id);
      const parent2 = allAncestors.find(a => a.id === selfAncestor.parent2Id);

      if ((parent1 && (parent1.parent1Id === ancestor.id || parent1.parent2Id === ancestor.id)) ||
          (parent2 && (parent2.parent1Id === ancestor.id || parent2.parent2Id === ancestor.id))) {
        return 'Grandparent';
      }
    }

    // Check if this person is a grandchild (child of self's child)
    const children = allAncestors.filter(a => a.parent1Id === selfId || a.parent2Id === selfId);
    for (const child of children) {
      if (ancestor.parent1Id === child.id || ancestor.parent2Id === child.id) {
        return 'Grandchild';
      }
    }

    return 'Relative';
  }

  // Get display name for an ancestor
  static getDisplayName(ancestor: Ancestor, allAncestors: Ancestor[]): string {
    // Always prioritize actual names if they exist
    const fullName = `${ancestor.firstName || ''} ${ancestor.lastName || ''}`.trim();
    if (fullName) {
      return fullName;
    }

    // Only show relationship if no name is provided
    const selfPerson = allAncestors.find(a => !a.parent1Id && !a.parent2Id) || allAncestors[0];
    if (selfPerson) {
      return this.inferRelationship(ancestor, allAncestors, selfPerson.id);
    }

    return 'Person';
  }

  // Update bidirectional relationships for marriages and divorces
  static updateBidirectionalRelationships(ancestors: Ancestor[], changedAncestor: Ancestor): Ancestor[] {
    const updatedAncestors = [...ancestors];

    // Handle marriages
    if (changedAncestor.marriages) {
      changedAncestor.marriages.forEach(marriage => {
        if (marriage.partnerId) {
          const partnerIndex = updatedAncestors.findIndex(a => a.id === marriage.partnerId);
          if (partnerIndex !== -1) {
            const partner = updatedAncestors[partnerIndex];

            // Check if partner already has this marriage
            const partnerMarriages = partner.marriages || [];
            const hasExistingMarriage = partnerMarriages.some(m => m.partnerId === changedAncestor.id);

            if (!hasExistingMarriage) {
              // Add the reciprocal marriage to the partner
              const reciprocalMarriage: LocationEvent = {
                ...marriage,
                partnerId: changedAncestor.id
              };

              updatedAncestors[partnerIndex] = {
                ...partner,
                marriages: [...partnerMarriages, reciprocalMarriage],
                updatedAt: Date.now()
              };
            }
          }
        }
      });
    }

    // Handle divorces
    if (changedAncestor.divorces) {
      changedAncestor.divorces.forEach(divorce => {
        if (divorce.partnerId) {
          const partnerIndex = updatedAncestors.findIndex(a => a.id === divorce.partnerId);
          if (partnerIndex !== -1) {
            const partner = updatedAncestors[partnerIndex];

            // Check if partner already has this divorce
            const partnerDivorces = partner.divorces || [];
            const hasExistingDivorce = partnerDivorces.some(d => d.partnerId === changedAncestor.id);

            if (!hasExistingDivorce) {
              // Add the reciprocal divorce to the partner
              const reciprocalDivorce: LocationEvent = {
                ...divorce,
                partnerId: changedAncestor.id
              };

              updatedAncestors[partnerIndex] = {
                ...partner,
                divorces: [...partnerDivorces, reciprocalDivorce],
                updatedAt: Date.now()
              };
            }
          }
        }
      });
    }

    return updatedAncestors;
  }

  // Validate if a person can be a child of another person
  static canBeChild(potentialChild: Ancestor, potentialParent: Ancestor, marriages: LocationEvent[] = [], divorces: LocationEvent[] = []): boolean {
    // Can't be a child of themselves
    if (potentialChild.id === potentialParent.id) return false;

    // Can't be a current or former spouse
    const isCurrentSpouse = marriages.some(marriage => marriage.partnerId === potentialChild.id);
    const isFormerSpouse = divorces.some(divorce => divorce.partnerId === potentialChild.id);

    if (isCurrentSpouse || isFormerSpouse) {
      return false; // Exclude spouses from potential children
    }

    // Birth date validation - parents must be older than children
    const childBirthYear = potentialChild.birth?.date?.year;
    const parentBirthYear = potentialParent.birth?.date?.year;

    if (parentBirthYear && childBirthYear) {
      if (childBirthYear <= parentBirthYear) {
        return false; // Child was born before or same year as potential parent
      }
    }

    return true;
  }

  // Get eligible children for a given ancestor
  static getEligibleChildren(ancestor: Ancestor, allAncestors: Ancestor[], marriages: LocationEvent[] = [], divorces: LocationEvent[] = []): Ancestor[] {
    return allAncestors.filter(potentialChild =>
      this.canBeChild(potentialChild, ancestor, marriages, divorces)
    );
  }

  // Check if ancestor is new user (blank Self)
  static isNewUser(ancestors: Ancestor[]): boolean {
    if (ancestors.length !== 1) return false;

    const selfPerson = ancestors.find(a => !a.parent1Id && !a.parent2Id) || ancestors[0];
    return !selfPerson.firstName && !selfPerson.lastName &&
           !selfPerson.birth && !selfPerson.marriages?.length &&
           !selfPerson.divorces?.length && !selfPerson.naturalizations?.length &&
           !selfPerson.death;
  }

  // Validate date field input
  static validateDateField(field: string, value: string, currentValue: string): string {
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
  }

  // Create location event from form data
  static createLocationEvent(year: string, month: string, day: string, country: string): LocationEvent | undefined {
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
  }
}
