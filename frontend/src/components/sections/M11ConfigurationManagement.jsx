import React, { useEffect, useMemo } from "react";
import axios from "axios";
import { API } from "../../App";
import DataTable from "../DataTable";
import SingleEntryEditor from "../SingleEntryEditor";
import SectionLayout from "../SectionLayout";
import SectionHeading from "../SectionHeading";
import { useGenericTables } from "../../hooks/useGenericTables";
import { useSingleEntries } from "../../hooks/useSingleEntries";
import { SECTION_CONFIG } from "../../sectionConfig";

const SECTION_ID = "M11";

const M11ConfigurationManagement = ({
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

  const inlineEntriesByTable = useMemo(() => {
    return singleEntryDefinitions.reduce((acc, entry) => {
      if (entry.inlineWithTable) {
        if (!acc[entry.inlineWithTable]) {
          acc[entry.inlineWithTable] = [];
        }
        acc[entry.inlineWithTable].push(entry);
      }
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
    configurationManagementTools: (
      <p style={{ margin: 0 }}>
        {"<"}CM tool that will be used for the project shall be mentioned here along
        with version no of the CM tool{">"}
      </p>
    ),
    listOfConfigurationItems: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}List the Configuration Items (CIs) that need to form part of the CM
          repository. All work products produced during the course of the project
          should be identified as Configuration Items.{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}Please refer to CM guideline for detail description{">"}
        </p>
      </div>
    ),
    listOfNonConfigurableItems: (
      <p style={{ margin: 0 }}>
        {"<"}List the Non-Configuration Items (Non-CIs) that need to form part of the
        CM repository are RFRs, Weekly and Other Reports, Project related mails,
        technical queries etc.{">"}
      </p>
    ),
    namingConvention: (
      <p style={{ margin: 0 }}>
        {"<"}Each CI should have a unique identification scheme. Specify the naming
        convention that will be used in the project for all the configuration items -
        documents as well as the source code, refer to guideline.{">"}
      </p>
    ),
    locationOfCis: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Include the path and directory structure of the CM Repository. The
          directory structure can be represented pictorially{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Example of directory structure is given in the CM guideline.{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}Location and Names of Mail folders where the project related mails such
          as status reports, technical queries etc will be stored should also be
          identified here.{">"}
        </p>
      </div>
    ),
    versioning: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Please specify the version rule that is to be followed for the draft,
          approved or baselined or released doc, code etc.{">"}
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
    branchingAndMerging: (
      <p style={{ margin: 0 }}>
        {"<"}Define branching and merging strategy. Refer list of CI & Non-CIs for
        which branching/merging is selected as yes. The branch management strategy
        specifies in which cases branching is permissible, whether authorization is
        required, how branches are merged, any risk associated, and which activities
        are required to verify that all changes have been consistently integrated
        without damage to other changes or to the original software.{">"}
      </p>
    ),
    labellingBaselines: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Identify the scheme for labeling baselines based on the following –
          1) Release name like Integration, Final etc 2) CR No. 3) Tested stage like
          unit tested etc 4) Branches, if any{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}Please refer guideline{">"}
        </p>
      </div>
    ),
    changeManagementPlan: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Explain Change management initiation process{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Briefly explain the change control process that is to be followed for
          proposing change approving, rejecting and authority for approval of
          different kind of changes, based on project needs{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}For more insight pl. refer to practice{">"}
        </p>
      </div>
    ),
    configurationControl: (
      <p style={{ margin: 0 }}>
        {"<"}Explain the control over the configuration items, that is, check-in and
        check-out permissions{">"}
      </p>
    ),
    configurationControlBoard: (
      <p style={{ margin: 0 }}>
        {"<"}Refer to guideline{">"}
      </p>
    ),
    configurationStatusAccounting: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}To get all baseline versions of any CI’s and updates of versions
          thereafter along with changes in brief at any point in time, configuration
          status accounting shall be done. Identify the stage/s at which CSAR will be
          generated. The CC should generate the CSAR - mentioning the versions of the
          items under CM. This can be done using revision history of the specific CI
          .Revision history will have to be up to date and at any point in time
          revision history of latest version of the CI shall give the up to date
          status of the same{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}CM tool feature e.g. Win CVS-log selection, VSS SAR, can also be used
          to generate the same{">"}
        </p>
      </div>
    ),
    configurationManagementAudit: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Schedule for the CM audit - once in a month or after completion of
          every testing phase and before delivery to customer. CM audit should be
          done by the P-SQA and Release audit should be done by SQA. CM audit
          checklist should be used for the same.{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}Suggestion: The audit dates can be indicated in the project Gantt
          chart{">"}
        </p>
      </div>
    ),
    backupAndRetrieval: (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Please refer to the backup & Retrieval procedure available with the
          TSIP IT support group.{">"}
        </p>
        <p style={{ margin: 0, color: "#ff8c00" }}>
          {"<"}Retrieval is the process of accessing specific versions of artifacts
          or documents from the repository. This is done to review, modify, or use
          the specific version for various purposes. The retrieval process ensures
          that the right version of the artifact is obtained and that consistency is
          maintained across the development process.{">"}
        </p>
      </div>
    ),
    recovery: (
      <p style={{ margin: 0, color: "#ff8c00" }}>
        {"<"}Please refer to the recovery procedure available with the TSIP IT
        support group. Recovery refers to the ability to restore or recover the
        software project's artifacts, versions, and related data to a previous state
        in case of unexpected events, errors, or data loss{">"}
      </p>
    ),
    releaseMechanism: (
      <p style={{ margin: 0 }}>
        {"<"}Explain the directory used for release, procedure for build,
        verification mechanism, etc. Every release should be built from the CM tool
        and should be assigned a tag or a label. Refer to release process.{">"}
      </p>
    ),
    informationRetentionPlan: (
      <p style={{ margin: 0 }}>
        {"<"}Explain the period for which the work products of the project will be
        retained as per SOW and agreement with customer. Explain the process of
        scrapping/deleting the information. Please refer to Information Retention and
        Disposal Procedure in ISMS for more details{">"}
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

        {(inlineEntriesByTable[table.key] || []).length > 0 && (
          <div className="single-entry-inline-block">
            <SingleEntryEditor
              definitions={inlineEntriesByTable[table.key]}
              values={singleEntryValues}
              loading={singleEntryLoading}
              isEditor={isEditor}
              onContentChange={updateContent}
              onImageChange={updateImage}
              onSave={handleSingleEntrySave}
              dirtyFields={inlineEntriesByTable[table.key].reduce((acc, entry) => {
                acc[entry.field] = Boolean(singleEntryDirty[entry.field]);
                return acc;
              }, {})}
            />
          </div>
        )}
      </div>
    );
  };

  const renderSingleEntryCard = ({
    field,
    label,
    infoKey,
    title,
    headingProps
  }) => {
    const definition = singleEntryDefinitionsMap[field];
    if (!definition) return null;

    return {
      id: `single-${field}`,
      label,
      type: "Single Entry",
      heading: false,
      render: () => (
        <>
          <SectionHeading
            as="h3"
            title={title || label}
            infoText={getInfoText(infoKey)}
            headingProps={headingProps}
          />
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

  const labellingBaselinesTable = findTable("labelling_baselines");
  const labellingBranchesTable = findTable("labelling_baselines2");

  const navigationItems = [
    renderSingleEntryCard({
      field: "configuration_management_tools",
      label: "Configuration Management Tools",
      infoKey: "configurationManagementTools"
    }),
    renderTableItem({
      tableKey: "list_of_configuration_items",
      label: "List of Configuration Items",
      infoKey: "listOfConfigurationItems"
    }),
    renderTableItem({
      tableKey: "list_of_non_configurable_items",
      label: "List of Non-Configurable Items",
      infoKey: "listOfNonConfigurableItems"
    }),
    renderTableItem({
      tableKey: "naming_convention",
      label: "Naming Convention",
      infoKey: "namingConvention"
    }),
    renderSingleEntryCard({
      field: "location_of_ci",
      label: "Location of CIs",
      infoKey: "locationOfCis"
    }),
    renderSingleEntryCard({
      field: "versioning",
      label: "Versioning",
      infoKey: "versioning"
    }),
    renderSingleEntryCard({
      field: "baselining",
      label: "Baselining",
      infoKey: "baselining"
    }),
    renderTableItem({
      tableKey: "branching_and_merging",
      label: "Branching and Merging",
      infoKey: "branchingAndMerging"
    }),
    (labellingBaselinesTable || labellingBranchesTable)
      ? {
          id: "table-labelling-baselines",
          label: "Labelling Baselines (Tagging) and Other Labelling Table",
          type: "Table",
          heading: false,
          render: () => (
            <>
              <SectionHeading
                as="h3"
                title="Labelling Baselines (Tagging) and Other Labelling Table"
                infoText={getInfoText("labellingBaselines")}
              />
              {labellingBaselinesTable ? renderTableCard(labellingBaselinesTable) : null}
              {labellingBranchesTable ? renderTableCard(labellingBranchesTable) : null}
            </>
          )
        }
      : null,
    renderSingleEntryCard({
      field: "change_management_plan",
      label: "Change Management Plan",
      infoKey: "changeManagementPlan"
    }),
    renderTableItem({
      tableKey: "configuration_control",
      label: "Configuration Control",
      infoKey: "configurationControl"
    }),
    renderTableItem({
      tableKey: "configuration_control_board",
      label: "Configuration Control Board",
      infoKey: "configurationControlBoard"
    }),
    renderTableItem({
      tableKey: "configuration_status_accounting",
      label: "Configuration Status Accounting",
      infoKey: "configurationStatusAccounting"
    }),
    renderTableItem({
      tableKey: "configuration_management_audit",
      label: "Configuration Management Audit",
      infoKey: "configurationManagementAudit"
    }),
    renderSingleEntryCard({
      field: "backup_and_retrieval",
      label: "Back up & Retrieval",
      infoKey: "backupAndRetrieval",
      title: (
        <>
          <span>Back up & </span>
          <span style={{ color: "#ff8c00" }}>Retrieval</span>
        </>
      )
    }),
    renderSingleEntryCard({
      field: "recovery",
      label: "Recovery",
      infoKey: "recovery",
      headingProps: { style: { color: "#ff8c00" } }
    }),
    renderSingleEntryCard({
      field: "release_mechanism",
      label: "Release Mechanism",
      infoKey: "releaseMechanism"
    }),
    renderSingleEntryCard({
      field: "information_retention_plan",
      label: "Information Retention Plan",
      infoKey: "informationRetentionPlan"
    })
  ].filter(Boolean);

  if (!navigationItems.length) {
    navigationItems.push({
      id: "info-empty",
      label: "Configuration Guidance",
      type: "Info",
      render: () => <div className="info-message">No configuration items available.</div>
    });
  }

  return (
    <SectionLayout
      title="M11 - Configuration Management"
      sectionId={sectionId}
      sectionLabel={sectionName}
      projectId={projectId}
      items={navigationItems}
    />
  );
};

export default M11ConfigurationManagement;
