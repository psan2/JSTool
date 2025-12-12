import { Ancestor } from "../types";

/**
 * Determines the appropriate relationship name for a new parent
 */
export function getParentRelationshipName(
  child: Ancestor,
  allAncestors: Ancestor[]
): string {
  // Find Self (oldest ancestor by createdAt)
  const selfPerson = allAncestors.reduce(
    (oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest,
    allAncestors[0]
  );

  // If the child is Self, the new person is Parent
  if (child.id === selfPerson.id) {
    return "Parent";
  }
  // If the child is a Parent of Self, the new person is Grandparent
  else if (selfPerson.parentIds?.includes(child.id)) {
    return "Grandparent";
  }
  // Otherwise, use generic Relative
  else {
    return "Relative";
  }
}

/**
 * Determines the appropriate relationship name for a new child
 */
export function getChildRelationshipName(
  parentId: string,
  allAncestors: Ancestor[]
): string {
  // Find Self (oldest ancestor by createdAt)
  const selfPerson = allAncestors.reduce(
    (oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest,
    allAncestors[0]
  );

  // If the parent is Self, the new person is Child
  if (parentId === selfPerson.id) {
    return "Child";
  }
  // If the parent is a Child of Self, the new person is Grandchild
  else {
    const parent = allAncestors.find((a) => a.id === parentId);
    if (parent && parent.parentIds?.includes(selfPerson.id)) {
      return "Grandchild";
    } else {
      return "Relative";
    }
  }
}

/**
 * Gets the display name for an ancestor
 */
export function getDisplayName(ancestor: Ancestor): string {
  const fullName = `${ancestor.firstName || ""} ${
    ancestor.lastName || ""
  }`.trim();

  if (fullName) {
    return fullName;
  }

  return "Person";
}
