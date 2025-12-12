import React from "react";
import { validateDateField } from "../utils/dateUtils";

interface DateInputGroupProps {
  year: string;
  month: string;
  day: string;
  onYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onDayChange: (value: string) => void;
}

const DateInputGroup: React.FC<DateInputGroupProps> = ({
  year,
  month,
  day,
  onYearChange,
  onMonthChange,
  onDayChange,
}) => {
  return (
    <div className="date-input-group">
      <label>Year:</label>
      <input
        type="number"
        value={year}
        onChange={(e) =>
          onYearChange(validateDateField("year", e.target.value, year))
        }
        min="1800"
        max="2024"
        placeholder="YYYY"
        maxLength={4}
      />
      <label>Month:</label>
      <input
        type="number"
        value={month}
        onChange={(e) =>
          onMonthChange(validateDateField("month", e.target.value, month))
        }
        min="1"
        max="12"
        placeholder="MM"
        maxLength={2}
      />
      <label>Day:</label>
      <input
        type="number"
        value={day}
        onChange={(e) =>
          onDayChange(validateDateField("day", e.target.value, day))
        }
        min="1"
        max="31"
        placeholder="DD"
        maxLength={2}
      />
    </div>
  );
};

export default DateInputGroup;
