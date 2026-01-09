import React, { useState, useRef, useEffect } from "react";

interface AddAncestorButtonProps {
  onAddAncestor: () => void;
  onBulkEdit: () => void;
}

const AddAncestorButton: React.FC<AddAncestorButtonProps> = ({
  onAddAncestor,
  onBulkEdit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMainClick = () => {
    onAddAncestor();
    setIsOpen(false);
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      <div style={{ display: "flex", gap: "0" }}>
        <button
          className="btn btn-primary"
          onClick={handleMainClick}
          style={{
            borderTopRightRadius: "0",
            borderBottomRightRadius: "0",
            paddingRight: "15px"
          }}
        >
          Add Ancestor
        </button>
        <button
          className="btn btn-primary"
          onClick={handleDropdownToggle}
          style={{
            borderTopLeftRadius: "0",
            borderBottomLeftRadius: "0",
            borderLeft: "1px solid rgba(255,255,255,0.3)",
            paddingLeft: "8px",
            paddingRight: "8px",
            minWidth: "auto"
          }}
          title="Add options"
        >
          ▼
        </button>
      </div>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "0",
            marginTop: "5px",
            background: "white",
            border: "1px solid #ddd",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 1000,
            minWidth: "200px"
          }}
        >
          <button
            onClick={() => {
              onAddAncestor();
              setIsOpen(false);
            }}
            style={{
              width: "100%",
              padding: "10px 15px",
              border: "none",
              background: "none",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "14px",
              color: "#2c3e50"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            ➕ Add Single Ancestor
          </button>
          <button
            onClick={() => {
              onBulkEdit();
              setIsOpen(false);
            }}
            style={{
              width: "100%",
              padding: "10px 15px",
              border: "none",
              background: "none",
              textAlign: "left",
              cursor: "pointer",
              fontSize: "14px",
              color: "#2c3e50",
              borderTop: "1px solid #eee"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            📊 Bulk Add/Edit Ancestors
          </button>
        </div>
      )}
    </div>
  );
};

export default AddAncestorButton;
