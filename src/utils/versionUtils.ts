import { FamilyHistoryData } from "../types";

// Current data schema version
export const CURRENT_DATA_VERSION = "1.0.0";

/**
 * Migrates data from older versions to the current version
 */
export function migrateData(data: FamilyHistoryData): FamilyHistoryData {
  // If no version or version is current, return as-is
  if (!data.version || data.version === CURRENT_DATA_VERSION) {
    return {
      ...data,
      version: CURRENT_DATA_VERSION
    };
  }

  // Future migration logic will go here
  // Example:
  // if (data.version === "0.9.0") {
  //   data = migrateFrom_0_9_0_to_1_0_0(data);
  // }

  return {
    ...data,
    version: CURRENT_DATA_VERSION
  };
}

/**
 * Validates that data structure matches expected version
 */
export function isCompatibleVersion(version: string): boolean {
  const [major] = version.split('.').map(Number);
  const [currentMajor] = CURRENT_DATA_VERSION.split('.').map(Number);

  // Major version must match for compatibility
  return major === currentMajor;
}

/**
 * Gets version info for display
 */
export function getVersionInfo(data: FamilyHistoryData) {
  return {
    current: CURRENT_DATA_VERSION,
    data: data.version,
    isCompatible: isCompatibleVersion(data.version),
    needsMigration: data.version !== CURRENT_DATA_VERSION
  };
}
