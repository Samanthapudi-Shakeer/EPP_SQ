import React, { useEffect } from "react";
import axios from "axios";
import { API } from "../../App";
import DataTable from "../DataTable";
import SingleEntryEditor from "../SingleEntryEditor";
import SectionHeading from "../SectionHeading";
import SectionLayout from "../SectionLayout";
import { useGenericTables } from "../../hooks/useGenericTables";
import { useSingleEntries } from "../../hooks/useSingleEntries";
import { SECTION_CONFIG } from "../../sectionConfig";

const SECTION_ID = "M6";

const M6MonitoringControl = ({
  projectId,
  isEditor,
  sectionId,
  sectionName,
  onSingleEntryDirtyChange
}) => {
  const config = SECTION_CONFIG[SECTION_ID] || { tables: [], singleEntries: [] };
  const {
    data: tableData,
    loading: tablesLoading,
    createRow,
    updateRow,
    deleteRow,
    refresh
  } = useGenericTables(projectId, SECTION_ID, config.tables || []);
  const {
    values: singleEntryValues,
    loading: singleEntryLoading,
    updateContent,
    updateImage,
    saveEntry,
    dirtyFields: singleEntryDirty,
    hasUnsavedChanges: singleEntryHasUnsaved
  } = useSingleEntries(projectId, config.singleEntries || []);

  useEffect(() => {
    if (onSingleEntryDirtyChange && sectionId) {
      onSingleEntryDirtyChange(sectionId, singleEntryHasUnsaved);
    }
  }, [onSingleEntryDirtyChange, sectionId, singleEntryHasUnsaved]);

  useEffect(() => {
    return () => {
      if (onSingleEntryDirtyChange && sectionId) {
        onSingleEntryDirtyChange(sectionId, false);
      }
    };
  }, [onSingleEntryDirtyChange, sectionId]);

  const handleAddRow = async (tableKey, payload) => {
    try {
      await createRow(tableKey, payload);
    } catch (error) {
      console.error("Failed to add row", error);
      alert("Failed to add row");
    }
  };

  const handleEditRow = async (tableKey, rowId, payload) => {
    const { id: _id, ...data } = payload;
    try {
      await updateRow(tableKey, rowId, data);
    } catch (error) {
      console.error("Failed to update row", error);
      alert("Failed to update row");
    }
  };

  const handleDeleteRow = async (tableKey, rowId) => {
    if (!window.confirm("Delete this row?")) return;
    try {
      await deleteRow(tableKey, rowId);
    } catch (error) {
      console.error("Failed to delete row", error);
      alert("Failed to delete row");
    }
  };

  const handlePrefillRows = async (table) => {
    if (!table.prefillRows || !table.prefillRows.length) return;
    const apiName = table.apiName || table.key;
    try {
      for (const row of table.prefillRows) {
        await axios.post(
          `${API}/projects/${projectId}/sections/${SECTION_ID}/tables/${apiName}`,
          { data: row }
        );
      }
      await refresh();
    } catch (error) {
      console.error("Failed to populate defaults", error);
      alert("Failed to populate defaults");
    }
  };

  const handleSingleEntrySave = async (field) => {
    try {
      await saveEntry(field);
      alert("Saved successfully!");
    } catch (error) {
      console.error("Failed to save entry", error);
      alert("Failed to save");
    }
  };

  const colors = {
    green: "#0f766e",
    yellow: "#ca8a04"
  };

  const infoMessages = {
    projectMonitoringAndControl: () => (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          Keep info {"<"}Mention details by considering required tailoring. Follow DR guidelines
          for System related projects.{">"}
        </p>
        <p style={{ margin: 0, color: colors.green }}>
          "In green font" * Any incident in the project needs to be managed as per TSIP QMS
          Guideline and the report needs to be created as per TSIP QMS incident report template.
        </p>
      </div>
    ),
    quantitativeObjectives: () => (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          Keep info {"<"}Mention the project goals for each of the identified objectives and
          metrics. Also, specify the source from where the metrics data is derived, e.g. SV and EV
          can be derived from MPP/Effort tracking sheet{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Additional project specific objectives and metrics can also be identified{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}For Organisation norms, refer latest process performance baseline document{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}For sub-process level planning and tracking use control chart workbook{">"}
        </p>
        <p style={{ margin: 0, color: colors.yellow }}>
          "Keep this in Yellow font" {"<"}The Goals related to System related Projects shall be
          identified{">"}
        </p>
      </div>
    ),
    transitionPlan: () => (
      <div>
        <p style={{ margin: 0 }}>
          Keep info {"<"}List all the steps to be followed for transition of project to support
          and operations. Identify the roles and responsibilities, risks transition requirements,
          schedule and training needs required for the transition process to complete. Define the
          trigger/exit criteria for moving to transition phase{">"}
        </p>
      </div>
    )
  };

  const getInfoText = (key) => (infoMessages[key] ? infoMessages[key]() : null);

  const findTable = (key) => (config.tables || []).find((table) => table.key === key);
  const findSingleEntry = (field) => (config.singleEntries || []).find((entry) => entry.field === field);

  const buildTableItem = ({ table, label, infoKey }) => {
    if (!table) {
      return null;
    }

    return {
      id: `table-${table.key}`,
      label,
      type: "Table",
      heading: false,
      render: () => (
        <>
          <SectionHeading as="h3" title={label} infoText={getInfoText(infoKey)} />
          {tablesLoading ? (
            <div className="loading">Loading tables...</div>
          ) : (
            <div className="card" style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                  gap: "1rem",
                  flexWrap: "wrap"
                }}
              >
                <h3 style={{ fontSize: "1.2rem", fontWeight: "600" }}>
                  {table.title || table.name || table.key}
                </h3>
                {isEditor && (tableData[table.key] || []).length === 0 && table.prefillRows && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handlePrefillRows(table)}
                  >
                    Populate Defaults
                  </button>
                )}
              </div>

              <DataTable
                columns={table.columns}
                data={tableData[table.key] || []}
                onAdd={(newRow) => handleAddRow(table.key, newRow)}
                onEdit={(rowId, updated) => handleEditRow(table.key, rowId, updated)}
                onDelete={(rowId) => handleDeleteRow(table.key, rowId)}
                isEditor={isEditor}
                addButtonText={
                  table.addButtonText || `Add in ${table.title || table.name || table.key}`
                }
                uniqueKeys={table.uniqueFields || []}
                preventDuplicateRows={Boolean(table.preventDuplicateRows)}
              />
            </div>
          )}
        </>
      )
    };
  };

  const buildSingleEntryItem = ({ entry, label, infoKey }) => {
    if (!entry) {
      return null;
    }

    return {
      id: `single-${entry.field}`,
      label,
      type: "Single Entry",
      heading: false,
      render: () => (
        <>
          <SectionHeading as="h3" title={label} infoText={getInfoText(infoKey)} />
          <SingleEntryEditor
            key={entry.field}
            definitions={[entry]}
            values={singleEntryValues}
            loading={singleEntryLoading}
            isEditor={isEditor}
            onContentChange={updateContent}
            onImageChange={updateImage}
            onSave={handleSingleEntrySave}
            dirtyFields={{ [entry.field]: singleEntryDirty[entry.field] }}
          />
        </>
      )
    };
  };

  const navigationItems = [
    buildTableItem({
      table: findTable("project_monitoring_and_control"),
      label: "Project Monitoring and Control",
      infoKey: "projectMonitoringAndControl"
    }),
    buildTableItem({
      table: findTable("quantitative_objectives_measurement_and_data_management_plan"),
      label: "Quantitative Objectives",
      infoKey: "quantitativeObjectives"
    }),
    buildSingleEntryItem({
      entry: findSingleEntry("transition_plan"),
      label: "Transition Plan",
      infoKey: "transitionPlan"
    })
  ].filter(Boolean);

  if (!navigationItems.length) {
    navigationItems.push({
      id: "info-empty",
      label: "Monitoring Guidance",
      type: "Info",
      render: () => <div className="info-message">No monitoring data configured for this section.</div>
    });
  }

  return (
    <SectionLayout
      title="M6 - Monitoring & Control"
      sectionId={sectionId}
      sectionLabel={sectionName}
      projectId={projectId}
      items={navigationItems}
    />
  );
};

export default M6MonitoringControl;
