import React from "react";
import axios from "axios";
import { API } from "../../App";
import DataTable from "../DataTable";
import SectionLayout from "../SectionLayout";
import SectionHeading from "../SectionHeading";
import { useGenericTables } from "../../hooks/useGenericTables";
import { SECTION_CONFIG } from "../../sectionConfig";
import OpportunityValueHistoryTable from "../OpportunityValueHistoryTable";
import OpportunityPhaseInsightTable from "../OpportunityPhaseInsightTable";
import OpportunityStatusInsightTable from "../OpportunityStatusInsightTable";

const SECTION_ID = "M10";

const M10OpportunityManagement = ({ projectId, isEditor, sectionId, sectionName }) => {
  const config = SECTION_CONFIG[SECTION_ID] || { tables: [] };
  const { data: tableData, loading, createRow, updateRow, deleteRow, refresh } =
    useGenericTables(projectId, SECTION_ID, config.tables || []);

  const tables = config.tables || [];
  const opportunityRegisterRows = tableData.opportunity_register || [];

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

  const infoMessages = {
    opportunityManagementPlan: () => (
      <p style={{ margin: 0 }}>
        {"<"}Mention the opportunity identification method to be used from
        opportunity Management Guideline.{">"}
      </p>
    ),
    opportunityRegister: () => (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Mention the primary source of opportunities like “organization
          opportunity repository” and “initial team discussions”.{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Document how the opportunities will be prioritized – “for example -
          based on opportunity Value”.{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Document for what kind of opportunities the leverage plan shall be
          implemented and tracked. – like for opportunities with the opportunity
          Value of High and Medium.{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}Specify the frequency at which the cost and benefit of the
          opportunities in the project will be reviewed.{">"}
        </p>
      </div>
    ),
    opportunityPhases: () => (
      <p style={{ margin: 0 }}>
        Review the opportunity distribution across phases with supporting
        insights.
      </p>
    ),
    opportunityStatus: () => (
      <div>
        <p style={{ margin: 0 }}>
          Note: *Status
          <br />
          Under Observation : Opportunity is relevant and under observation
          <br />
          In progress : Opportunity implementation is in progress
          <br />
          Not Occurred : Opportunity had not occurred
          <br />
          Opportunity Leveraged : Opportunity action plan implemented
          <br />
          Closed : Opportunity no longer applicable
        </p>
      </div>
    ),
    opportunityValueHistory: () => (
      <p style={{ margin: 0 }}>
        Track historical opportunity values alongside register entries and
        insights.
      </p>
    )
  };

  const getInfoText = (key) => (infoMessages[key] ? infoMessages[key]() : null);

  const findTable = (key) => tables.find((table) => table.key === key);

  const renderTableCard = (table) => {
    if (loading) {
      return <div className="loading">Loading tables...</div>;
    }

    const isValueHistory = table.key === "opportunity_value_history";

    return (
      <div className="card" style={{ padding: "1.5rem" }}>
        {!isValueHistory ? (
          <div
            className="section-tab-panel-header"
            style={{
              marginBottom: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap"
            }}
          >
            <h3 className="section-tab-panel-title">
              {table.title || table.name || table.key}
            </h3>
            {isEditor &&
              (tableData[table.key] || []).length === 0 &&
              table.prefillRows && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handlePrefillRows(table)}
                >
                  Populate Defaults
                </button>
              )}
          </div>
        ) : null}

        {isValueHistory ? (
          <OpportunityValueHistoryTable
            opportunityValues={tableData[table.key] || []}
            opportunityRegister={tableData.opportunity_register || []}
            onAdd={(newRow) => handleAddRow(table.key, newRow)}
            onEdit={(rowId, updated) => handleEditRow(table.key, rowId, updated)}
            onDelete={(rowId) => handleDeleteRow(table.key, rowId)}
            isEditor={isEditor}
            loading={loading}
          />
        ) : (
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
        )}
      </div>
    );
  };

  const buildTableItem = ({ tableKey, label, infoKey }) => {
    const table = findTable(tableKey);
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
          {renderTableCard(table)}
        </>
      )
    };
  };

  const navigationItems = [
    buildTableItem({
      tableKey: "opportunity_management_plan",
      label: "Opportunity Management Plan",
      infoKey: "opportunityManagementPlan"
    }),
    buildTableItem({
      tableKey: "opportunity_register",
      label: "Opportunity Register",
      infoKey: "opportunityRegister"
    }),
    {
      id: "insight-opportunity-phases",
      label: "Phases of Opportunity",
      type: "Insight",
      heading: false,
      render: () => (
        <>
          <SectionHeading
            as="h3"
            title="Phases of Opportunity"
            infoText={getInfoText("opportunityPhases")}
          />
          <div className="card" style={{ padding: "1.5rem" }}>
            <OpportunityPhaseInsightTable opportunityRegister={opportunityRegisterRows} />
          </div>
        </>
      )
    },
    {
      id: "insight-opportunity-status",
      label: "Opportunity Status",
      type: "Insight",
      heading: false,
      render: () => (
        <>
          <SectionHeading
            as="h3"
            title="Opportunity Status"
            infoText={getInfoText("opportunityStatus")}
          />
          <div className="card" style={{ padding: "1.5rem" }}>
            <OpportunityStatusInsightTable opportunityRegister={opportunityRegisterRows} />
          </div>
        </>
      )
    },
    buildTableItem({
      tableKey: "opportunity_value_history",
      label: "Opportunity Value History",
      infoKey: "opportunityValueHistory"
    })
  ].filter(Boolean);

  if (!navigationItems.length) {
    navigationItems.push({
      id: "info-empty",
      label: "Opportunity Guidance",
      type: "Info",
      render: () => <div className="info-message">No tables configured for this section.</div>
    });
  }

  return (
    <SectionLayout
      title="M10 - Opportunity Management"
      sectionId={sectionId}
      sectionLabel={sectionName}
      projectId={projectId}
      items={navigationItems}
    />
  );
};

export default M10OpportunityManagement;

