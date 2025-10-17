import React from "react";
import axios from "axios";
import { API } from "../../App";
import DataTable from "../DataTable";
import SectionLayout from "../SectionLayout";
import SectionHeading from "../SectionHeading";
import { useGenericTables } from "../../hooks/useGenericTables";
import { SECTION_CONFIG } from "../../sectionConfig";
import RiskExposureHistoryTable from "../RiskExposureHistoryTable";
import RiskPhaseInsightTable from "../RiskPhaseInsightTable";
import RiskStatusInsightTable from "../RiskStatusInsightTable";

const SECTION_ID = "M9";

const M9RiskManagement = ({ projectId, isEditor, sectionId, sectionName }) => {
  const config = SECTION_CONFIG[SECTION_ID] || { tables: [] };
  const { data: tableData, loading, createRow, updateRow, deleteRow, refresh } =
    useGenericTables(projectId, SECTION_ID, config.tables || []);

  const tables = config.tables || [];
  const riskRegisterRows = tableData.risk_mitigation_and_contingency || [];

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

  const infoColors = {
    green: "#0f766e"
  };

  const infoMessages = {
    riskManagementPlan: () => (
      <p style={{ margin: 0 }}>
        {"<"}Mention the risk identification method to be used from Risk Management
        Guideline.{">"}
      </p>
    ),
    riskMitigationAndContingency: () => (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Mention the primary source of risks like “organization risk repository”
          and “initial team discussions”.{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Document how the risks will be prioritized – “for example - based on risk
          exposure”.{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Document for what kind of risks the mitigation plan shall be implemented
          and tracked. – like for risks with the risk exposure of High and Medium.{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}Specify the frequency at which the probability and impact of the risks in
          the project will be reviewed{">"}.
        </p>
      </div>
    ),
    phaseInsights: () => (
      <p style={{ margin: 0 }}>
        Visualize the distribution of identified risks across project phases.
      </p>
    ),
    riskStatusInsights: () => (
      <div style={{ color: infoColors.green }}>
        <p style={{ margin: 0 }}>
          Note: Status definitions – Under Observation: Risk is relevant & under
          observation, Mitigated: Implemented mitigation plan, Contingency Activated:
          Risk had occurred and contingency plan activated, Not Occurred: Risk not
          crossed the threshold / No more a risk, Closed: Risk no longer applicable,
          Residual Risk: Remaining risk after mitigation.
        </p>
      </div>
    ),
    riskExposureHistory: () => (
      <p style={{ margin: 0 }}>
        Track historical exposure values and insights alongside the risk register.
      </p>
    )
  };

  const getInfoText = (key) => (infoMessages[key] ? infoMessages[key]() : null);

  const findTable = (key) => tables.find((table) => table.key === key);

  const renderTableCard = (table) => {
    if (loading) {
      return <div className="loading">Loading tables...</div>;
    }

    const isExposureHistory = table.key === "risk_exposure_history";

    return (
      <div className="card" style={{ padding: "1.5rem" }}>
        {!isExposureHistory ? (
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

        {isExposureHistory ? (
          <RiskExposureHistoryTable
            riskExposures={tableData[table.key] || []}
            riskRegister={tableData.risk_mitigation_and_contingency || []}
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
      tableKey: "risk_management_plan",
      label: "Risk Management Plan",
      infoKey: "riskManagementPlan"
    }),
    buildTableItem({
      tableKey: "risk_mitigation_and_contingency",
      label: "Risk Mitigation & Contingency",
      infoKey: "riskMitigationAndContingency"
    }),
    {
      id: "insight-risk-phases",
      label: "Phase of Risk Identification",
      type: "Insight",
      heading: false,
      render: () => (
        <>
          <SectionHeading
            as="h3"
            title="Phase of Risk Identification"
            infoText={getInfoText("phaseInsights")}
          />
          <div className="card" style={{ padding: "1.5rem" }}>
            <RiskPhaseInsightTable riskRegister={riskRegisterRows} />
          </div>
        </>
      )
    },
    {
      id: "insight-risk-status",
      label: "Risk Status Insights",
      type: "Insight",
      heading: false,
      render: () => (
        <>
          <SectionHeading
            as="h3"
            title="Risk Status Insights"
            infoText={getInfoText("riskStatusInsights")}
            headingProps={{ style: { color: infoColors.green } }}
          />
          <div className="card" style={{ padding: "1.5rem" }}>
            <RiskStatusInsightTable riskRegister={riskRegisterRows} />
          </div>
        </>
      )
    },
    buildTableItem({
      tableKey: "risk_exposure_history",
      label: "Risk Exposure History",
      infoKey: "riskExposureHistory"
    })
  ].filter(Boolean);

  if (!navigationItems.length) {
    navigationItems.push({
      id: "info-empty",
      label: "Risk Guidance",
      type: "Info",
      render: () => <div className="info-message">No tables configured for this section.</div>
    });
  }

  return (
    <SectionLayout
      title="M9 - Risk Management"
      sectionId={sectionId}
      sectionLabel={sectionName}
      projectId={projectId}
      items={navigationItems}
    />
  );
};

export default M9RiskManagement;
