import React, { useEffect, useRef, useState } from "react";
import { Columns, RotateCcw } from "lucide-react";

const ColumnVisibilityMenu = ({ columns, visibleMap, onToggle, onShowAll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const visibleCount = columns.reduce((total, column) => {
    return total + (visibleMap[column.key] !== false ? 1 : 0);
  }, 0);
  const allColumnsVisible = visibleCount === columns.length;

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="column-controls" ref={menuRef}>
      <button
        type="button"
        className={`btn btn-outline column-toggle-button${isOpen ? " is-active" : ""}`}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Columns size={16} aria-hidden="true" />
        <span>Columns</span>
      </button>

      {isOpen && (
        <div className="column-menu" role="menu">
          <div className="column-menu-header">
            <span className="column-menu-title">Toggle columns</span>
            <button
              type="button"
              className="column-reset"
              onClick={() => {
                onShowAll();
                setIsOpen(false);
              }}
              disabled={allColumnsVisible}
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>Show all</span>
            </button>
          </div>

          <div className="column-menu-body">
            {columns.map((column) => {
              const isVisible = visibleMap[column.key] !== false;
              const isLastVisible = isVisible && visibleCount === 1;

              return (
                <label
                  key={column.key}
                  className={`column-menu-item${isLastVisible ? " is-disabled" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    disabled={isLastVisible}
                    onChange={() => onToggle(column.key)}
                  />
                  <span>{column.label}</span>
                  {isLastVisible && <span className="column-lock-note">Required</span>}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnVisibilityMenu;
