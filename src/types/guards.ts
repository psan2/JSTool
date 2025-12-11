import { Ancestor, LocationEvent, PartialDate, FamilyHistoryData } from '../types';

// Type guards for runtime type checking
export const TypeGuards = {
  // Check if value is a valid PartialDate
  isPartialDate(value: any): value is PartialDate {
    if (typeof value !== 'object' || value === null) return false;

    const { year, month, day } = value;

    return (
      (year === undefined || (typeof year === 'number' && year >= 1800 && year <= 2024)) &&
      (month === undefined || (typeof month === 'number' && month >= 1 && month <= 12)) &&
      (day === undefined || (typeof day === 'number' && day >= 1 && day <= 31))
    );
  },

  // Check if value is a valid LocationEvent
  isLocationEvent(value: any): value is LocationEvent {
    if (typeof value !== 'object' || value === null) return false;

    const { date, country, partnerId } = value;

    return (
      (date === undefined || this.isPartialDate(date)) &&
      (country === undefined || typeof country === 'string') &&
      (partnerId === undefined || typeof partnerId === 'string')
    );
  },

  // Check if value is a valid Ancestor
  isAncestor(value: any): value is Ancestor {
    if (typeof value !== 'object' || value === null) return false;

    const {
      id, firstName, lastName, parent1Id, parent2Id,
      birth, marriages, divorces, naturalizations, death,
      createdAt, updatedAt
    } = value;

    return (
      typeof id === 'string' &&
      (firstName === undefined || typeof firstName === 'string') &&
      (lastName === undefined || typeof lastName === 'string') &&
      (parent1Id === undefined || typeof parent1Id === 'string') &&
      (parent2Id === undefined || typeof parent2Id === 'string') &&
      (birth === undefined || this.isLocationEvent(birth)) &&
      (marriages === undefined || (Array.isArray(marriages) && marriages.every(m => this.isLocationEvent(m)))) &&
      (divorces === undefined || (Array.isArray(divorces) && divorces.every(d => this.isLocationEvent(d)))) &&
      (naturalizations === undefined || (Array.isArray(naturalizations) && naturalizations.every(n => this.isLocationEvent(n)))) &&
      (death === undefined || this.isLocationEvent(death)) &&
      typeof createdAt === 'number' &&
      typeof updatedAt === 'number'
    );
  },

  // Check if value is a valid FamilyHistoryData
  isFamilyHistoryData(value: any): value is FamilyHistoryData {
    if (typeof value !== 'object' || value === null) return false;

    const { ancestors, version, createdAt, updatedAt } = value;

    return (
      Array.isArray(ancestors) &&
      ancestors.every(a => this.isAncestor(a)) &&
      typeof version === 'string' &&
      typeof createdAt === 'number' &&
      typeof updatedAt === 'number'
    );
  },

  // Check if string is a valid ancestor ID format
  isValidAncestorId(value: string): boolean {
    return typeof value === 'string' && value.length > 0;
  },

  // Check if array contains valid ancestor IDs
  isValidAncestorIdArray(value: any): value is string[] {
    return Array.isArray(value) && value.every(id => typeof id === 'string' && id.length > 0);
  }
};

// Utility type for safe ancestor updates
export type SafeAncestorUpdate = {
  [K in keyof Partial<Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'>>]:
    K extends 'marriages' | 'divorces' | 'naturalizations'
      ? LocationEvent[]
      : K extends 'birth' | 'death'
        ? LocationEvent
        : Ancestor[K]
};

// Type for form data with proper validation
export interface ValidatedFormData {
  firstName?: string;
  lastName?: string;
  parent1Id?: string;
  parent2Id?: string;
  birth?: LocationEvent;
  marriages?: LocationEvent[];
  divorces?: LocationEvent[];
  naturalizations?: LocationEvent[];
  death?: LocationEvent;
  selectedChildrenIds?: string[];
}
