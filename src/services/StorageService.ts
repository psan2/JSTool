import { FamilyHistoryData } from '../types';
import { CURRENT_DATA_VERSION, migrateData } from '../utils/versionUtils';

const STORAGE_KEY = 'family-history-data';

export class StorageService {
  // Load data from localStorage
  static loadFromStorage(): FamilyHistoryData {
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

  // Save data to localStorage
  static saveToStorage(data: FamilyHistoryData): void {
    try {
      const updatedData = { ...data, updatedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error saving data to storage:', error);
      throw new Error('Failed to save data to local storage');
    }
  }

  // Create empty data structure
  static createEmptyData(): FamilyHistoryData {
    const now = Date.now();
    return {
      ancestors: [],
      version: CURRENT_DATA_VERSION,
      createdAt: now,
      updatedAt: now
    };
  }

  // Export data as JSON string
  static exportData(data: FamilyHistoryData): string {
    return JSON.stringify(data);
  }

  // Export data as base64 encoded string
  static exportAsBase64(data: FamilyHistoryData): string {
    const jsonString = this.exportData(data);
    return btoa(encodeURIComponent(jsonString));
  }

  // Export data as shareable URL
  static exportAsUrl(data: FamilyHistoryData): string {
    const base64Data = this.exportAsBase64(data);
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('data', base64Data);
    return currentUrl.toString();
  }

  // Import data from JSON string
  static importData(jsonString: string): FamilyHistoryData {
    const parsed = JSON.parse(jsonString) as FamilyHistoryData;

    // Validate the structure
    if (!parsed.ancestors || !Array.isArray(parsed.ancestors)) {
      throw new Error('Invalid data structure');
    }

    // Validate each ancestor has required fields
    for (const ancestor of parsed.ancestors) {
      if (!ancestor.id) {
        throw new Error('Invalid ancestor data structure');
      }
    }

    // Migrate data if needed
    const migratedData = migrateData(parsed);

    return {
      ...migratedData,
      updatedAt: Date.now()
    };
  }

  // Import data from base64 string
  static importFromBase64(base64String: string): FamilyHistoryData {
    const jsonString = decodeURIComponent(atob(base64String));
    return this.importData(jsonString);
  }

  // Import data from URL
  static importFromUrl(url: string): FamilyHistoryData {
    const urlObj = new URL(url);
    const dataParam = urlObj.searchParams.get('data');
    if (!dataParam) {
      throw new Error('No data parameter found in URL');
    }
    return this.importFromBase64(dataParam);
  }

  // Load data from URL parameters on app init
  static loadFromUrlOnInit(): { data: FamilyHistoryData | null; shouldCleanUrl: boolean } {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const dataParam = urlParams.get('data');
      if (dataParam) {
        const data = this.importFromBase64(dataParam);
        return { data, shouldCleanUrl: true };
      }
      return { data: null, shouldCleanUrl: false };
    } catch (error) {
      console.error('Error loading from URL on init:', error);
      return { data: null, shouldCleanUrl: false };
    }
  }

  // Clean URL after successful import
  static cleanUrlAfterImport(): void {
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('data');
    window.history.replaceState({}, document.title, newUrl.toString());
  }
}
