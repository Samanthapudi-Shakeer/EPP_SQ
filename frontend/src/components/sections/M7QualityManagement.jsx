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

const SECTION_ID = "M7";

const M7QualityManagement = ({
  projectId,
  isEditor,
  sectionId,
  sectionName,
  onSingleEntryDirtyChange
}) => {
  const config = SECTION_CONFIG[SECTION_ID] || { tables: [], singleEntries: [] };
  const CAUSAL_ANALYSIS_TABLE_KEYS = {
    PROACTIVE: "proactive_causal_analysis_plan",
    REACTIVE: "reactive_causal_analysis_plan"
  };
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
    purple: "#6b21a8"
  };

  const infoMessages = {
    standards: () => (
      <p style={{ margin: 0 }}>
        {"<"}Specify Technical standards, Quality Standards including coding guidelines
        followed in the project{">"}
      </p>
    ),
    verificationAndValidation: () => (
      <div style={{ color: colors.green }}>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"Keep info in Green font "}
          {"<"}As per ISO 21434 standard, Cyber Security related test are done using 1.Test
          Environment in office premises 2.Test at the actual vehicle level Mention the
          details accordingly.{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}As per ISO 26262 standard, verification statement along with evidence has to be
          provided for verification done at various level of product development testing
          phases{">"}
        </p>
      </div>
    ),
    confirmationReview: () => (
      <div style={{ color: colors.green }}>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"Keep heading and info in Green font "}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          Note1:
          <br />
          I0: The confirmation measure should be performed; however, if the confirmation
          measure is performed, it shall be performed by a different person in relation to
          the person(s) responsible for the creation of the considered work product(s)
          <br />
          I1: The confirmation measure shall be performed, by a different person in relation
          to the person(s) responsible for the creation of the considered work product(s)
          <br />
          I2: The confirmation measure shall be performed, by a person who is independent
          from the team that is responsible for the creation of the considered work
          product(s), i.e. by a person not reporting to the same direct superior
          <br />
          I3: The confirmation measure shall be performed by a person who is independent,
          regarding management, resources and release authority, from the department
          responsible for the creation of the considered work product(s)
        </p>
        <p style={{ margin: 0 }}>
          Note2: Refer GL_AU_04_Project_Safety_Management_Guideline.docx to identify the
          artifacts which are applicable for confirmation review.
        </p>
      </div>
    ),
    proactiveCausal: () => (
      <p style={{ margin: 0 }}>
        {"<"}Complete this section based on previous project experience or organization risk
        database{">"}
      </p>
    ),
    reactiveCausal: () => (
      <p style={{ margin: 0 }}>
        {"<"}List phases/activities where results of analysis requires root cause
        identification during project execution ex. In code reviews point exceeding upper
        control limit in u-chart, multiple defects from same category in testing{">"}
      </p>
    ),
    supplierEvaluationCapability: () => (
      <div style={{ color: colors.purple }}>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"Keep heading and info in Purple colour "}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}The capability of the considered supplier shall be evaluated, the evaluation
          supports supplier selection and can be based on the supplier’s capability to comply
          with ISO 21434, or on an evaluation of the previous implementation of another
          national or international cybersecurity standard{">"}
        </p>
        <p style={{ margin: 0 }}>
          If any supplier is involved in any development, testing or any activity in the
          ongoing project, Supplier selection form is separately created and needs to be
          filled for evaluation.
        </p>
      </div>
    ),
    cybersecurityAssessment: () => (
      <div style={{ color: colors.green }}>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"Keep heading and info in Green font "}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}The cybersecurity assessment shall judge whether the available evidence
          provides confidence that the achieved degree of cybersecurity of the item or
          component is sufficient. The available evidence is provided by the documented
          results of the cybersecurity activities (i.e., the work products). The cybersecurity
          assessment report shall be made available prior to the release for post-development.
          Use the Cyber Security Assessment template in QMS and make use of the guideline and
          practice in the template.{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}The Same report can be used for Post development assessment, The release for
          post-development of the item or component shall be approved if both of the
          following conditions are fulfilled: a) sufficient evidence of the achieved degree of
          cybersecurity is provided by the cybersecurity case; and if applicable the judgement
          included in the cybersecurity assessment report; and b) the cybersecurity
          requirements for the post-development phase are identified and reviewed{">"}
        </p>
      </div>
    )
  };

  const getInfoText = (key) => (infoMessages[key] ? infoMessages[key]() : null);

  const findTable = (key) => (config.tables || []).find((table) => table.key === key);
  const findSingleEntry = (field) =>
    (config.singleEntries || []).find((entry) => entry.field === field);

  const buildTableItem = ({ table, label, infoKey, headingColor }) => {
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
          <SectionHeading
            as="h3"
            title={label}
            infoText={getInfoText(infoKey)}
            headingProps={headingColor ? { style: { color: headingColor } } : undefined}
          />
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

  const buildSingleEntryItem = ({ entry, label, infoKey, headingColor }) => {
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
          <SectionHeading
            as="h3"
            title={label}
            infoText={getInfoText(infoKey)}
            headingProps={headingColor ? { style: { color: headingColor } } : undefined}
          />
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
      table: findTable("standards_qm"),
      label: "Standards",
      infoKey: "standards"
    }),
    buildTableItem({
      table: findTable("verification_and_validation_plan"),
      label: "Verification and Validation Plan",
      infoKey: "verificationAndValidation"
    }),
    buildTableItem({
      table: findTable("confirmation_review_plan"),
      label: "Confirmation Review Plan",
      infoKey: "confirmationReview",
      headingColor: colors.green
    }),
    buildTableItem({
      table: findTable(CAUSAL_ANALYSIS_TABLE_KEYS.PROACTIVE),
      label: "Pro Active Causal",
      infoKey: "proactiveCausal"
    }),
    buildTableItem({
      table: findTable(CAUSAL_ANALYSIS_TABLE_KEYS.REACTIVE),
      label: "Reactive Causal",
      infoKey: "reactiveCausal"
    }),
    buildSingleEntryItem({
      entry: findSingleEntry("supplier_evaluation_capability"),
      label: "Supplier Evaluation Capability",
      infoKey: "supplierEvaluationCapability",
      headingColor: colors.purple
    }),
    buildSingleEntryItem({
      entry: findSingleEntry("cyber_security_assessment_and_release"),
      label: "Cybersecurity Assessment and Release",
      infoKey: "cybersecurityAssessment",
      headingColor: colors.green
    })
  ].filter(Boolean);

  if (!navigationItems.length) {
    navigationItems.push({
      id: "info-empty",
      label: "Quality Guidance",
      type: "Info",
      render: () => <div className="info-message">No quality data configured for this section.</div>
    });
  }

  return (
    <SectionLayout
      title="M7 - Quality Management"
      sectionId={sectionId}
      sectionLabel={sectionName}
      projectId={projectId}
      items={navigationItems}
    />
  );
};

export default M7QualityManagement;
