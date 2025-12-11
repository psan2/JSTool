// Data types for the family history application

export interface PartialDate {
    year?: number;
    month?: number;
    day?: number;
}

export interface LocationEvent {
    date?: PartialDate;
    country?: string;
}

export interface Ancestor {
    id: string;
    firstInitial: string;
    lastInitial: string;
    relationship: 'self' | 'parent' | 'grandparent' | 'great-grandparent' | 'great-great-grandparent';
    birth?: LocationEvent;
    marriage?: LocationEvent;
    naturalization?: LocationEvent;
    death?: LocationEvent;
    createdAt: number;
    updatedAt: number;
}

export interface FamilyHistoryData {
    ancestors: Ancestor[];
    version: string;
    createdAt: number;
    updatedAt: number;
}

export type RelationshipLevel = 'self' | 'parent' | 'grandparent' | 'great-grandparent' | 'great-great-grandparent';

// Utility type for form data
export interface AncestorFormData {
    firstInitial: string;
    lastInitial: string;
    relationship: RelationshipLevel;
    birthYear?: string;
    birthMonth?: string;
    birthDay?: string;
    birthCountry?: string;
    marriageYear?: string;
    marriageMonth?: string;
    marriageDay?: string;
    marriageCountry?: string;
    naturalizationYear?: string;
    naturalizationMonth?: string;
    naturalizationDay?: string;
    naturalizationCountry?: string;
    deathYear?: string;
    deathMonth?: string;
    deathDay?: string;
    deathCountry?: string;
}
