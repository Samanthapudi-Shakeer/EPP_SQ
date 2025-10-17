import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PlusCircle, Pencil, Trash2, XCircle } from "lucide-react";
import { useGlobalSearch } from "../context/GlobalSearchContext";
import { SectionItemContext } from "./SectionLayout";
import { buildTableSearchItems } from "../utils/searchRegistry";
import MultiLineTrendChart from "./charts/MultiLineTrendChart";

const ALLOWED_EXPOSURE_VALUES = ["1", "2", "3", "4", "6", "9"];

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

const RiskExposureHistoryTable = ({
  riskExposures = [],
  riskRegister = [],
  onAdd,
  onEdit,
  onDelete,
  isEditor,
  loading
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [formValues, setFormValues] = useState({ risk: "", date: "", exposure_value: "" });
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

  const riskDetailsMap = useMemo(() => {
    const details = new Map();
    riskRegister.forEach((row) => {
      if (row?.risk_id) {
        details.set(row.risk_id, row);
      }
    });
    return details;
  }, [riskRegister]);

  const resolveInitialExposure = useCallback((details = {}) => {
    const probability = Number(details?.probability);
    const impact = Number(details?.impact);

    if (Number.isFinite(probability) && Number.isFinite(impact)) {
      const product = probability * impact;
      return Number.isFinite(product) ? String(product) : "";
    }

    return "";
  }, []);

  const exposuresByRisk = useMemo(() => {
    const map = new Map();

    riskExposures.forEach((row) => {
      const riskId = row?.risk;
      if (!riskId) {
        return;
      }

      const normalizedDate = normalizeDateInput(row.date) || row.date || "";
      if (!map.has(riskId)) {
        map.set(riskId, {});
      }

      map.get(riskId)[normalizedDate] = {
        rowId: row.id,
        normalizedDate,
        originalDate: row.date,
        value: row.exposure_value ?? ""
      };
    });

    return map;
  }, [riskExposures]);

  const uniqueDates = useMemo(() => {
    const dates = new Set();
    riskExposures.forEach((row) => {
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
  }, [riskExposures]);

  const riskIds = useMemo(() => {
    const ids = new Set();

    riskRegister.forEach((row) => {
      if (row?.risk_id) {
        ids.add(row.risk_id);
      }
    });

    riskExposures.forEach((row) => {
      if (row?.risk) {
        ids.add(row.risk);
      }
    });

    return Array.from(ids).sort((a, b) =>
      String(a).localeCompare(String(b), undefined, { sensitivity: "base", numeric: true })
    );
  }, [riskRegister, riskExposures]);

  const columnDefinitions = useMemo(() => {
    const baseColumns = [
      { key: "risk", label: "Risk" },
      { key: "date_of_risk_identified", label: "Date of Risk Identified" },
      { key: "initial_exposure_value", label: "Initial Exposure Value" }
    ];

    const dateColumns = uniqueDates.map((dateKey) => ({
      key: `risk_on_${dateKey}`,
      label: `Risk on ${formatDateForDisplay(dateKey) || dateKey}`,
      dateKey
    }));

    return [...baseColumns, ...dateColumns];
  }, [uniqueDates]);

  const tableRows = useMemo(() => {
    return riskIds.map((riskId) => {
      const details = riskDetailsMap.get(riskId) || {};
      const exposures = exposuresByRisk.get(riskId) || {};

      const values = {
        risk: riskId,
        date_of_risk_identified: details.date_of_risk_identification || "",
        initial_exposure_value: resolveInitialExposure(details)
      };

      const cells = {};
      uniqueDates.forEach((dateKey) => {
        const columnKey = `risk_on_${dateKey}`;
        const exposure = exposures[dateKey];
        values[columnKey] = exposure?.value || "";
        cells[columnKey] = exposure || null;
      });

      return {
        riskId,
        values,
        cells
      };
    });
  }, [riskDetailsMap, exposuresByRisk, riskIds, uniqueDates, resolveInitialExposure]);

  const trendSeries = useMemo(() => {
    return riskIds
      .map((riskId) => {
        const exposures = exposuresByRisk.get(riskId) || {};
        const details = riskDetailsMap.get(riskId) || {};

        const values = uniqueDates.map((dateKey) => {
          const entry = exposures[dateKey];
          if (!entry || entry.value === null || entry.value === undefined || entry.value === "") {
            return null;
          }

          const numeric = Number(entry.value);
          return Number.isFinite(numeric) ? numeric : null;
        });

        if (!values.some((value) => value !== null)) {
          return null;
        }

        const descriptor = details.risk_description
          ? ` - ${String(details.risk_description).slice(0, 40)}`
          : "";

        return {
          id: riskId,
          label: `Risk ${riskId}${descriptor}`,
          values
        };
      })
      .filter(Boolean);
  }, [riskIds, exposuresByRisk, riskDetailsMap, uniqueDates]);

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
    const rowsForSearch = tableRows.map((row) => ({ id: row.riskId, ...row.values }));

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
    setFormValues({ risk: "", date: "", exposure_value: "" });
    setModalMode("add");
    setActiveRowId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (riskId, cell) => {
    if (!cell) return;

    setFormValues({
      risk: riskId,
      date: normalizeDateInput(cell.originalDate) || normalizeDateInput(cell.normalizedDate) || "",
      exposure_value:
        cell.value === null || cell.value === undefined || cell.value === ""
          ? ""
          : String(cell.value)
    });
    setModalMode("edit");
    setActiveRowId(cell.rowId);
    setIsModalOpen(true);
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setFormValues({ risk: "", date: "", exposure_value: "" });
    setActiveRowId(null);
    setModalMode("add");
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    const riskId = formValues.risk;
    const normalizedDate = normalizeDateInput(formValues.date);
    const exposureValue = formValues.exposure_value;

    if (!riskId) {
      alert("Please select a risk before saving.");
      return;
    }

    if (!normalizedDate) {
      alert("Please provide a valid date.");
      return;
    }

    if (!ALLOWED_EXPOSURE_VALUES.includes(exposureValue)) {
      alert("Please select a valid exposure value.");
      return;
    }

    const riskDetails = riskDetailsMap.get(riskId) || {};
    const identifiedDate = normalizeDateInput(riskDetails.date_of_risk_identification);

    if (identifiedDate && normalizedDate < identifiedDate) {
      alert("Review date cannot be before the risk identification date.");
      return;
    }

    const exposuresForRisk = exposuresByRisk.get(riskId) || {};
    const existing = exposuresForRisk[normalizedDate];

    if (modalMode === "add" && existing) {
      alert("An entry already exists for this risk on the selected date.");
      return;
    }

    if (modalMode === "edit" && existing && existing.rowId !== activeRowId) {
      alert("Another entry already exists for this risk on the selected date.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      risk: riskId,
      date: normalizedDate,
      exposure_value: exposureValue
    };

    try {
      if (modalMode === "add") {
        await onAdd(payload);
      } else if (activeRowId) {
        await onEdit(activeRowId, payload);
      }
      resetModal();
    } catch (error) {
      console.error("Failed to save exposure history", error);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (rowId) => {
    if (!rowId) return;
    if (!window.confirm("Delete this exposure history entry?")) {
      return;
    }

    try {
      await onDelete(rowId);
    } catch (error) {
      console.error("Failed to delete exposure history entry", error);
    }
  };

  const selectedRiskDetails = riskDetailsMap.get(formValues.risk) || {};
  const identifiedDateDisplay = formatDateForDisplay(selectedRiskDetails.date_of_risk_identification);
  const initialExposure = resolveInitialExposure(selectedRiskDetails);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const resolveExposureClass = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return "";
    }

    if (numericValue >= 6) {
      return "risk-exposure-history-value--high";
    }

    if (numericValue >= 3) {
      return "risk-exposure-history-value--medium";
    }

    if (numericValue >= 1) {
      return "risk-exposure-history-value--low";
    }

    return "";
  };

  const renderExposureValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return <span className="muted-text">-</span>;
    }

    const displayValue = String(value);
    const levelClass = resolveExposureClass(displayValue);

    return (
      <span className={`risk-exposure-history-value ${levelClass}`.trim()}>{displayValue}</span>
    );
  };

  return (
    <div className="risk-exposure-history-grid">
      <div className="risk-exposure-history-chart insight-card">
        <MultiLineTrendChart
          labels={uniqueDates}
          series={trendSeries}
          labelFormatter={(label) => formatDateForDisplay(label) || label}
          valueFormatter={(value) => value.toString()}
          emptyMessage="Add exposure history entries to see the risk exposure trend"
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
            disabled={riskIds.length === 0}
            title={riskIds.length === 0 ? "Add risks in the mitigation table first" : undefined}
          >
            <PlusCircle size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading risk exposure history...</div>
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
                  <td colSpan={columnDefinitions.length + (uniqueDates.length > 0 && isEditor ? 1 : 0)}>
                    <div className="empty-state">
                      {riskIds.length === 0
                        ? "Add risks in the mitigation & contingency table to begin tracking exposure history."
                        : "No risk exposure history recorded yet."}
                    </div>
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => (
                  <tr
                    key={row.riskId}
                    id={anchorPrefix ? `${anchorPrefix}-row-${row.riskId}` : undefined}
                    data-search-table={sectionContext?.itemId || undefined}
                    data-search-row={row.riskId}
                  >
                    <td data-label="Risk">{row.values.risk}</td>
                    <td data-label="Date of Risk Identified">
                      {formatDateForDisplay(row.values.date_of_risk_identified) || row.values.date_of_risk_identified || "-"}
                    </td>
                    <td data-label="Initial Exposure Value">
                      {renderExposureValue(row.values.initial_exposure_value)}
                    </td>
                    {uniqueDates.map((dateKey) => {
                      const columnKey = `risk_on_${dateKey}`;
                      const cell = row.cells[columnKey];
                      const label = `Risk on ${formatDateForDisplay(dateKey) || dateKey}`;
                      return (
                        <td key={columnKey} data-label={label}>
                          {cell ? (
                            <div className="risk-exposure-history-cell">
                              {renderExposureValue(cell.value)}
                              {isEditor && (
                                <div className="risk-exposure-history-actions">
                                  <button
                                    className="btn btn-outline btn-icon"
                                    onClick={() => openEditModal(row.riskId, cell)}
                                    aria-label={`Edit exposure for ${row.riskId} on ${label}`}
                                  >
                                    <Pencil size={16} aria-hidden="true" />
                                  </button>
                                  <button
                                    className="btn btn-danger btn-icon"
                                    onClick={() => handleDelete(cell.rowId)}
                                    aria-label={`Delete exposure for ${row.riskId} on ${label}`}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {modalMode === "add" ? "Add Exposure History" : "Edit Exposure History"}
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
                <label className="label" htmlFor="risk-select">
                  Risk
                </label>
                <select
                  id="risk-select"
                  className="input"
                  value={formValues.risk}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      risk: event.target.value
                    }))
                  }
                  required
                  disabled={modalMode === "edit"}
                >
                  <option value="" disabled>
                    Select risk ID
                  </option>
                  {riskIds.map((riskId) => (
                    <option key={riskId} value={riskId}>
                      {riskId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label" htmlFor="risk-date">
                  Date
                </label>
                <input
                  id="risk-date"
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
                <label className="label" htmlFor="exposure-value">
                  Exposure Value
                </label>
                <select
                  id="exposure-value"
                  className="input"
                  value={formValues.exposure_value}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      exposure_value: event.target.value
                    }))
                  }
                  required
                >
                  <option value="" disabled>
                    Select exposure value
                  </option>
                  {ALLOWED_EXPOSURE_VALUES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="label">Date of Risk Identified</label>
                <div className="risk-exposure-history-meta">
                  {identifiedDateDisplay || selectedRiskDetails.date_of_risk_identification || "Not available"}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Initial Exposure Value</label>
                <div className="risk-exposure-history-meta">
                  {initialExposure === null || initialExposure === undefined || initialExposure === ""
                    ? "Not available"
                    : renderExposureValue(initialExposure)}
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

export default RiskExposureHistoryTable;
