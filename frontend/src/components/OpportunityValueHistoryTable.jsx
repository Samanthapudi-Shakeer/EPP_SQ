import React, { useContext, useEffect, useMemo, useState } from "react";
import { PlusCircle, Pencil, Trash2, XCircle } from "lucide-react";
import { useGlobalSearch } from "../context/GlobalSearchContext";
import { SectionItemContext } from "./SectionLayout";
import { buildTableSearchItems } from "../utils/searchRegistry";
import MultiLineTrendChart from "./charts/MultiLineTrendChart";
import {
  ALLOWED_OPPORTUNITY_VALUES,
  deriveOpportunityValue,
  getOpportunityValueClassName
} from "../utils/opportunityValue";

const normalizeDateInput = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

const formatDateForDisplay = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(date);
};

const OpportunityValueHistoryTable = ({
  opportunityValues = [],
  opportunityRegister = [],
  onAdd,
  onEdit,
  onDelete,
  isEditor,
  loading
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formValues, setFormValues] = useState({
    opportunity: "",
    date: "",
    opportunity_value: ""
  });
  const [activeRowId, setActiveRowId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { searchTerm, registerSource, navigateToSection } = useGlobalSearch();
  const sectionContext = useContext(SectionItemContext);

  const anchorPrefix = useMemo(() => {
    if (!sectionContext?.projectId || !sectionContext?.sectionId || !sectionContext?.itemId) {
      return null;
    }

    return `search-${sectionContext.projectId}-${sectionContext.sectionId}-${sectionContext.itemId}`;
  }, [sectionContext?.projectId, sectionContext?.sectionId, sectionContext?.itemId]);

  const opportunityDetailsMap = useMemo(() => {
    const details = new Map();
    opportunityRegister.forEach((row) => {
      if (row?.opportunity_id) {
        details.set(row.opportunity_id, row);
      }
    });
    return details;
  }, [opportunityRegister]);

  const valuesByOpportunity = useMemo(() => {
    const map = new Map();

    opportunityValues.forEach((row) => {
      const opportunityId = row?.opportunity;
      if (!opportunityId) {
        return;
      }

      const normalizedDate = normalizeDateInput(row.date) || row.date || "";
      if (!map.has(opportunityId)) {
        map.set(opportunityId, {});
      }

      const resolvedValue =
        row.opportunity_value !== null && row.opportunity_value !== undefined
          ? String(row.opportunity_value)
          : "";

      map.get(opportunityId)[normalizedDate] = {
        rowId: row.id,
        normalizedDate,
        originalDate: row.date,
        value: resolvedValue
      };
    });

    return map;
  }, [opportunityValues]);

  const uniqueDates = useMemo(() => {
    const dates = new Set();
    opportunityValues.forEach((row) => {
      const normalizedDate = normalizeDateInput(row.date) || row.date || "";
      if (normalizedDate) {
        dates.add(normalizedDate);
      }
    });

    return Array.from(dates).sort((a, b) => {
      const aDate = new Date(a);
      const bDate = new Date(b);

      if (!Number.isNaN(aDate.getTime()) && !Number.isNaN(bDate.getTime())) {
        return aDate.getTime() - bDate.getTime();
      }

      return String(a).localeCompare(String(b), undefined, {
        sensitivity: "base",
        numeric: true
      });
    });
  }, [opportunityValues]);

  const opportunityIds = useMemo(() => {
    const ids = new Set();

    opportunityRegister.forEach((row) => {
      if (row?.opportunity_id) {
        ids.add(row.opportunity_id);
      }
    });

    opportunityValues.forEach((row) => {
      if (row?.opportunity) {
        ids.add(row.opportunity);
      }
    });

    return Array.from(ids).sort((a, b) =>
      String(a).localeCompare(String(b), undefined, { sensitivity: "base", numeric: true })
    );
  }, [opportunityRegister, opportunityValues]);

  const columnDefinitions = useMemo(() => {
    const baseColumns = [
      { key: "opportunity", label: "Opportunity" },
      { key: "date_of_opportunity_identified", label: "Date of Opportunity Identified" },
      { key: "initial_opportunity_value", label: "Initial Opportunity Value" }
    ];

    const dateColumns = uniqueDates.map((dateKey) => ({
      key: `opportunity_on_${dateKey}`,
      label: `Opportunity on ${formatDateForDisplay(dateKey) || dateKey}`,
      dateKey
    }));

    return [...baseColumns, ...dateColumns];
  }, [uniqueDates]);

  const tableRows = useMemo(() => {
    return opportunityIds.map((opportunityId) => {
      const details = opportunityDetailsMap.get(opportunityId) || {};
      const valuesForOpportunity = valuesByOpportunity.get(opportunityId) || {};

      const derivedInitialValue = deriveOpportunityValue(details);
      const initialValue =
        derivedInitialValue ||
        (details.opportunity_value !== null && details.opportunity_value !== undefined
          ? String(details.opportunity_value)
          : "");

      const values = {
        opportunity: opportunityId,
        date_of_opportunity_identified: details.date_of_identification || "",
        initial_opportunity_value: initialValue
      };

      const cells = {};
      uniqueDates.forEach((dateKey) => {
        const columnKey = `opportunity_on_${dateKey}`;
        const valueEntry = valuesForOpportunity[dateKey];
        values[columnKey] = valueEntry?.value || "";
        cells[columnKey] = valueEntry || null;
      });

      return {
        opportunityId,
        values,
        cells
      };
    });
  }, [opportunityDetailsMap, valuesByOpportunity, opportunityIds, uniqueDates]);

  const trendSeries = useMemo(() => {
    return opportunityIds
      .map((opportunityId) => {
        const valuesForOpportunity = valuesByOpportunity.get(opportunityId) || {};
        const details = opportunityDetailsMap.get(opportunityId) || {};

        const values = uniqueDates.map((dateKey) => {
          const entry = valuesForOpportunity[dateKey];
          if (!entry || entry.value === null || entry.value === undefined || entry.value === "") {
            return null;
          }

          const numeric = Number(entry.value);
          return Number.isFinite(numeric) ? numeric : null;
        });

        if (!values.some((value) => value !== null)) {
          return null;
        }

        const descriptor = details.opportunity_description
          ? ` - ${String(details.opportunity_description).slice(0, 40)}`
          : "";

        return {
          id: opportunityId,
          label: `Opportunity ${opportunityId}${descriptor}`,
          values
        };
      })
      .filter(Boolean);
  }, [opportunityIds, valuesByOpportunity, opportunityDetailsMap, uniqueDates]);

  useEffect(() => {
    if (
      !registerSource ||
      !sectionContext?.projectId ||
      !sectionContext?.sectionId ||
      !sectionContext?.itemId
    ) {
      return undefined;
    }

    const sourceId = `${sectionContext.projectId}-${sectionContext.sectionId}-${sectionContext.itemId}`;
    const rowsForSearch = tableRows.map((row) => ({ id: row.opportunityId, ...row.values }));

    const unregister = registerSource({
      id: sourceId,
      getItems: () =>
        buildTableSearchItems({
          projectId: sectionContext.projectId,
          sectionId: sectionContext.sectionId,
          sectionLabel: sectionContext.sectionLabel,
          tableId: sectionContext.itemId,
          tableLabel: sectionContext.itemLabel,
          rows: rowsForSearch,
          columns: columnDefinitions.map(({ key, label }) => ({ key, label })),
          navigateToSection,
          anchorPrefix
        })
    });

    return unregister;
  }, [
    anchorPrefix,
    columnDefinitions,
    navigateToSection,
    registerSource,
    sectionContext?.itemId,
    sectionContext?.itemLabel,
    sectionContext?.projectId,
    sectionContext?.sectionId,
    sectionContext?.sectionLabel,
    tableRows
  ]);

  const openAddModal = () => {
    setFormValues({ opportunity: "", date: "", opportunity_value: "" });
    setModalMode("add");
    setActiveRowId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (opportunityId, cell) => {
    if (!cell) return;

    setFormValues({
      opportunity: opportunityId,
      date:
        normalizeDateInput(cell.originalDate) || normalizeDateInput(cell.normalizedDate) || "",
      opportunity_value: cell.value || ""
    });
    setModalMode("edit");
    setActiveRowId(cell.rowId);
    setIsModalOpen(true);
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setFormValues({ opportunity: "", date: "", opportunity_value: "" });
    setActiveRowId(null);
    setModalMode("add");
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    const opportunityId = formValues.opportunity;
    const normalizedDate = normalizeDateInput(formValues.date);

    if (!opportunityId) {
      alert("Please select an opportunity before saving.");
      return;
    }

    if (!normalizedDate) {
      alert("Please provide a valid date.");
      return;
    }

    const opportunityDetails = opportunityDetailsMap.get(opportunityId) || {};
    const identifiedDate = normalizeDateInput(opportunityDetails.date_of_identification);

    if (identifiedDate && normalizedDate < identifiedDate) {
      alert("Review date cannot be before the opportunity identification date.");
      return;
    }

    const valuesForOpportunity = valuesByOpportunity.get(opportunityId) || {};
    const existing = valuesForOpportunity[normalizedDate];

    if (modalMode === "add" && existing) {
      alert("An entry already exists for this opportunity on the selected date.");
      return;
    }

    if (modalMode === "edit" && existing && existing.rowId !== activeRowId) {
      alert("Another entry already exists for this opportunity on the selected date.");
      return;
    }

    const opportunityValue = formValues.opportunity_value;

    if (!opportunityValue || !ALLOWED_OPPORTUNITY_VALUES.includes(opportunityValue)) {
      alert("Please select a valid opportunity value.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      opportunity: opportunityId,
      date: normalizedDate,
      opportunity_value: opportunityValue
    };

    try {
      if (modalMode === "add") {
        await onAdd(payload);
      } else if (activeRowId) {
        await onEdit(activeRowId, payload);
      }
      resetModal();
    } catch (error) {
      console.error("Failed to save opportunity value history", error);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (rowId) => {
    if (!rowId) return;
    if (!window.confirm("Delete this opportunity value entry?")) {
      return;
    }

    try {
      await onDelete(rowId);
    } catch (error) {
      console.error("Failed to delete opportunity value entry", error);
    }
  };

  const selectedOpportunityDetails = opportunityDetailsMap.get(formValues.opportunity) || {};
  const identifiedDateDisplay = formatDateForDisplay(
    selectedOpportunityDetails.date_of_identification
  );
  const initialOpportunityValue =
    deriveOpportunityValue(selectedOpportunityDetails) ||
    (selectedOpportunityDetails.opportunity_value !== null &&
    selectedOpportunityDetails.opportunity_value !== undefined
      ? String(selectedOpportunityDetails.opportunity_value)
      : "");

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const renderOpportunityValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return <span className="muted-text">-</span>;
    }

    const displayValue = String(value);
    const levelClass = getOpportunityValueClassName(
      displayValue,
      "opportunity-value-history-value--"
    );
    const badgeClassName = ["opportunity-value-history-value", levelClass].filter(Boolean).join(" ");

    return <span className={badgeClassName}>{displayValue}</span>;
  };

  return (
    <div className="opportunity-value-history-grid">
      <div className="opportunity-value-history-chart insight-card">
        <MultiLineTrendChart
          labels={uniqueDates}
          series={trendSeries}
          labelFormatter={(label) => formatDateForDisplay(label) || label}
          valueFormatter={(value) => value.toString()}
          emptyMessage="Add opportunity value history to visualize the trend"
        />
      </div>
      <div
        className="table-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          gap: "1rem",
          flexWrap: "wrap"
        }}
      >
        <div className="table-search-message">
          {normalizedSearch && (
            <span>
              Showing results for <strong>"{searchTerm}"</strong>
            </span>
          )}
        </div>
        {isEditor && (
          <button
            className="btn btn-primary btn-icon"
            onClick={openAddModal}
            disabled={opportunityIds.length === 0}
            title={
              opportunityIds.length === 0
                ? "Add opportunities in the register first"
                : undefined
            }
          >
            <PlusCircle size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading opportunity value history...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {columnDefinitions.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnDefinitions.length + (uniqueDates.length > 0 && isEditor ? 1 : 0)}
                  >
                    <div className="empty-state">
                      {opportunityIds.length === 0
                        ? "Add opportunities in the register to begin tracking value history."
                        : "No opportunity value history recorded yet."}
                    </div>
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => (
                  <tr
                    key={row.opportunityId}
                    id={anchorPrefix ? `${anchorPrefix}-row-${row.opportunityId}` : undefined}
                    data-search-table={sectionContext?.itemId || undefined}
                    data-search-row={row.opportunityId}
                  >
                    <td data-label="Opportunity">{row.values.opportunity}</td>
                    <td data-label="Date of Opportunity Identified">
                      {formatDateForDisplay(row.values.date_of_opportunity_identified) ||
                        row.values.date_of_opportunity_identified ||
                        "-"}
                    </td>
                    <td data-label="Initial Opportunity Value">
                      {renderOpportunityValue(row.values.initial_opportunity_value)}
                    </td>
                    {uniqueDates.map((dateKey) => {
                      const columnKey = `opportunity_on_${dateKey}`;
                      const cell = row.cells[columnKey];
                      const label = `Opportunity on ${formatDateForDisplay(dateKey) || dateKey}`;
                      return (
                        <td key={columnKey} data-label={label}>
                          {cell ? (
                            <div className="opportunity-value-history-cell">
                              {renderOpportunityValue(cell.value)}
                              {isEditor && (
                                <div className="opportunity-value-history-actions">
                                  <button
                                    className="btn btn-outline btn-icon"
                                    onClick={() => openEditModal(row.opportunityId, cell)}
                                    aria-label={`Edit opportunity value for ${row.opportunityId} on ${label}`}
                                  >
                                    <Pencil size={16} aria-hidden="true" />
                                  </button>
                                  <button
                                    className="btn btn-danger btn-icon"
                                    onClick={() => handleDelete(cell.rowId)}
                                    aria-label={`Delete opportunity value for ${row.opportunityId} on ${label}`}
                                  >
                                    <Trash2 size={16} aria-hidden="true" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="muted-text">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={resetModal}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {modalMode === "add" ? "Add Opportunity Value" : "Edit Opportunity Value"}
              </h2>
              <button className="close-btn" onClick={resetModal} aria-label="Close">
                <XCircle size={18} aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
              }}
            >
              <div className="form-group">
                <label className="label" htmlFor="opportunity-select">
                  Opportunity
                </label>
                <select
                  id="opportunity-select"
                  className="input"
                  value={formValues.opportunity}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      opportunity: event.target.value
                    }))
                  }
                  required
                  disabled={modalMode === "edit"}
                >
                  <option value="" disabled>
                    Select opportunity ID
                  </option>
                  {opportunityIds.map((opportunityId) => (
                    <option key={opportunityId} value={opportunityId}>
                      {opportunityId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label" htmlFor="opportunity-date">
                  Date
                </label>
                <input
                  id="opportunity-date"
                  type="date"
                  className="input"
                  value={formValues.date}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      date: event.target.value
                    }))
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="label" htmlFor="opportunity-value">
                  Opportunity Value
                </label>
                <select
                  id="opportunity-value"
                  className="input"
                  value={formValues.opportunity_value}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      opportunity_value: event.target.value
                    }))
                  }
                  required
                >
                  <option value="" disabled>
                    Select opportunity value
                  </option>
                  {ALLOWED_OPPORTUNITY_VALUES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Date of Opportunity Identified</label>
                <div className="opportunity-value-history-meta">
                  {identifiedDateDisplay ||
                    selectedOpportunityDetails.date_of_identification ||
                    "Not available"}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Initial Opportunity Value</label>
                <div className="opportunity-value-history-meta">
                  {initialOpportunityValue
                    ? renderOpportunityValue(initialOpportunityValue)
                    : "Not available"}
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button
                  type="submit"
                  className="btn btn-success"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={isSubmitting}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={resetModal}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Discard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityValueHistoryTable;
