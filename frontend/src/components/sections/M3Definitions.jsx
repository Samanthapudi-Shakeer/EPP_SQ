import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API } from "../../App";
import DataTable from "../DataTable";
import SectionLayout from "../SectionLayout";
import { Copy, Pencil, Plus } from "lucide-react";

const M3Definitions = ({ projectId, isEditor, sectionId, sectionName, onSingleEntryDirtyChange }) => {
  const [definitions, setDefinitions] = useState([]);
  const [singleFields, setSingleFields] = useState({
    reference_to_pif: "",
    reference_to_other_documents: "",
    plan_for_other_resources: ""
  });
  const [initialSingleFields, setInitialSingleFields] = useState({
    reference_to_pif: "",
    reference_to_other_documents: "",
    plan_for_other_resources: ""
  });
  const [dirtyFields, setDirtyFields] = useState({
    reference_to_pif: false,
    reference_to_other_documents: false,
    plan_for_other_resources: false
  });
  const [editingFields, setEditingFields] = useState({});
  const [loading, setLoading] = useState(true);
  const [copiedReference, setCopiedReference] = useState("");

  useEffect(() => {
    if (!copiedReference) return undefined;

    const timeout = setTimeout(() => {
      setCopiedReference("");
    }, 2000);

    return () => clearTimeout(timeout);
  }, [copiedReference]);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [defsResponse, field1, field2, field3] = await Promise.all([
        axios.get(`${API}/projects/${projectId}/definition-acronyms`),
        axios.get(`${API}/projects/${projectId}/single-entry/reference_to_pif`),
        axios.get(`${API}/projects/${projectId}/single-entry/reference_to_other_documents`),
        axios.get(`${API}/projects/${projectId}/single-entry/plan_for_other_resources`)
      ]);

      setDefinitions(defsResponse.data);
      const nextFields = {
        reference_to_pif: field1.data?.content || "",
        reference_to_other_documents: field2.data?.content || "",
        plan_for_other_resources: field3.data?.content || ""
      };

      setSingleFields(nextFields);
      setInitialSingleFields(nextFields);
      setDirtyFields({
        reference_to_pif: false,
        reference_to_other_documents: false,
        plan_for_other_resources: false
      });
      setEditingFields({});
    } catch (err) {
      console.error("Failed to fetch definitions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (onSingleEntryDirtyChange && sectionId) {
      const hasUnsaved = Object.values(dirtyFields).some(Boolean);
      onSingleEntryDirtyChange(sectionId, hasUnsaved);
    }
  }, [dirtyFields, onSingleEntryDirtyChange, sectionId]);

  useEffect(() => {
    return () => {
      if (onSingleEntryDirtyChange && sectionId) {
        onSingleEntryDirtyChange(sectionId, false);
      }
    };
  }, [onSingleEntryDirtyChange, sectionId]);

  const handleSingleFieldChange = (fieldName, value) => {
    setSingleFields((prev) => ({ ...prev, [fieldName]: value }));
    setDirtyFields((prev) => ({
      ...prev,
      [fieldName]: value !== (initialSingleFields[fieldName] || "")
    }));
  };

  const startEditingField = (fieldName) => {
    setEditingFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  const stopEditingField = (fieldName) => {
    setEditingFields((prev) => {
      if (!prev[fieldName]) {
        return prev;
      }
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const cancelEditingField = (fieldName) => {
    setSingleFields((prev) => ({
      ...prev,
      [fieldName]: initialSingleFields[fieldName] || ""
    }));
    setDirtyFields((prev) => ({ ...prev, [fieldName]: false }));
    stopEditingField(fieldName);
  };

  const startEditingField = (fieldName) => {
    setEditingFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  const stopEditingField = (fieldName) => {
    setEditingFields((prev) => {
      if (!prev[fieldName]) {
        return prev;
      }
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const cancelEditingField = (fieldName) => {
    setSingleFields((prev) => ({
      ...prev,
      [fieldName]: initialSingleFields[fieldName] || ""
    }));
    setDirtyFields((prev) => ({ ...prev, [fieldName]: false }));
    stopEditingField(fieldName);
  };

  const handleAddDefinition = async (newData) => {
    try {
      await axios.post(`${API}/projects/${projectId}/definition-acronyms`, newData);
      fetchData();
    } catch (err) {
      alert("Failed to add definition");
    }
  };

  const handleEditDefinition = async (id, updatedData) => {
    try {
      const { id: _, project_id, ...dataToSend } = updatedData;
      await axios.put(`${API}/projects/${projectId}/definition-acronyms/${id}`, dataToSend);
      fetchData();
    } catch (err) {
      alert("Failed to update definition");
    }
  };

  const handleDeleteDefinition = async (id) => {
    if (!window.confirm("Are you sure you want to delete this definition?")) return;
    try {
      await axios.delete(`${API}/projects/${projectId}/definition-acronyms/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete definition");
    }
  };

  const handleSaveSingleField = async (fieldName, content) => {
    try {
      await axios.post(`${API}/projects/${projectId}/single-entry`, {
        field_name: fieldName,
        content
      });
      alert("Saved successfully!");
      setInitialSingleFields((prev) => ({ ...prev, [fieldName]: content }));
      setSingleFields((prev) => ({ ...prev, [fieldName]: content }));
      setDirtyFields((prev) => ({ ...prev, [fieldName]: false }));
      stopEditingField(fieldName);
    } catch (err) {
      alert("Failed to save");
    }
  };

  const definitionColumns = [
    { key: "term", label: "Term / Acronym" },
    { key: "definition", label: "Definition" }
  ];

  const normalizeReferenceEntries = (value) => {
    if (!value) return [];

    return value
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  };

  const ensureProtocol = (value) => {
    if (!value) return "";
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
      return value;
    }

    return `https://${value}`;
  };

  const handleCopyLink = useCallback(async (value) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(trimmed);
      } else if (typeof document !== "undefined") {
        const textArea = document.createElement("textarea");
        textArea.value = trimmed;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopiedReference(trimmed);
    } catch (error) {
      console.error("Failed to copy link", error);
      setCopiedReference(trimmed);
    }
  }, []);

  const renderReferenceLinks = (value, emptyMessage) => {
    const entries = normalizeReferenceEntries(value);

    if (entries.length === 0) {
      return (
        <p className="single-entry-viewer-content is-empty">
          {emptyMessage}
        </p>
      );
    }

    return (
      <div className="reference-links">
        {entries.map((entry, index) => {
          const key = `${entry}-${index}`;
          const isCopied = copiedReference === entry;

          return (
            <div key={key} className="reference-link-row">
              <a
                href={ensureProtocol(entry)}
                target="_blank"
                rel="noopener noreferrer"
                className="reference-link"
              >
                {entry}
              </a>
              <button
                type="button"
                className="btn btn-outline btn-sm reference-copy-btn"
                onClick={() => handleCopyLink(entry)}
              >
                <Copy size={16} aria-hidden="true" />
                <span>{isCopied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const navigationItems = [
    {
      id: "table-definitions",
      label: "Definitions & Acronyms",
      type: "Table",
      render: () => (
        loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            <p className="muted-text">
              Definitions of all terms, acronyms, and abbreviations required to properly interpret this plan.
            </p>
            <DataTable
              columns={definitionColumns}
              data={definitions}
              onAdd={handleAddDefinition}
              onEdit={handleEditDefinition}
              onDelete={handleDeleteDefinition}
              isEditor={isEditor}
              addButtonText="Add in Definitions & Acronyms"
              uniqueKeys={["term"]}
            />
          </div>
        )
      )
    },
    {
      id: "single-reference-to-pif",
      label: "Reference to PIF",
      type: "Single Entry",
      render: () => (
        loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="card single-entry-card">
            <div className="single-entry-card-header">
              <div className="single-entry-card-header__text">
                <h3 className="single-entry-card-title">Reference to PIF</h3>
              </div>
              {isEditor && !editingFields.reference_to_pif && (
                <button
                  className="btn btn-outline btn-icon single-entry-card-action"
                  type="button"
                  onClick={() => startEditingField("reference_to_pif")}
                  aria-label={`${singleFields.reference_to_pif?.trim() ? "Edit" : "Add"} Reference to PIF`}
                  title={`${singleFields.reference_to_pif?.trim() ? "Edit" : "Add"} Reference to PIF`}
                >
                  {singleFields.reference_to_pif?.trim() ? (
                    <Pencil size={18} aria-hidden="true" />
                  ) : (
                    <Plus size={18} aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
            {isEditor ? (
              editingFields.reference_to_pif ? (
                <>
                  <textarea
                    className="input single-entry-textarea"
                    rows="4"
                    value={singleFields.reference_to_pif}
                    onChange={(e) => handleSingleFieldChange("reference_to_pif", e.target.value)}
                    placeholder="Enter reference to PIF..."
                    data-testid="reference-to-pif"
                  />
                  <div className="single-entry-editor-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        handleSaveSingleField("reference_to_pif", singleFields.reference_to_pif)
                      }
                      data-testid="save-reference-to-pif"
                      disabled={!dirtyFields.reference_to_pif}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => cancelEditingField("reference_to_pif")}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p
                    className={`single-entry-viewer-content${
                      singleFields.reference_to_pif?.trim() ? "" : " is-empty"
                    }`}
                  >
                    {singleFields.reference_to_pif?.trim()
                      ? singleFields.reference_to_pif
                      : "Add a reference to PIF to help the team locate the primary plan."}
                  </p>
                </>
              )
            ) : (
              <p
                className={`single-entry-viewer-content${
                  singleFields.reference_to_pif?.trim() ? "" : " is-empty"
                }`}
              >
                {singleFields.reference_to_pif?.trim()
                  ? singleFields.reference_to_pif
                  : "No reference to PIF has been provided yet."}
              </p>
            )}
          </div>
        )
      )
    },
    {
      id: "single-other-plans",
      label: "Reference to Other Plans",
      type: "Single Entry",
      render: () => (
        loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="card single-entry-card">
            <div className="single-entry-card-header">
              <div className="single-entry-card-header__text">
                <h3 className="single-entry-card-title">Reference to Other Plans</h3>
              </div>
              {isEditor && !editingFields.plan_for_other_resources && (
                <button
                  className="btn btn-outline btn-icon single-entry-card-action"
                  type="button"
                  onClick={() => startEditingField("plan_for_other_resources")}
                  aria-label={`${
                    singleFields.plan_for_other_resources?.trim() ? "Edit" : "Add"
                  } Reference to Other Plans`}
                  title={`${
                    singleFields.plan_for_other_resources?.trim() ? "Edit" : "Add"
                  } Reference to Other Plans`}
                >
                  {singleFields.plan_for_other_resources?.trim() ? (
                    <Pencil size={18} aria-hidden="true" />
                  ) : (
                    <Plus size={18} aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
            <div className="info-card">
              <ol>
                <li>Link/location to MPP or other scheduling and tracking mechanisms</li>
                <li>Link/location for test plans</li>
                <li>Reference of Development Interface Agreement document</li>
              </ol>
            </div>
            {isEditor ? (
              editingFields.plan_for_other_resources ? (
                <>
                  <textarea
                    className="input single-entry-textarea"
                    rows="4"
                    value={singleFields.plan_for_other_resources}
                    onChange={(e) =>
                      handleSingleFieldChange("plan_for_other_resources", e.target.value)
                    }
                    placeholder="Enter reference to other plans..."
                    data-testid="plan-for-other-plans"
                  />
                  <div className="single-entry-editor-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        handleSaveSingleField(
                          "plan_for_other_resources",
                          singleFields.plan_for_other_resources
                        )
                      }
                      data-testid="save-plan-for-other-plans"
                      disabled={!dirtyFields.plan_for_other_resources}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => cancelEditingField("plan_for_other_resources")}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {renderReferenceLinks(
                    singleFields.plan_for_other_resources,
                    "Add references to other plans so the team can quickly locate supporting documents."
                  )}
                </>
              )
            ) : (
              renderReferenceLinks(
                singleFields.plan_for_other_resources,
                "No reference to other plans provided yet."
              )
            )}
          </div>
        )
      )
    },
    {
      id: "single-other-documents",
      label: "Reference to Other Documents",
      type: "Single Entry",
      render: () => (
        loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="card single-entry-card">
            <div className="single-entry-card-header">
              <div className="single-entry-card-header__text">
                <h3 className="single-entry-card-title">Reference to Other Documents</h3>
              </div>
              {isEditor && !editingFields.reference_to_other_documents && (
                <button
                  className="btn btn-outline btn-icon single-entry-card-action"
                  type="button"
                  onClick={() => startEditingField("reference_to_other_documents")}
                  aria-label={`${
                    singleFields.reference_to_other_documents?.trim() ? "Edit" : "Add"
                  } Reference to Other Documents`}
                  title={`${
                    singleFields.reference_to_other_documents?.trim() ? "Edit" : "Add"
                  } Reference to Other Documents`}
                >
                  {singleFields.reference_to_other_documents?.trim() ? (
                    <Pencil size={18} aria-hidden="true" />
                  ) : (
                    <Plus size={18} aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
            <div className="info-card">
              <ul>
                <li>&lt;Link/location to additional roles and responsibilities document&gt;</li>
                <li>&lt;Link/location to process performance model workbook&gt;</li>
                <li>&lt;Link/location to control chart workbook&gt;</li>
              </ul>
            </div>
            {isEditor ? (
              editingFields.reference_to_other_documents ? (
                <>
                  <textarea
                    className="input single-entry-textarea"
                    rows="4"
                    value={singleFields.reference_to_other_documents}
                    onChange={(e) =>
                      handleSingleFieldChange("reference_to_other_documents", e.target.value)
                    }
                    placeholder="Enter reference to other documents..."
                    data-testid="reference-to-other-docs"
                  />
                  <div className="single-entry-editor-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() =>
                        handleSaveSingleField(
                          "reference_to_other_documents",
                          singleFields.reference_to_other_documents
                        )
                      }
                      data-testid="save-reference-to-other-docs"
                      disabled={!dirtyFields.reference_to_other_documents}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      type="button"
                      onClick={() => cancelEditingField("reference_to_other_documents")}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {renderReferenceLinks(
                    singleFields.reference_to_other_documents,
                    "Add references to supporting documents so collaborators can review them quickly."
                  )}
                </>
              )
            ) : (
              renderReferenceLinks(
                singleFields.reference_to_other_documents,
                "No reference to other documents provided yet."
              )
            )}
          </div>
        )
      )
    }
  ];

  return (
    <SectionLayout
      title="Definitions & References"
      sectionId={sectionId}
      sectionLabel={sectionName}
      projectId={projectId}
      items={navigationItems}
    />
  );
};

export default M3Definitions;
