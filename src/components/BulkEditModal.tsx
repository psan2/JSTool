import React, { useState, useEffect, useRef } from "react";
import { Ancestor } from "../types";
import Modal from "./Modal";
import CountryAutocomplete from "./CountryAutocomplete";

interface BulkEditModalProps {
  ancestors: Ancestor[];
  onSave: (ancestors: Ancestor[]) => void;
  onClose: () => void;
}

interface EditableCell {
  ancestorId: string;
  field: string;
}

const BulkEditModal: React.FC<BulkEditModalProps> = ({
  ancestors,
  onSave,
  onClose,
}) => {
  const [editableAncestors, setEditableAncestors] = useState<Ancestor[]>([]);
  const [focusedCell, setFocusedCell] = useState<EditableCell | null>(null);
  const [newGeneration, setNewGeneration] = useState("0");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rawDateInputs, setRawDateInputs] = useState<Map<string, string>>(new Map());
  const [invalidDates, setInvalidDates] = useState<Set<string>>(new Set());
  const tableRef = useRef<HTMLDivElement>(null);

  // Sort ancestors by generation (descending - ancestors first)
  useEffect(() => {
    const sorted = [...ancestors].sort((a, b) => b.generation - a.generation);
    setEditableAncestors(sorted);
  }, [ancestors]);

  const fields = [
    "generation",
    "firstName",
    "lastName",
    "birthDate",
    "natzDate",
    "natzCountry",
    "marriageDate",
    "marriageCountry",
    "deathDate",
    "deathCountry",
  ];

  const handleCellChange = (ancestorId: string, field: keyof Ancestor, value: any) => {
    setEditableAncestors(prev =>
      prev.map(a =>
        a.id === ancestorId
          ? { ...a, [field]: value, updatedAt: Date.now() }
          : a
      )
    );
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    ancestorId: string,
    fieldName: string
  ) => {
    const currentRowIndex = editableAncestors.findIndex(a => a.id === ancestorId);
    const currentFieldIndex = fields.indexOf(fieldName);

    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Tab: Move left
        if (currentFieldIndex > 0) {
          setFocusedCell({ ancestorId, field: fields[currentFieldIndex - 1] });
        } else if (currentRowIndex > 0) {
          // Move to last field of previous row
          setFocusedCell({
            ancestorId: editableAncestors[currentRowIndex - 1].id,
            field: fields[fields.length - 1],
          });
        }
      } else {
        // Tab: Move right
        if (currentFieldIndex < fields.length - 1) {
          setFocusedCell({ ancestorId, field: fields[currentFieldIndex + 1] });
        } else if (currentRowIndex < editableAncestors.length - 1) {
          // Move to first field of next row
          setFocusedCell({
            ancestorId: editableAncestors[currentRowIndex + 1].id,
            field: fields[0],
          });
        }
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (e.shiftKey) {
        // Shift+Enter: Move up
        if (currentRowIndex > 0) {
          setFocusedCell({
            ancestorId: editableAncestors[currentRowIndex - 1].id,
            field: fieldName,
          });
        }
      } else {
        // Enter: Move down
        if (currentRowIndex < editableAncestors.length - 1) {
          setFocusedCell({
            ancestorId: editableAncestors[currentRowIndex + 1].id,
            field: fieldName,
          });
        }
      }
    }
  };

  // Focus management
  useEffect(() => {
    if (focusedCell && tableRef.current) {
      const input = tableRef.current.querySelector(
        `input[data-ancestor-id="${focusedCell.ancestorId}"][data-field="${focusedCell.field}"]`
      ) as HTMLInputElement;
      if (input) {
        input.focus();
      }
    }
  }, [focusedCell]);

  const handleAddAncestor = () => {
    const gen = parseInt(newGeneration) || 0;
    const now = Date.now();

    const newAncestor: Ancestor = {
      id: `temp-${now}`,
      firstName: "",
      generation: gen,
      createdAt: now,
      updatedAt: now,
    };

    setEditableAncestors(prev => {
      const updated = [...prev, newAncestor];
      return updated.sort((a, b) => b.generation - a.generation);
    });
  };

  const handleToggleSelect = (ancestorId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ancestorId)) {
        newSet.delete(ancestorId);
      } else {
        newSet.add(ancestorId);
      }
      return newSet;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === editableAncestors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(editableAncestors.map(a => a.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected ancestor(s)?`)) {
      setEditableAncestors(prev => prev.filter(a => !selectedIds.has(a.id)));
      setSelectedIds(new Set());
    }
  };

  const handleSave = () => {
    if (invalidDates.size > 0) {
      alert("Please fix invalid dates before saving.");
      return;
    }
    onSave(editableAncestors);
  };

  const formatDate = (date?: { year?: number; month?: number; day?: number }) => {
    if (!date) return "";
    const parts = [];
    if (date.year) parts.push(date.year);
    if (date.month) parts.push(date.month.toString().padStart(2, "0"));
    if (date.day) parts.push(date.day.toString().padStart(2, "0"));
    return parts.join("-");
  };

  const parseDate = (dateStr: string): { year?: number; month?: number; day?: number } | null => {
    if (!dateStr || !dateStr.trim()) return null;

    // Split by dash, slash, or period
    const parts = dateStr.split(/[-\/\.]/).filter(p => p.trim());

    // Validate format: YYYY, YYYY-MM, or YYYY-MM-DD
    if (parts.length < 1 || parts.length > 3) return null;

    const date: any = {};

    // Year (required)
    if (parts[0]) {
      const year = parseInt(parts[0]);
      if (parts[0].length !== 4 || year < 1800 || year > 2100) return null;
      date.year = year;
    }

    // Month (optional)
    if (parts[1]) {
      const month = parseInt(parts[1]);
      if (month < 1 || month > 12) return null;
      date.month = month;
    }

    // Day (optional, requires month)
    if (parts[2]) {
      if (!parts[1]) return null; // Can't have day without month
      const day = parseInt(parts[2]);
      if (day < 1 || day > 31) return null;
      date.day = day;
    }

    return date;
  };

  const handleDateBlur = (ancestorId: string, field: keyof Ancestor, rawValue: string, fieldKey: string) => {
    const parsed = parseDate(rawValue);

    if (rawValue.trim() && !parsed) {
      // Invalid date - mark as error
      setInvalidDates(prev => new Set(prev).add(`${ancestorId}-${fieldKey}`));
    } else {
      // Valid or empty - clear error and save
      setInvalidDates(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${ancestorId}-${fieldKey}`);
        return newSet;
      });

      if (parsed) {
        handleCellChange(ancestorId, field, { date: parsed });
      } else {
        handleCellChange(ancestorId, field, undefined);
      }
    }
  };

  const handleDateChange = (ancestorId: string, fieldKey: string, value: string) => {
    // Store raw input
    setRawDateInputs(prev => {
      const newMap = new Map(prev);
      newMap.set(`${ancestorId}-${fieldKey}`, value);
      return newMap;
    });
  };

  const getRawDateValue = (ancestorId: string, fieldKey: string, formattedValue: string): string => {
    const key = `${ancestorId}-${fieldKey}`;
    return rawDateInputs.get(key) ?? formattedValue;
  };

  const isDateInvalid = (ancestorId: string, fieldKey: string): boolean => {
    return invalidDates.has(`${ancestorId}-${fieldKey}`);
  };

  return (
    <Modal title="Bulk Add/Edit Ancestors" onClose={onClose} maxWidth="90%">
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <label>
              Add Ancestor to Generation:
              <input
                type="number"
                value={newGeneration}
                onChange={(e) => setNewGeneration(e.target.value)}
                style={{
                  marginLeft: "10px",
                  padding: "5px",
                  width: "60px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            </label>
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={handleAddAncestor}
            >
              Add Ancestor
            </button>
          </div>
          {selectedIds.size > 0 && (
            <button
              type="button"
              className="btn btn-danger btn-small"
              onClick={handleDeleteSelected}
            >
              Delete Selected ({selectedIds.size})
            </button>
          )}
        </div>

        <div
          ref={tableRef}
          style={{
            overflowX: "auto",
            maxHeight: "60vh",
            border: "1px solid #ddd",
            borderRadius: "4px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
            }}
          >
            <thead>
              <tr style={{ background: "#f8f9fa", position: "sticky", top: 0 }}>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd", width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === editableAncestors.length && editableAncestors.length > 0}
                    onChange={handleToggleSelectAll}
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd", minWidth: "60px" }}>Gen</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd", minWidth: "120px" }}>First Name</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd", minWidth: "120px" }}>Last Name</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd", minWidth: "100px" }}>Birth Date</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd", minWidth: "100px" }}>Natz Date</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd", minWidth: "120px" }}>Natz Country</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd", minWidth: "100px" }}>Marriage Date</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd", minWidth: "120px" }}>Marriage Country</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd", minWidth: "100px" }}>Death Date</th>
                <th style={{ padding: "10px", borderBottom: "2px solid #ddd", minWidth: "120px" }}>Death Country</th>
              </tr>
            </thead>
            <tbody>
              {editableAncestors.map((ancestor, rowIndex) => (
                <tr key={ancestor.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "5px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(ancestor.id)}
                      onChange={() => handleToggleSelect(ancestor.id)}
                      style={{ cursor: "pointer" }}
                    />
                  </td>
                  <td style={{ padding: "5px" }}>
                    <input
                      type="number"
                      name={`${ancestor.id}-generation`}
                      value={ancestor.generation}
                      onChange={(e) =>
                        handleCellChange(ancestor.id, "generation", parseInt(e.target.value) || 0)
                      }
                      onKeyDown={(e) => handleKeyDown(e, ancestor.id, "generation")}
                      data-ancestor-id={ancestor.id}
                      data-field="generation"
                      style={{
                        width: "100%",
                        padding: "5px",
                        border: "1px solid #ddd",
                        borderRadius: "2px",
                      }}
                    />
                  </td>
                  <td style={{ padding: "5px" }}>
                    <input
                      type="text"
                      name={`${ancestor.id}-firstName`}
                      value={ancestor.firstName || ""}
                      onChange={(e) =>
                        handleCellChange(ancestor.id, "firstName", e.target.value || undefined)
                      }
                      onKeyDown={(e) => handleKeyDown(e, ancestor.id, "firstName")}
                      data-ancestor-id={ancestor.id}
                      data-field="firstName"
                      style={{
                        width: "100%",
                        padding: "5px",
                        border: "1px solid #ddd",
                        borderRadius: "2px",
                      }}
                    />
                  </td>
                  <td style={{ padding: "5px" }}>
                    <input
                      type="text"
                      name={`${ancestor.id}-lastName`}
                      value={ancestor.lastName || ""}
                      onChange={(e) =>
                        handleCellChange(ancestor.id, "lastName", e.target.value || undefined)
                      }
                      onKeyDown={(e) => handleKeyDown(e, ancestor.id, "lastName")}
                      data-ancestor-id={ancestor.id}
                      data-field="lastName"
                      style={{
                        width: "100%",
                        padding: "5px",
                        border: "1px solid #ddd",
                        borderRadius: "2px",
                      }}
                    />
                  </td>
                  <td style={{ padding: "5px", position: "relative" }}>
                    <input
                      type="text"
                      name={`${ancestor.id}-birthDate`}
                      value={getRawDateValue(ancestor.id, "birthDate", formatDate(ancestor.birth?.date))}
                      onChange={(e) => handleDateChange(ancestor.id, "birthDate", e.target.value)}
                      onBlur={(e) => handleDateBlur(ancestor.id, "birth", e.target.value, "birthDate")}
                      onKeyDown={(e) => handleKeyDown(e, ancestor.id, "birthDate")}
                      data-ancestor-id={ancestor.id}
                      data-field="birthDate"
                      placeholder="YYYY-MM-DD"
                      autoComplete="off"
                      style={{
                        width: "100%",
                        padding: "5px",
                        border: isDateInvalid(ancestor.id, "birthDate") ? "2px solid #e74c3c" : "1px solid #ddd",
                        borderRadius: "2px",
                        backgroundColor: isDateInvalid(ancestor.id, "birthDate") ? "#fff5f5" : "white",
                      }}
                    />
                    {isDateInvalid(ancestor.id, "birthDate") && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: "5px",
                        fontSize: "10px",
                        color: "#e74c3c",
                        marginTop: "2px"
                      }}>
                        Invalid Date
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "5px", position: "relative" }}>
                    <input
                      type="text"
                      name={`${ancestor.id}-natzDate`}
                      value={getRawDateValue(ancestor.id, "natzDate", formatDate(ancestor.naturalizations?.[0]?.date))}
                      onChange={(e) => handleDateChange(ancestor.id, "natzDate", e.target.value)}
                      onBlur={(e) => handleDateBlur(ancestor.id, "naturalizations", e.target.value, "natzDate")}
                      onKeyDown={(e) => handleKeyDown(e, ancestor.id, "natzDate")}
                      data-ancestor-id={ancestor.id}
                      data-field="natzDate"
                      placeholder="YYYY-MM-DD"
                      autoComplete="off"
                      style={{
                        width: "100%",
                        padding: "5px",
                        border: isDateInvalid(ancestor.id, "natzDate") ? "2px solid #e74c3c" : "1px solid #ddd",
                        borderRadius: "2px",
                        backgroundColor: isDateInvalid(ancestor.id, "natzDate") ? "#fff5f5" : "white",
                      }}
                    />
                    {isDateInvalid(ancestor.id, "natzDate") && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: "5px",
                        fontSize: "10px",
                        color: "#e74c3c",
                        marginTop: "2px"
                      }}>
                        Invalid Date
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "5px" }}>
                    <div
                      onKeyDown={(e) => {
                        // Only handle Tab and Enter for navigation, let CountryAutocomplete handle other keys
                        if (e.key === "Tab" || e.key === "Enter") {
                          handleKeyDown(e as any, ancestor.id, "natzCountry");
                        }
                      }}
                      data-ancestor-id={ancestor.id}
                      data-field="natzCountry"
                    >
                      <CountryAutocomplete
                        name={`${ancestor.id}-natzCountry`}
                        value={ancestor.naturalizations?.[0]?.country || ""}
                        onChange={(country) => {
                          const existing = ancestor.naturalizations?.[0];
                          const natz = country || existing?.date ? [{ ...existing, country }] : undefined;
                          handleCellChange(ancestor.id, "naturalizations", natz);
                        }}
                        placeholder="Country"
                        inputStyle={{
                          width: "100%",
                          padding: "5px",
                          border: "1px solid #ddd",
                          borderRadius: "2px",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: "5px", position: "relative" }}>
                    <input
                      type="text"
                      name={`${ancestor.id}-marriageDate`}
                      value={getRawDateValue(ancestor.id, "marriageDate", formatDate(ancestor.marriages?.[0]?.date))}
                      onChange={(e) => handleDateChange(ancestor.id, "marriageDate", e.target.value)}
                      onBlur={(e) => handleDateBlur(ancestor.id, "marriages", e.target.value, "marriageDate")}
                      onKeyDown={(e) => handleKeyDown(e, ancestor.id, "marriageDate")}
                      data-ancestor-id={ancestor.id}
                      data-field="marriageDate"
                      placeholder="YYYY-MM-DD"
                      autoComplete="off"
                      style={{
                        width: "100%",
                        padding: "5px",
                        border: isDateInvalid(ancestor.id, "marriageDate") ? "2px solid #e74c3c" : "1px solid #ddd",
                        borderRadius: "2px",
                        backgroundColor: isDateInvalid(ancestor.id, "marriageDate") ? "#fff5f5" : "white",
                      }}
                    />
                    {isDateInvalid(ancestor.id, "marriageDate") && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: "5px",
                        fontSize: "10px",
                        color: "#e74c3c",
                        marginTop: "2px"
                      }}>
                        Invalid Date
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "5px" }}>
                    <div
                      onKeyDown={(e) => {
                        if (e.key === "Tab" || e.key === "Enter") {
                          handleKeyDown(e as any, ancestor.id, "marriageCountry");
                        }
                      }}
                      data-ancestor-id={ancestor.id}
                      data-field="marriageCountry"
                    >
                      <CountryAutocomplete
                        name={`${ancestor.id}-marriageCountry`}
                        value={ancestor.marriages?.[0]?.country || ""}
                        onChange={(country) => {
                          const existing = ancestor.marriages?.[0];
                          const marriage = country || existing?.date ? [{ ...existing, country }] : undefined;
                          handleCellChange(ancestor.id, "marriages", marriage);
                        }}
                        placeholder="Country"
                        inputStyle={{
                          width: "100%",
                          padding: "5px",
                          border: "1px solid #ddd",
                          borderRadius: "2px",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: "5px", position: "relative" }}>
                    <input
                      type="text"
                      name={`${ancestor.id}-deathDate`}
                      value={getRawDateValue(ancestor.id, "deathDate", formatDate(ancestor.death?.date))}
                      onChange={(e) => handleDateChange(ancestor.id, "deathDate", e.target.value)}
                      onBlur={(e) => handleDateBlur(ancestor.id, "death", e.target.value, "deathDate")}
                      onKeyDown={(e) => handleKeyDown(e, ancestor.id, "deathDate")}
                      data-ancestor-id={ancestor.id}
                      data-field="deathDate"
                      placeholder="YYYY-MM-DD"
                      autoComplete="off"
                      style={{
                        width: "100%",
                        padding: "5px",
                        border: isDateInvalid(ancestor.id, "deathDate") ? "2px solid #e74c3c" : "1px solid #ddd",
                        borderRadius: "2px",
                        backgroundColor: isDateInvalid(ancestor.id, "deathDate") ? "#fff5f5" : "white",
                      }}
                    />
                    {isDateInvalid(ancestor.id, "deathDate") && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: "5px",
                        fontSize: "10px",
                        color: "#e74c3c",
                        marginTop: "2px"
                      }}>
                        Invalid Date
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "5px" }}>
                    <div
                      onKeyDown={(e) => {
                        if (e.key === "Tab" || e.key === "Enter") {
                          handleKeyDown(e as any, ancestor.id, "deathCountry");
                        }
                      }}
                      data-ancestor-id={ancestor.id}
                      data-field="deathCountry"
                    >
                      <CountryAutocomplete
                        name={`${ancestor.id}-deathCountry`}
                        value={ancestor.death?.country || ""}
                        onChange={(country) => {
                          const existing = ancestor.death;
                          handleCellChange(ancestor.id, "death", country || existing?.date ? { ...existing, country } : undefined);
                        }}
                        placeholder="Country"
                        inputStyle={{
                          width: "100%",
                          padding: "5px",
                          border: "1px solid #ddd",
                          borderRadius: "2px",
                          fontSize: "14px",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-actions" style={{ marginTop: "20px" }}>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save All Changes
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkEditModal;
