import { Ancestor } from "../types";

/**
 * Checks if a person is an ancestor (parent, grandparent, etc.) of another person
 */
function isAncestorOf(
  potentialAncestor: Ancestor,
  person: Ancestor,
  allAncestors: Ancestor[],
  visited = new Set<string>()
): boolean {
  // Prevent infinite loops
  if (visited.has(person.id)) return false;
  visited.add(person.id);

  // Check direct parents
  const parentIds = person.parentIds || [];
  if (parentIds.includes(potentialAncestor.id)) {
    return true;
  }

  // Check parents' ancestors recursively
  for (const parentId of parentIds) {
    const parent = allAncestors.find((a) => a.id === parentId);
    if (parent && isAncestorOf(potentialAncestor, parent, allAncestors, visited)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a person is a descendant (child, grandchild, etc.) of another person
 */
function isDescendantOf(
  potentialDescendant: Ancestor,
  person: Ancestor,
  allAncestors: Ancestor[]
): boolean {
  return isAncestorOf(person, potentialDescendant, allAncestors);
}

/**
 * Gets eligible parents for a person
 * Prevents circular relationships and enforces generation rules
 */
export function getEligibleParents(
  currentPerson: Ancestor | null,
  allAncestors: Ancestor[],
  selectedChildrenIds: string[]
): Ancestor[] {
  if (!allAncestors || allAncestors.length === 0) return [];

  const currentGeneration = currentPerson?.generation ?? 0;

  return allAncestors.filter((potentialParent) => {
    // Can't be a parent of themselves
    if (potentialParent.id === currentPerson?.id) return false;

    // Exclude selected children (can't be both parent and child)
    if (selectedChildrenIds.includes(potentialParent.id)) return false;

    // Generation-based filtering: parents should be from higher generation
    // Allow same generation for flexibility, but not lower
    if (potentialParent.generation < currentGeneration) return false;

    // Prevent circular relationships: can't select someone who is already a descendant
    if (currentPerson && isDescendantOf(potentialParent, currentPerson, allAncestors)) {
      return false;
    }

    return true;
  });
}

/**
 * Gets eligible children for a person
 * Prevents circular relationships and enforces generation rules
 */
export function getEligibleChildren(
  currentPerson: Ancestor | null,
  allAncestors: Ancestor[],
  selectedParentIds: string[],
  marriages: any[],
  divorces: any[],
  birthYear?: string
): Ancestor[] {
  if (!allAncestors || allAncestors.length === 0) return [];

  const currentAncestorBirthYear =
    currentPerson?.birth?.date?.year || (birthYear ? parseInt(birthYear) : null);
  const currentGeneration = currentPerson?.generation ?? 0;

  return allAncestors.filter((potentialChild) => {
    // Can't be a child of themselves
    if (potentialChild.id === currentPerson?.id) return false;

    // Exclude selected parents (can't be both parent and child)
    if (selectedParentIds.includes(potentialChild.id)) return false;

    // Can't be a current or former spouse
    const isCurrentSpouse = marriages.some(
      (marriage) => marriage.partnerId === potentialChild.id
    );
    const isFormerSpouse = divorces.some(
      (divorce) => divorce.partnerId === potentialChild.id
    );

    if (isCurrentSpouse || isFormerSpouse) {
      return false;
    }

    // Generation-based filtering: children should be from lower generation
    // Allow same generation for flexibility, but not higher
    if (potentialChild.generation > currentGeneration) return false;

    // Prevent circular relationships: can't select someone who is already an ancestor
    if (currentPerson && isAncestorOf(potentialChild, currentPerson, allAncestors)) {
      return false;
    }

    // Birth date validation - parents must be older than children
    const childBirthYear = potentialChild.birth?.date?.year;
    if (currentAncestorBirthYear && childBirthYear) {
      if (childBirthYear <= currentAncestorBirthYear) {
        return false;
      }
    }

    return true;
  });
}
