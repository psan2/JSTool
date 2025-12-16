import { LocationEvent } from "../types";

/**
 * Creates a LocationEvent from date and country inputs
 */
export function createLocationEvent(
  year: string,
  month: string,
  day: string,
  country: string
): LocationEvent | undefined {
  const hasDate = year || month || day;
  const hasCountry = country; // Don't trim during check - preserve spaces while typing

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
    event.country = country.trim(); // Trim only on final save
  }

  return event;
}
