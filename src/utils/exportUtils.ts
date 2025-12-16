import { Ancestor, FamilyHistoryData } from "../types";

/**
 * Generates a relationship name based on generation number
 * Gen 0 = Self
 * Gen 1 = Parent
 * Gen 2 = Grandparent
 * Gen 3 = Great Grandparent
 * Gen 4 = Great Great Grandparent
 * Gen -1 = Child
 * Gen -2 = Grandchild
 * Gen -3 = Great Grandchild
 */
export function getRelationshipName(generation: number): string {
  if (generation === 0) {
    return "Self";
  }

  if (generation > 0) {
    // Ancestors
    if (generation === 1) {
      return "Parent";
    }
    if (generation === 2) {
      return "Grandparent";
    }
    // For generation 3+: repeat "Great" (generation - 2) times
    const greatCount = generation - 2;
    const greats = "Great ".repeat(greatCount);
    return `${greats}Grandparent`;
  }

  // Descendants (negative generation)
  const absGen = Math.abs(generation);
  if (absGen === 1) {
    return "Child";
  }
  if (absGen === 2) {
    return "Grandchild";
  }
  // For generation -3 and below: repeat "Great" (absGen - 2) times
  const greatCount = absGen - 2;
  const greats = "Great ".repeat(greatCount);
  return `${greats}Grandchild`;
}

/**
 * Creates a privacy-safe copy of ancestor data with relationship names instead of real names
 */
export function sanitizeAncestorForExport(ancestor: Ancestor): Ancestor {
  const relationshipName = getRelationshipName(ancestor.generation);

  return {
    ...ancestor,
    firstName: relationshipName,
    lastName: undefined
  };
}

/**
 * Creates a privacy-safe copy of family history data for export
 */
export function sanitizeDataForExport(data: FamilyHistoryData): FamilyHistoryData {
  return {
    ...data,
    ancestors: data.ancestors.map(sanitizeAncestorForExport)
  };
}
