import React, { useEffect, useState } from "react";
import axios from "axios";
import { CircleX, Pencil, Trash2 } from "lucide-react";
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

const normalizeSlValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim().toLowerCase();
  }

  return String(value).trim().toLowerCase();
};

const resolveRowIdentifier = (row) => {
  if (!row) return null;
  if (row.id !== undefined && row.id !== null) return String(row.id);
  if (row._id !== undefined && row._id !== null) return String(row._id);
  return null;
};

const hasDuplicateSlNumber = (rows, slValue, ignoreId = null) => {
  const normalized = normalizeSlValue(slValue);
  const ignore = ignoreId !== null && ignoreId !== undefined ? String(ignoreId) : null;

  return rows.some((row) => {
    const rowId = resolveRowIdentifier(row);
    if (ignore && rowId === ignore) {
      return false;
    }

    return normalizeSlValue(row.sl_no) === normalized;
  });
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

const SamDeliverables = ({ projectId, isEditor }) => {
  const [deliverables, setDeliverables] = useState([]);
  const [milestoneColumns, setMilestoneColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [newDeliverable, setNewDeliverable] = useState({
    sl_no: "",
    work_product: "",
    owner_of_deliverable: "",
    approving_authority: "",
    release_to_tsbj: "",
    milestones: {}
  });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [deliverablesRes, columnsRes] = await Promise.all([
        axios.get(`${API}/projects/${projectId}/sam-deliverables`),
        axios.get(`${API}/projects/${projectId}/sam-milestone-columns`)
      ]);

      setDeliverables(deliverablesRes.data);
      setMilestoneColumns(dedupeMilestoneColumns(columnsRes.data));

      if (columnsRes.data.length === 0 && isEditor) {
        await initializeDefaultColumns();
      }
    } catch (err) {
      console.error("Failed to fetch SAM deliverables", err);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultColumns = async () => {
    try {
      const defaults = ["Milestone A", "Milestone B", "Milestone C", "Milestone D"];
      for (const col of defaults) {
        await axios.post(`${API}/projects/${projectId}/sam-milestone-columns`, {
          column_name: col
        });
      }
      await fetchData();
    } catch (err) {
      console.error("Failed to initialise SAM milestone columns", err);
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnName.trim()) return;
    try {
      await axios.post(`${API}/projects/${projectId}/sam-milestone-columns`, {
        column_name: newColumnName
      });
      setNewColumnName("");
      setShowColumnModal(false);
      fetchData();
    } catch (err) {
      alert("Failed to add milestone column");
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (!window.confirm("Delete this milestone column?")) return;
    try {
      await axios.delete(`${API}/projects/${projectId}/sam-milestone-columns/${columnId}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete milestone column");
    }
  };

  const handleAddDeliverable = async () => {
    if (hasDuplicateSlNumber(deliverables, newDeliverable.sl_no)) {
      alert("Sl. No must be unique. Please provide a different value before saving.");
      return;
    }

    try {
      await axios.post(`${API}/projects/${projectId}/sam-deliverables`, newDeliverable);
      setNewDeliverable({
        sl_no: "",
        work_product: "",
        owner_of_deliverable: "",
        approving_authority: "",
        release_to_tsbj: "",
        milestones: {}
      });
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      alert("Failed to add deliverable");
    }
  };

  const handleEditDeliverable = async (id) => {
    if (hasDuplicateSlNumber(deliverables, editData.sl_no, id)) {
      alert("Sl. No must be unique. Please provide a different value before saving.");
      return;
    }

    try {
      const { id: _, project_id, ...payload } = editData;
      await axios.put(`${API}/projects/${projectId}/sam-deliverables/${id}`, payload);
      setEditingId(null);
      setEditData({});
      fetchData();
    } catch (err) {
      alert("Failed to update deliverable");
    }
  };

  const handleDeleteDeliverable = async (id) => {
    if (!window.confirm("Delete this deliverable?")) return;
    try {
      await axios.delete(`${API}/projects/${projectId}/sam-deliverables/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete deliverable");
    }
  };

  const handleInitialiseDefaults = async () => {
    if (!window.confirm("Add the 15 default supplier deliverables?")) return;
    try {
      for (let i = 0; i < defaultWorkProducts.length; i++) {
        await axios.post(`${API}/projects/${projectId}/sam-deliverables`, {
          sl_no: String(i + 1),
          work_product: defaultWorkProducts[i],
          owner_of_deliverable: "",
          approving_authority: "",
          release_to_tsbj: "",
          milestones: {}
        });
      }
      fetchData();
    } catch (err) {
      alert("Failed to initialise default deliverables");
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3 style={{ fontSize: "1.3rem", fontWeight: "600", marginBottom: "1.5rem" }}>
        Supplier Deliverables & Milestones
      </h3>

      <div className="info-message" style={{ marginBottom: "1.5rem" }}>
        Track supplier deliverables with dynamic milestone checkpoints and release ownership.
      </div>

      {isEditor && (
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
            + Add Deliverable
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowColumnModal(true)}>
            Manage Columns
          </button>
          {deliverables.length === 0 && (
            <button className="btn btn-success btn-sm" onClick={handleInitialiseDefaults}>
              Initialize 15 Default Items
            </button>
          )}
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Sl. No.</th>
              <th>Work Product</th>
              <th>Owner</th>
              <th>Approving Authority</th>
              <th>Release to TSBJ</th>
              {milestoneColumns.map((col) => (
                <th key={col.id}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                    {col.column_name}
                    {isEditor && (
                      <button
                        type="button"
                        className="btn btn-outline btn-icon"
                        onClick={() => handleDeleteColumn(col.id)}
                        aria-label={`Remove milestone ${col.column_name}`}
                        style={{ padding: "0.25rem", height: "1.75rem", width: "1.75rem" }}
                      >
                        <CircleX size={16} aria-hidden="true" />
                      </button>
                    )}
                  </span>
                </th>
              ))}
              {isEditor && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {deliverables.length === 0 ? (
              <tr>
                <td
                  colSpan={5 + milestoneColumns.length + (isEditor ? 1 : 0)}
                  style={{ textAlign: "center", padding: "2rem", color: "#718096" }}
                >
                  No supplier deliverables yet.
                </td>
              </tr>
            ) : (
              deliverables.map((deliverable) => (
                <tr key={deliverable.id}>
                  <td>
                    {editingId === deliverable.id ? (
                      <input
                        type="text"
                        className="input"
                        style={{ padding: "0.5rem", fontSize: "0.875rem" }}
                        value={editData.sl_no || ""}
                        onChange={(e) => setEditData((prev) => ({ ...prev, sl_no: e.target.value }))}
                      />
                    ) : (
                      deliverable.sl_no || "-"
                    )}
                  </td>
                  <td>
                    {editingId === deliverable.id ? (
                      <input
                        type="text"
                        className="input"
                        style={{ padding: "0.5rem", fontSize: "0.875rem" }}
                        value={editData.work_product || ""}
                        onChange={(e) =>
                          setEditData((prev) => ({ ...prev, work_product: e.target.value }))
                        }
                      />
                    ) : (
                      deliverable.work_product || "-"
                    )}
                  </td>
                  <td>
                    {editingId === deliverable.id ? (
                      <input
                        type="text"
                        className="input"
                        style={{ padding: "0.5rem", fontSize: "0.875rem" }}
                        value={editData.owner_of_deliverable || ""}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            owner_of_deliverable: e.target.value
                          }))
                        }
                      />
                    ) : (
                      deliverable.owner_of_deliverable || "-"
                    )}
                  </td>
                  <td>
                    {editingId === deliverable.id ? (
                      <input
                        type="text"
                        className="input"
                        style={{ padding: "0.5rem", fontSize: "0.875rem" }}
                        value={editData.approving_authority || ""}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev,
                            approving_authority: e.target.value
                          }))
                        }
                      />
                    ) : (
                      deliverable.approving_authority || "-"
                    )}
                  </td>
                  <td>
                    {editingId === deliverable.id ? (
                      <input
                        type="text"
                        className="input"
                        style={{ padding: "0.5rem", fontSize: "0.875rem" }}
                        value={editData.release_to_tsbj || ""}
                        onChange={(e) =>
                          setEditData((prev) => ({ ...prev, release_to_tsbj: e.target.value }))
                        }
                      />
                    ) : (
                      deliverable.release_to_tsbj || "-"
                    )}
                  </td>
                  {milestoneColumns.map((col) => (
                    <td key={col.id}>
                      {editingId === deliverable.id ? (
                        <input
                          type="text"
                          className="input"
                          style={{ padding: "0.5rem", fontSize: "0.875rem" }}
                          value={editData.milestones?.[col.column_name] || ""}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              milestones: {
                                ...(prev.milestones || {}),
                                [col.column_name]: e.target.value
                              }
                            }))
                          }
                        />
                      ) : (
                        deliverable.milestones?.[col.column_name] || "-"
                      )}
                    </td>
                  ))}
                  {isEditor && (
                    <td>
                      {editingId === deliverable.id ? (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleEditDeliverable(deliverable.id)}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setEditingId(null);
                              setEditData({});
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className="btn btn-outline btn-icon"
                            onClick={() => {
                              setEditingId(deliverable.id);
                              setEditData(deliverable);
                            }}
                            aria-label={`Edit deliverable ${deliverable.work_product || deliverable.sl_no}`}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            onClick={() => handleDeleteDeliverable(deliverable.id)}
                            aria-label={`Delete deliverable ${deliverable.work_product || deliverable.sl_no}`}
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Supplier Deliverable</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                ×
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleAddDeliverable();
              }}
            >
              <div className="form-group">
                <label className="label">Sl. No.</label>
                <input
                  type="text"
                  className="input"
                  value={newDeliverable.sl_no}
                  onChange={(e) => setNewDeliverable((prev) => ({ ...prev, sl_no: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="label">Work Product</label>
                <input
                  type="text"
                  className="input"
                  value={newDeliverable.work_product}
                  onChange={(e) =>
                    setNewDeliverable((prev) => ({ ...prev, work_product: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="label">Owner of Deliverable</label>
                <input
                  type="text"
                  className="input"
                  value={newDeliverable.owner_of_deliverable}
                  onChange={(e) =>
                    setNewDeliverable((prev) => ({
                      ...prev,
                      owner_of_deliverable: e.target.value
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="label">Approving Authority</label>
                <input
                  type="text"
                  className="input"
                  value={newDeliverable.approving_authority}
                  onChange={(e) =>
                    setNewDeliverable((prev) => ({
                      ...prev,
                      approving_authority: e.target.value
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="label">Release to TSBJ</label>
                <input
                  type="text"
                  className="input"
                  value={newDeliverable.release_to_tsbj}
                  onChange={(e) =>
                    setNewDeliverable((prev) => ({ ...prev, release_to_tsbj: e.target.value }))
                  }
                />
              </div>
              {milestoneColumns.map((col) => (
                <div className="form-group" key={col.id}>
                  <label className="label">{col.column_name}</label>
                  <input
                    type="text"
                    className="input"
                    value={newDeliverable.milestones[col.column_name] || ""}
                    onChange={(e) =>
                      setNewDeliverable((prev) => ({
                        ...prev,
                        milestones: {
                          ...prev.milestones,
                          [col.column_name]: e.target.value
                        }
                      }))
                    }
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Add
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showColumnModal && (
        <div className="modal-overlay" onClick={() => setShowColumnModal(false)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Manage Milestone Columns</h2>
              <button className="close-btn" onClick={() => setShowColumnModal(false)}>
                ×
              </button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleAddColumn();
              }}
            >
              <div className="form-group">
                <label className="label">Column Name</label>
                <input
                  type="text"
                  className="input"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="e.g. Milestone E"
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Add Column
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowColumnModal(false)}
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SamDeliverables;
