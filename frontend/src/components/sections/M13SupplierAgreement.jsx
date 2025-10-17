import React, { useEffect, useMemo } from "react";
import axios from "axios";
import { API } from "../../App";
import DataTable from "../DataTable";
import SectionLayout from "../SectionLayout";
import SingleEntryEditor from "../SingleEntryEditor";
import SamDeliverables from "./SamDeliverables";
import SectionHeading from "../SectionHeading";
import { useGenericTables } from "../../hooks/useGenericTables";
import { useSingleEntries } from "../../hooks/useSingleEntries";
import { SECTION_CONFIG } from "../../sectionConfig";

const SECTION_ID = "M13";

const M13SupplierAgreement = ({
  projectId,
  isEditor,
  sectionId,
  sectionName,
  onSingleEntryDirtyChange
}) => {
  const config = SECTION_CONFIG[SECTION_ID] || { tables: [], singleEntries: [] };
  const singleEntryDefinitions = config.singleEntries || [];
  const singleEntryDefinitionsMap = useMemo(() => {
    return singleEntryDefinitions.reduce((acc, entry) => {
      acc[entry.field] = entry;
      return acc;
    }, {});
  }, [singleEntryDefinitions]);
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

  const infoMessages = {
    supplierProjectIntroduction: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Give a brief introduction of software system or product or product
          component that is being developed or enhanced by supplier. Also provide
          high level project schedule including milestones details, Life Cycle
          Model{"">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}Briefly and clearly mention the scope of supplier project in terms
          of various components, products/systems or parts of this which are
          intended to be developed by the supplier. Also mention if only
          development is involved or if it includes defect fixes/ enhancements
          from previous version of product…etc.{">"}
        </p>
      </div>
    ),
    supplierProjectPlan: (
      <p style={{ margin: 0 }}>
        {"<"}Provide link to supplier project plan(PP), ensure that supplier PP
        covers all sections of TSIP PP template{">"}
      </p>
    ),
    assumptionsGroup: (
      <p style={{ margin: 0 }}>
        {"<"}List down assumptions, dependencies, constraints and risks related to
        supplier and supplier project{">"}
      </p>
    ),
    statusReporting: (
      <p style={{ margin: 0 }}>
        {"<"}Ensure all supplier activities are being tracked as per supplier
        agreement in addition regular monitoring{">"}
      </p>
    ),
    quantitativeObjectives: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Identify quantitative measures for critical supplier processes{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}For Organization norms, refer latest process performance baseline
          document{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}For sub-process level planning and tracking use control chart
          workbook{">"}
        </p>
      </div>
    ),
    verificationValidation: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Identify all supplier work products that need to analysed by
          acquirer along with the analysis method{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}Ensure all critical interfaces and connections are identified and
          analysed thoroughly{">"}
        </p>
      </div>
    ),
    tailoring: (
      <p style={{ margin: 0 }}>
        {"<"}List all supplier processes which are tailored from QMS to suit
        project specific needs Ex. Use of project specific checklist instead of
        QMS specified or combining of DR’s, not conducting unit testing for reused
        components etc. This should have been addressed in the Tailoring
        guidelines.{">"}
      </p>
    ),
    deviations: (
      <p style={{ margin: 0 }}>
        {"<"}List all supplier processes which are deviated from QMS to suit
        project specific needs Ex. Omitting the Use of a checklist mandated by the
        QMS or not conducting a process step mandated by the QMS etc. for which no
        corresponding tailoring exits in tailoring guidelines.{">"}
      </p>
    ),
    productReleasePlan: (
      <p style={{ margin: 0 }}>
        {"<"}List all intermediate and formal supplier releases along with date{">"}
      </p>
    ),
    supplierCmPlan: (
      <p style={{ margin: 0 }}>
        {"<"}Ensure supplier crates a detailed CM plan covering all required
        sections as per TSIP template{">"}
      </p>
    ),
    locationOfCis: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Include the path and directory structure of the CM Repository where
          supplier deliverables will be stored. The directory structure can be
          represented pictorially{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}Location and Names of Mail folders where the project related mails
          such as status reports, technical queries etch will be stored should also
          be identified here.{">"}
        </p>
      </div>
    ),
    versioning: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Please specify the version rule that is to be followed for the
          draft, approved or baselined or released supplier doc, code etc.{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}Please refer to guideline for the same{">"}
        </p>
      </div>
    ),
    baselining: (
      <p style={{ margin: 0 }}>
        {"<"}Mention the stage at which the source code and the documents are
        baselined. Documents should be baselined as soon as the first version is
        released.{">"}
      </p>
    ),
    labellingBaselines: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Identify the scheme for labelling baselines based on the following –
          1) Release name like Integration, Final etc. 2) CR No. 3) Tested stage
          like unit tested etc. 4) Branches, if any{"">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}Please refer guideline{">"}
        </p>
      </div>
    ),
    changeManagementPlan: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Explain Supplier Change management initiation process{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Briefly explain the change control process that is to be followed
          for proposing change approving, rejecting and authority for approval of
          different kind of changes, based on project needs{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}For more insight pl. refer to practice{">"}
        </p>
      </div>
    ),
    configurationControl: (
      <p style={{ margin: 0 }}>
        {"<"}Explain the control over the supplier configuration items, that is,
        check-in and check-out permissions{">"}
      </p>
    ),
    configurationManagementAudit: (
      <p style={{ margin: 0 }}>
        {"<"}Explain who will be responsible for performing supplier configuration
        management audit and at what frequency{">"}
      </p>
    ),
    backup: (
      <p style={{ margin: 0 }}>
        {"<"}Ensure supplier data is backup and restoration is done regularly.
        Please refer to the back up procedure available with the TSIP IT support
        group.{">"}
      </p>
    ),
    releaseMechanism: (
      <p style={{ margin: 0 }}>
        {"<"}Explain the directory used for release, procedure for build,
        verification mechanism, etc. Every release should be built from the CM tool
        and should be assigned a tag or a label. Refer to release process .{">"}
      </p>
    ),
    informationRetentionPlan: (
      <p style={{ margin: 0 }}>
        {"<"}Explain the period for which the work products of the project will be
        retained as per SOW and agreement with supplier Explain the process of
        scrapping/deleting the information. Please refer to Information Retention
        and Disposal Procedure in ISMS for more details{">"}
      </p>
    ),
    deliverablesList: (
      <p style={{ margin: 0 }}>
        {"<"}List down all deliverables that are to be received from supplier or
        need to be provided to supplier, ensure all deliverables from supplier
        agreement are covered{">"}
      </p>
    ),
    supplierAcceptanceCriteria: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Define criteria for accepting supplier deliverables{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Ensure all criteria from supplier agreement are covered{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}Acceptance criteria can be defined Phase/milestone wise{">"}
        </p>
      </div>
    ),
    transitionPlan: (
      <p style={{ margin: 0 }}>
        {"<"}List all the steps to be followed for transition of project from
        supplier to acquirer. Identify the roles and responsibilities, risks
        transition requirements, schedule and training needs required for the
        transition process to complete. Define the trigger/exit criteria for moving
        to transition phase{">"}
      </p>
    )
  };

  const getInfoText = (key) => infoMessages[key] || null;

  const tables = config.tables || [];
  const findTable = (key) => tables.find((table) => table.key === key);

  const renderTableCard = (table) => {
    if (!table) return null;

    if (tablesLoading) {
      return <div className="loading">Loading tables...</div>;
    }

    return (
      <div className="card" style={{ padding: "1.5rem" }}>
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
    );
  };

  const renderTableItem = ({ tableKey, label, infoKey, id }) => {
    const table = findTable(tableKey);
    if (!table) return null;

    return {
      id: id || `table-${table.key}`,
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

  const renderSingleEntryItem = ({ field, label, infoKey, id, title }) => {
    const definition = singleEntryDefinitionsMap[field];
    if (!definition) return null;

    return {
      id: id || `single-${field}`,
      label,
      type: "Single Entry",
      heading: false,
      render: () => (
        <>
          <SectionHeading as="h3" title={title || label} infoText={getInfoText(infoKey)} />
          <div className="card" style={{ padding: "1.5rem" }}>
            <SingleEntryEditor
              definitions={[definition]}
              values={singleEntryValues}
              loading={singleEntryLoading}
              isEditor={isEditor}
              onContentChange={updateContent}
              onImageChange={updateImage}
              onSave={handleSingleEntrySave}
              dirtyFields={{
                [field]: Boolean(singleEntryDirty[field])
              }}
            />
          </div>
        </>
      )
    };
  };

  const labellingBaselinesTable = findTable("sam_labelling_baselines");
  const labellingBaselinesBranchesTable = findTable("sam_labelling_baselines2");

  const navigationItems = [
    renderSingleEntryItem({
      field: "supplier_project_introduction_and_scope",
      label: "Supplier Project Introduction and Scope",
      infoKey: "supplierProjectIntroduction"
    }),
    renderSingleEntryItem({
      field: "support_project_plan",
      label: "Supplier Project Plan",
      infoKey: "supplierProjectPlan"
    }),
    renderTableItem({
      tableKey: "sam_assumptions",
      label: "Assumptions",
      infoKey: "assumptionsGroup"
    }),
    renderTableItem({
      tableKey: "sam_dependencies",
      label: "Dependencies",
      infoKey: "assumptionsGroup"
    }),
    renderTableItem({
      tableKey: "sam_constraints",
      label: "Constraints",
      infoKey: "assumptionsGroup"
    }),
    renderTableItem({
      tableKey: "sam_risks",
      label: "Risks",
      infoKey: "assumptionsGroup"
    }),
    renderTableItem({
      tableKey: "sam_status_reporting_and_communication_plan",
      label: "Status Reporting and Communication Plan",
      infoKey: "statusReporting"
    }),
    renderTableItem({
      tableKey: "sam_quantitative_objectives_measurement_and_data_management_plan",
      label: "Quantitative Objectives, Measurement and Data Management Plan",
      infoKey: "quantitativeObjectives"
    }),
    renderTableItem({
      tableKey: "sam_verification_and_validation_plan",
      label: "Verification and Validation Plan",
      infoKey: "verificationValidation"
    }),
    renderTableItem({
      tableKey: "tailoring_sam",
      label: "Tailoring",
      infoKey: "tailoring"
    }),
    renderTableItem({
      tableKey: "sam_deviations",
      label: "Deviations",
      infoKey: "deviations"
    }),
    renderTableItem({
      tableKey: "sam_product_release_plan",
      label: "Product Release Plan",
      infoKey: "productReleasePlan"
    }),
    renderSingleEntryItem({
      field: "supplier_configuration_management_plan",
      label: "Supplier Configuration Management Plan",
      infoKey: "supplierCmPlan"
    }),
    renderSingleEntryItem({
      field: "sam_location_of_ci",
      label: "Location of CIs",
      infoKey: "locationOfCis"
    }),
    renderSingleEntryItem({
      field: "sam_versioning",
      label: "Versioning",
      infoKey: "versioning"
    }),
    renderSingleEntryItem({
      field: "sam_baselining",
      label: "Baselining",
      infoKey: "baselining"
    }),
    (labellingBaselinesTable || labellingBaselinesBranchesTable)
      ? {
          id: "table-sam-labelling-baselines",
          label: "Labelling Baselines Tables",
          type: "Table",
          heading: false,
          render: () => (
            <>
              <SectionHeading
                as="h3"
                title="Labelling Baselines Tables"
                infoText={getInfoText("labellingBaselines")}
              />
              {labellingBaselinesTable ? renderTableCard(labellingBaselinesTable) : null}
              {labellingBaselinesBranchesTable
                ? renderTableCard(labellingBaselinesBranchesTable)
                : null}
            </>
          )
        }
      : null,
    renderSingleEntryItem({
      field: "sam_change_management_plan",
      label: "Change Management Plan",
      infoKey: "changeManagementPlan"
    }),
    renderTableItem({
      tableKey: "sam_configuration_control",
      label: "Configuration Control",
      infoKey: "configurationControl"
    }),
    renderSingleEntryItem({
      field: "sam_configuration_management_audit",
      label: "Configuration Management Audit",
      infoKey: "configurationManagementAudit"
    }),
    renderSingleEntryItem({
      field: "sam_backup",
      label: "Back up",
      infoKey: "backup"
    }),
    renderSingleEntryItem({
      field: "sam_release_mechanism",
      label: "Release Mechanism",
      infoKey: "releaseMechanism"
    }),
    renderSingleEntryItem({
      field: "sam_information_retention_plan",
      label: "Information Retention Plan",
      infoKey: "informationRetentionPlan"
    }),
    {
      id: "sam-deliverables",
      label: "Deliverables List",
      type: "Table",
      heading: false,
      render: () => (
        <>
          <SectionHeading
            as="h3"
            title="Deliverables List"
            infoText={getInfoText("deliverablesList")}
          />
          <SamDeliverables projectId={projectId} isEditor={isEditor} />
        </>
      )
    },
    renderSingleEntryItem({
      field: "supplier_acceptance_criteria",
      label: "Supplier Acceptance Criteria",
      infoKey: "supplierAcceptanceCriteria"
    }),
    renderSingleEntryItem({
      field: "transition_plan",
      label: "Transition plan",
      infoKey: "transitionPlan"
    })
  ].filter(Boolean);

  if (!navigationItems.length) {
    navigationItems.push({
      id: "info-empty",
      label: "Supplier Guidance",
      type: "Info",
      render: () => (
        <div className="info-message">
          No supplier agreement data configured for this section.
        </div>
      )
    });
  }

  return (
    <SectionLayout
      title="M13 - Supplier Agreement Management"
      sectionId={sectionId}
      sectionLabel={sectionName}
      projectId={projectId}
      items={navigationItems}
    />
  );
};

export default M13SupplierAgreement;
