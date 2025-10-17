import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import SectionLayout from "../SectionLayout";
import DataTable from "../DataTable";
import { API } from "../../App";

const defaultWorkProducts = [
  "Statement of Work",
  "Project Plan",
  "Estimation",
  "Requirements document",
  "Design document",
  "Coding Guidelines",
  "Source Code",
  "Executables",
  "Release Notes",
  "Test Design and Report",
  "Review Form and Report",
  "User Manual",
  "Installation Manual",
  "Project Metrics Report",
  "Casual Analysis and Resolution"
];

const sanitizeSlNoInput = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).replace(/\D+/g, "");
};

const dedupeMilestoneColumns = (columns = []) => {
  const seen = new Set();

  return columns.filter((column) => {
    const identifier =
      column?.id !== undefined && column?.id !== null
        ? String(column.id)
        : (column?.column_name || "").toLowerCase();

    if (!identifier) {
      return true;
    }

    if (seen.has(identifier)) {
      return false;
    }

    seen.add(identifier);
    return true;
  });
};

const M12Deliverables = ({ projectId, isEditor, sectionId, sectionName }) => {
  const [deliverables, setDeliverables] = useState([]);
  const [milestoneColumns, setMilestoneColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [attemptedAutoSeed, setAttemptedAutoSeed] = useState(false);

  const fetchData = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const [delivsRes, colsRes] = await Promise.all([
        axios.get(`${API}/projects/${projectId}/deliverables`),
        axios.get(`${API}/projects/${projectId}/milestone-columns`)
      ]);

      setDeliverables(delivsRes.data || []);
      setMilestoneColumns(dedupeMilestoneColumns(colsRes.data || []));
    } catch (err) {
      console.error("Failed to fetch deliverables", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const initializeDefaultColumns = useCallback(async () => {
    try {
      const defaultColumns = ["Milestone A", "Milestone B", "Milestone C", "Milestone D"];
      await Promise.all(
        defaultColumns.map((column) =>
          axios.post(`${API}/projects/${projectId}/milestone-columns`, { column_name: column })
        )
      );
      await fetchData();
    } catch (err) {
      console.error("Failed to initialize milestone columns", err);
    }
  }, [fetchData, projectId]);

  useEffect(() => {
    if (loading) return;
    if (!isEditor) return;
    if (milestoneColumns.length > 0) return;
    if (attemptedAutoSeed) return;

    setAttemptedAutoSeed(true);
    initializeDefaultColumns();
  }, [attemptedAutoSeed, initializeDefaultColumns, isEditor, loading, milestoneColumns.length]);

  const milestoneColumnMetadata = useMemo(
    () =>
      milestoneColumns.map((column) => ({
        id: column.id,
        key: `milestone_${column.id}`,
        label: column.column_name,
        columnName: column.column_name
      })),
    [milestoneColumns]
  );

  const tableColumns = useMemo(
    () => [
      { key: "sl_no", label: "Sl. No.", numericOnly: true },
      { key: "work_product", label: "Work Product" },
      { key: "owner_of_deliverable", label: "Owner" },
      { key: "approving_authority", label: "Approving Authority" },
      { key: "release_to_customer", label: "Release to Customer" },
      ...milestoneColumnMetadata.map(({ key, label }) => ({ key, label }))
    ],
    [milestoneColumnMetadata]
  );

  const tableData = useMemo(
    () =>
      deliverables.map((item) => {
        const milestoneValues = {};
        milestoneColumnMetadata.forEach(({ key, columnName }) => {
          milestoneValues[key] = item.milestones?.[columnName] ?? "";
        });

        return {
          ...item,
          ...milestoneValues
        };
      }),
    [deliverables, milestoneColumnMetadata]
  );

  const buildRequestBody = useCallback(
    (payload) => {
      const normalizedSlNo = sanitizeSlNoInput(payload.sl_no);

      const basePayload = {
        sl_no: normalizedSlNo,
        work_product: payload.work_product ?? "",
        owner_of_deliverable: payload.owner_of_deliverable ?? "",
        approving_authority: payload.approving_authority ?? "",
        release_to_customer: payload.release_to_customer ?? ""
      };

      const milestones = {};
      milestoneColumnMetadata.forEach(({ key, columnName }) => {
        milestones[columnName] = payload[key] ?? "";
      });

      return {
        ...basePayload,
        milestones
      };
    },
    [milestoneColumnMetadata]
  );

  const handleAddRow = useCallback(
    async (payload) => {
      try {
        const requestBody = buildRequestBody(payload);
        await axios.post(`${API}/projects/${projectId}/deliverables`, requestBody);
        await fetchData();
      } catch (err) {
        console.error("Failed to add deliverable", err);
        alert("Failed to add deliverable");
      }
    },
    [buildRequestBody, fetchData, projectId]
  );

  const handleEditRow = useCallback(
    async (id, payload) => {
      try {
        const requestBody = buildRequestBody(payload);
        await axios.put(`${API}/projects/${projectId}/deliverables/${id}`, requestBody);
        await fetchData();
      } catch (err) {
        console.error("Failed to update deliverable", err);
        alert("Failed to update deliverable");
      }
    },
    [buildRequestBody, fetchData, projectId]
  );

  const handleDeleteDeliverable = useCallback(
    async (id) => {
      if (!window.confirm("Delete this deliverable?")) return;
      try {
        await axios.delete(`${API}/projects/${projectId}/deliverables/${id}`);
        await fetchData();
      } catch (err) {
        console.error("Failed to delete deliverable", err);
        alert("Failed to delete deliverable");
      }
    },
    [fetchData, projectId]
  );

  const handleAddColumn = useCallback(async () => {
    const trimmedName = newColumnName.trim();
    if (!trimmedName) return;

    const duplicate = milestoneColumns.some(
      (column) => column.column_name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      alert("A milestone column with that name already exists.");
      return;
    }

    try {
      await axios.post(`${API}/projects/${projectId}/milestone-columns`, {
        column_name: trimmedName
      });
      setNewColumnName("");
      await fetchData();
    } catch (err) {
      console.error("Failed to add milestone column", err);
      alert("Failed to add milestone column");
    }
  }, [fetchData, milestoneColumns, newColumnName, projectId]);

  const handleDeleteColumn = useCallback(
    async (columnId) => {
      if (!window.confirm("Delete this milestone column? Data in this column will be lost.")) return;
      try {
        await axios.delete(`${API}/projects/${projectId}/milestone-columns/${columnId}`);
        await fetchData();
      } catch (err) {
        console.error("Failed to delete milestone column", err);
        alert("Failed to delete milestone column");
      }
    },
    [fetchData, projectId]
  );

  const handleInitializeDefaults = useCallback(async () => {
    if (!window.confirm("Add all 15 default work products?")) return;

    try {
      await Promise.all(
        defaultWorkProducts.map((workProduct, index) =>
          axios.post(`${API}/projects/${projectId}/deliverables`, {
            sl_no: String(index + 1),
            work_product: workProduct,
            owner_of_deliverable: "",
            approving_authority: "",
            release_to_customer: "",
            milestones: milestoneColumns.reduce((accumulator, column) => {
              accumulator[column.column_name] = "";
              return accumulator;
            }, {})
          })
        )
      );
      await fetchData();
    } catch (err) {
      console.error("Failed to initialize default deliverables", err);
      alert("Failed to initialize default deliverables");
    }
  }, [fetchData, milestoneColumns, projectId]);

  const deliverablesItem = {
    id: "table-deliverables",
    label: "Deliverables Schedule",
    type: "Table",
    render: () =>
      loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="info-message" style={{ marginBottom: "1.5rem" }}>
            This table supports dynamic milestone tracking. Use the Columns menu to show or hide
            data and the Manage Milestones button to add or remove milestone columns.
          </div>

          {isEditor && (
            <div
              style={{
                display: "flex",
                gap: "1rem",
                marginBottom: "1.5rem",
                flexWrap: "wrap"
              }}
            >
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowColumnModal(true)}
                type="button"
              >
                Manage Milestones
              </button>
              {deliverables.length === 0 && (
                <button className="btn btn-success btn-sm" type="button" onClick={handleInitializeDefaults}>
                  Initialize 15 Default Items
                </button>
              )}
            </div>
          )}

          <DataTable
            columns={tableColumns}
            data={tableData}
            isEditor={isEditor}
            onAdd={handleAddRow}
            onEdit={handleEditRow}
            onDelete={handleDeleteDeliverable}
            addButtonText="Add in Deliverables Schedule"
            uniqueKeys={["sl_no"]}
          />
        </>
      )
  };

  return (
    <SectionLayout
      projectId={projectId}
      sectionId={sectionId}
      sectionName={sectionName}
      items={[deliverablesItem]}
      isEditor={isEditor}
    >
      {showColumnModal && (
        <div className="modal-overlay" onClick={() => setShowColumnModal(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Manage Milestone Columns</h2>
              <button className="close-btn" onClick={() => setShowColumnModal(false)} type="button">
                ×
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p className="muted-text">
                Add new milestones or delete existing ones. Removing a column permanently deletes the
                saved data in that column.
              </p>

              <div className="column-list" style={{ maxHeight: "220px", overflowY: "auto" }}>
                {milestoneColumns.length === 0 ? (
                  <div className="empty-state">No milestone columns yet.</div>
                ) : (
                  milestoneColumns.map((column) => (
                    <div
                      key={column.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.5rem 0"
                      }}
                    >
                      <span>{column.column_name}</span>
                      <button
                        className="btn btn-danger btn-sm"
                        type="button"
                        onClick={() => handleDeleteColumn(column.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="form-group">
                <label className="label" htmlFor="new-milestone-name">
                  New Milestone Name
                </label>
                <input
                  id="new-milestone-name"
                  type="text"
                  className="input"
                  value={newColumnName}
                  onChange={(event) => setNewColumnName(event.target.value)}
                  placeholder="Enter milestone name"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={handleAddColumn}
                disabled={!newColumnName.trim()}
              >
                Add Column
              </button>
              <button
                className="btn btn-outline btn-sm"
                type="button"
                onClick={() => setShowColumnModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </SectionLayout>
  );
};

export default M12Deliverables;
