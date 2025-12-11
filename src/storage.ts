// Local storage management for family history data

import { FamilyHistoryData, Ancestor } from './types.js';

const STORAGE_KEY = 'family-history-data';
const CURRENT_VERSION = '1.0.0';

export class StorageManager {
    private static instance: StorageManager;
    private data: FamilyHistoryData;

    private constructor() {
        this.data = this.loadFromStorage();
    }

    public static getInstance(): StorageManager {
        if (!StorageManager.instance) {
            StorageManager.instance = new StorageManager();
        }
        return StorageManager.instance;
    }

    private createEmptyData(): FamilyHistoryData {
        const now = Date.now();
        return {
            ancestors: [],
            version: CURRENT_VERSION,
            createdAt: now,
            updatedAt: now
        };
    }

    private loadFromStorage(): FamilyHistoryData {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                return this.createEmptyData();
            }

            const parsed = JSON.parse(stored) as FamilyHistoryData;

            // Validate the structure
            if (!parsed.ancestors || !Array.isArray(parsed.ancestors)) {
                console.warn('Invalid data structure in storage, creating new data');
                return this.createEmptyData();
            }

            return parsed;
        } catch (error) {
            console.error('Error loading data from storage:', error);
            return this.createEmptyData();
        }
    }

    private saveToStorage(): void {
        try {
            this.data.updatedAt = Date.now();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data to storage:', error);
            throw new Error('Failed to save data to local storage');
        }
    }

    public getAllAncestors(): Ancestor[] {
        return [...this.data.ancestors];
    }

    public addAncestor(ancestor: Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'>): Ancestor {
        const now = Date.now();
        const newAncestor: Ancestor = {
            ...ancestor,
            id: this.generateId(),
            createdAt: now,
            updatedAt: now
        };

        this.data.ancestors.push(newAncestor);
        this.saveToStorage();
        return newAncestor;
    }

    public updateAncestor(id: string, updates: Partial<Omit<Ancestor, 'id' | 'createdAt' | 'updatedAt'>>): Ancestor | null {
        const index = this.data.ancestors.findIndex(a => a.id === id);
        if (index === -1) {
            return null;
        }

        this.data.ancestors[index] = {
            ...this.data.ancestors[index],
            ...updates,
            updatedAt: Date.now()
        };

        this.saveToStorage();
        return this.data.ancestors[index];
    }

    public deleteAncestor(id: string): boolean {
        const index = this.data.ancestors.findIndex(a => a.id === id);
        if (index === -1) {
            return false;
        }

        this.data.ancestors.splice(index, 1);
        this.saveToStorage();
        return true;
    }

    public clearAllData(): void {
        this.data = this.createEmptyData();
        this.saveToStorage();
    }

    public exportData(): string {
        return JSON.stringify(this.data);
    }

    public exportAsBase64(): string {
        const jsonString = this.exportData();
        return btoa(encodeURIComponent(jsonString));
    }

    public exportAsUrl(): string {
        const base64Data = this.exportAsBase64();
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('data', base64Data);
        return currentUrl.toString();
    }

    public importData(jsonString: string): boolean {
        try {
            const parsed = JSON.parse(jsonString) as FamilyHistoryData;

            // Validate the structure
            if (!parsed.ancestors || !Array.isArray(parsed.ancestors)) {
                throw new Error('Invalid data structure');
            }

            // Validate each ancestor has required fields
            for (const ancestor of parsed.ancestors) {
                if (!ancestor.id || !ancestor.firstInitial || !ancestor.lastInitial || !ancestor.relationship) {
                    throw new Error('Invalid ancestor data structure');
                }
            }

            this.data = {
                ...parsed,
                updatedAt: Date.now()
            };

            this.saveToStorage();
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    public importFromBase64(base64String: string): boolean {
        try {
            const jsonString = decodeURIComponent(atob(base64String));
            return this.importData(jsonString);
        } catch (error) {
            console.error('Error decoding base64 data:', error);
            return false;
        }
    }

    public importFromUrl(url: string): boolean {
        try {
            const urlObj = new URL(url);
            const dataParam = urlObj.searchParams.get('data');
            if (!dataParam) {
                throw new Error('No data parameter found in URL');
            }
            return this.importFromBase64(dataParam);
        } catch (error) {
            console.error('Error importing from URL:', error);
            return false;
        }
    }

    public loadFromUrlOnInit(): boolean {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const dataParam = urlParams.get('data');
            if (dataParam) {
                const success = this.importFromBase64(dataParam);
                if (success) {
                    // Clean up URL after successful import
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('data');
                    window.history.replaceState({}, document.title, newUrl.toString());
                }
                return success;
            }
            return false;
        } catch (error) {
            console.error('Error loading from URL on init:', error);
            return false;
        }
    }

    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    public getDataInfo(): { ancestorCount: number; lastUpdated: Date; version: string } {
        return {
            ancestorCount: this.data.ancestors.length,
            lastUpdated: new Date(this.data.updatedAt),
            version: this.data.version
        };
    }
}
