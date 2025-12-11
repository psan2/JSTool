// Data types for the family history application

export interface PartialDate {
    year?: number;
    month?: number;
    day?: number;
}

export interface LocationEvent {
    date?: PartialDate;
    country?: string;
    partnerId?: string; // ID of the partner in this marriage/divorce
}

export interface Ancestor {
    id: string;
    firstName?: string;
    lastName?: string;
    relationship: 'self' | 'parent' | 'grandparent' | 'great-grandparent' | 'great-great-grandparent';
    birth?: LocationEvent;
    marriages?: LocationEvent[];
    divorces?: LocationEvent[];
    naturalizations?: LocationEvent[];
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
    firstName?: string;
    lastName?: string;
    relationship: RelationshipLevel;
    birthYear?: string;
    birthMonth?: string;
    birthDay?: string;
    birthCountry?: string;
    marriages: MarriageFormData[];
    divorces: DivorceFormData[];
    naturalizations: NaturalizationFormData[];
    deathYear?: string;
    deathMonth?: string;
    deathDay?: string;
    deathCountry?: string;
}

export interface MarriageFormData {
    year?: string;
    month?: string;
    day?: string;
    country?: string;
}

export interface DivorceFormData {
    year?: string;
    month?: string;
    day?: string;
    country?: string;
}

export interface NaturalizationFormData {
    year?: string;
    month?: string;
    day?: string;
    country?: string;
}
