/**
 * Validates a date field input and returns the validated value
 */
export function validateDateField(
  field: string,
  value: string,
  currentValue: string
): string {
  if (!value) return "";

  switch (field) {
    case "year":
      const yearStr = value.toString();
      const yearNum = parseInt(yearStr);

      // If it's a valid 4-digit year, return it as-is
      if (yearStr.length === 4 && yearNum >= 1800 && yearNum <= 2024) {
        return yearStr;
      }

      // If it's a partial year being typed, allow it
      if (yearStr.length < 4 && yearNum > 0) {
        return yearStr;
      }

      // If it's invalid, keep the previous value
      return currentValue;
    case "month":
      const monthNum = parseInt(value);
      if (monthNum < 1 || monthNum > 12) return currentValue;
      return monthNum.toString();
    case "day":
      const dayNum = parseInt(value);
      if (dayNum < 1 || dayNum > 31) return currentValue;
      return dayNum.toString();
    default:
      return value;
  }
}
