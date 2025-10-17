import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../../App";
import DataTable from "../DataTable";
import SectionHeading from "../SectionHeading";
import SingleEntryEditor from "../SingleEntryEditor";
import SectionLayout from "../SectionLayout";
import { useGenericTables } from "../../hooks/useGenericTables";
import { useSingleEntries } from "../../hooks/useSingleEntries";
import { SECTION_CONFIG } from "../../sectionConfig";

const ROLE_OPTIONS = [
  "<SMT>",
  "<Program Manager/Delivery Head>",
  "<Customer Representative>",
  "<Engineeering Manager>",
  "<Lead Engineer/Team Leader>",
  "<Technical Leader/Technical Architect>",
  "<SSE/SE/ASE/TE>",
  "<P-SQA>",
  "<Configuration Controller>",
  "<Data Owner>",
  "<Data Custodian>",
  "<Asset Owner>",
  "<Security Leader/Officer>",
  "<Security Engineer>",
  "<Risk management Team member>",
  "<Incident Response team Member>",
  "<Vulnerability Engineer>",
  "<Red Team>",
  "<QA Team>",
  "<PV Team>",
  "<HR/Admin/Finance Teams>",
  "<IT Team>"
];

const M5Resources = ({ projectId, isEditor, sectionId, sectionName, onSingleEntryDirtyChange }) => {
  const [stakeholders, setStakeholders] = useState([]);
  const [loading, setLoading] = useState(true);
  const sectionConfig = SECTION_CONFIG.M5 || { tables: [], singleEntries: [] };
  const {
    data: tableData,
    loading: tablesLoading,
    createRow,
    updateRow,
    deleteRow,
    refresh
  } = useGenericTables(projectId, "M5", sectionConfig.tables || []);
  const {
    values: singleEntryValues,
    loading: singleEntryLoading,
    updateContent: updateSingleEntryContent,
    updateImage: updateSingleEntryImage,
    saveEntry: saveSingleEntry,
    dirtyFields: singleEntryDirty,
    hasUnsavedChanges: singleEntryHasUnsaved
  } = useSingleEntries(projectId, sectionConfig.singleEntries || []);

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

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}/stakeholders`);
      setStakeholders(response.data);
    } catch (err) {
      console.error("Failed to fetch stakeholders", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (newData) => {
    try {
      await axios.post(`${API}/projects/${projectId}/stakeholders`, newData);
      fetchData();
    } catch (err) {
      alert("Failed to add stakeholder");
    }
  };

  const handleEdit = async (id, updatedData) => {
    try {
      const { id: _, project_id, ...dataToSend } = updatedData;
      await axios.put(`${API}/projects/${projectId}/stakeholders/${id}`, dataToSend);
      fetchData();
    } catch (err) {
      alert("Failed to update stakeholder");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${API}/projects/${projectId}/stakeholders/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete stakeholder");
    }
  };

  const columns = [
    { key: "sl_no", label: "Sl. No" },
    { key: "name", label: "Name" },
    {
      key: "stakeholder_type",
      label: "Internal/External",
      options: [
        { label: "Internal", value: "Internal" },
        { label: "External", value: "External" }
      ],
      placeholderOption: "Select stakeholder type"
    },
    {
      key: "role",
      label: "Roles",
      options: ROLE_OPTIONS,
      placeholderOption: "Select role",
      cellClassName: "stakeholder-role-cell",
      renderDisplay: (value) =>
        value ? <span className="stakeholder-role-value">{value}</span> : "-"
    },
    { key: "authority_responsibility", label: "Authority/Responsibility" },
    { key: "contact_details", label: "Contact Details" }
  ];

  const handleAddTableRow = async (tableKey, newData) => {
    try {
      await createRow(tableKey, newData);
    } catch (error) {
      console.error("Failed to add row", error);
      alert("Failed to add row");
    }
  };

  const handleEditTableRow = async (tableKey, rowId, updatedData) => {
    const { id: _id, ...payload } = updatedData;
    try {
      await updateRow(tableKey, rowId, payload);
    } catch (error) {
      console.error("Failed to update row", error);
      alert("Failed to update row");
    }
  };

  const handleDeleteTableRow = async (tableKey, rowId) => {
    if (!window.confirm("Delete this row?")) return;
    try {
      await deleteRow(tableKey, rowId);
    } catch (error) {
      console.error("Failed to delete row", error);
      alert("Failed to delete row");
    }
  };

  const handlePrefillTable = async (table) => {
    if (!table.prefillRows || !table.prefillRows.length) return;
    const apiName = table.apiName || table.key;
    try {
      for (const row of table.prefillRows) {
        await axios.post(
          `${API}/projects/${projectId}/sections/M5/tables/${apiName}`,
          { data: row }
        );
      }
      await refresh();
    } catch (error) {
      console.error("Failed to prefill rows", error);
      alert("Failed to populate defaults");
    }
  };

  const handleSingleEntrySave = async (field) => {
    try {
      await saveSingleEntry(field);
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
    organizationStructure: () => (
      <p style={{ margin: 0 }}>
        {"<"}Use diagram/Organization chart to depict the various roles (individuals or teams)
        and staffing structure required to meet project objectives.{">"}
      </p>
    ),
    stakeholders: () => (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}List internal and external stakeholders involved in the project such as SMT,
          project team members, support function teams, customer representatives. Identify the
          importance/weightage of each stakeholder.{">"}
        </p>
        <p style={{ margin: 0, color: colors.green }}>
          {"Keep this in Green font "}
          {"<"}For ISO 21434, The Roles and responsibilities are mentioned in "
          {"GL_PD_04_Guidelines_For_Team_Formation_and_Operation.docx"}.{">"}
        </p>
      </div>
    ),
    humanResource: () => (
      <p style={{ margin: 0 }}>
        {"<"}Capture staffing needs, availability, and special training plans to meet project
        requirements.{">"}
      </p>
    ),
    environmentAndTools: () => (
      <p style={{ margin: 0 }}>
        {"<"}Mention HW, SW, System and Tools used in development and testing along with required
        licenses and availability.{">"}
      </p>
    ),
    buildBuyReuse: () => (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Mention the components/products meant for reuse which forms part of product
          delivery. Criteria for acceptance includes conformance testing, verification of test
          reports, evidence of product stability etc. need to be mentioned. Justification and
          rationale for build/buy/reuse to be documented explicitly.{">"}
        </p>
        <p style={{ margin: 0, color: colors.green }}>
          {"Keep this in Green font "}
          {"<"}If the cyber security component needs to be modified mention the impact the
          cybersecurity requirements to one or more options – i.e.-  the design and implementation,
          operational environments and operating modes, maintenance, cybersecurity controls,
          susceptibility to known attacks and exposure of known vulnerabilities, the assets.{">"}
        </p>
      </div>
    ),
    reuseAnalysis: () => (
      <p style={{ margin: 0 }}>
        {"<"}Assess reuse candidates, required modifications, and their impact on plans and
        cybersecurity.{">"}
      </p>
    ),
    summaryOfEstimates: () => (
      <p style={{ margin: 0 }}>
        {"<"}Specify the assumptions and considerations that were used as part of the estimation.
        Also specify the estimation method.{">"}
      </p>
    ),
    sizeAndComplexity: () => (
      <p style={{ margin: 0 }}>
        {"<"}List product / component / module along with estimated size, reuse and complexity
        which is used in detailed estimation.{">"}
      </p>
    ),
    durationEffortNorms: () => (
      <p style={{ margin: 0 }}>
        {"<"}List estimates of duration and effort. Comparison is made with organization or domain
        norms.{">"}
      </p>
    ),
    usageOfOffTheShelf: () => (
      <p style={{ margin: 0, color: colors.green }}>
        {"<"}If integrating an off-the-shelf component is intended, the cybersecurity-relevant
        information shall be gathered and analysed.{">"}
      </p>
    ),
    cybersecurityInterfaceAgreement: () => (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}Cybersecurity Interface Agreement is communicated is important to prevent
          misunderstandings of agreement such as responsibilities, level of disclosure of
          information, level of achievement for each milestone, between different organizations
          participating in a distributed cybersecurity activity.{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          NOTE1: Use TL_CS_05_Cyber Security Interface Agreement from QMS
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          NOTE 2: The cybersecurity interface agreement should be mutually agreed upon between
          customer and supplier prior to the start of the distributed cybersecurity activities.
        </p>
        <p style={{ margin: "0 0 0.75rem 0" }}>
          NOTE 3: Mile Stone Date for Distributed Cyber Security Activity shall be clearly
          mentioned in Project Plan and schedule document
        </p>
        <p style={{ margin: "0 0 0.5rem 0", color: colors.purple }}>
          {"<"}Cybersecurity Interface Agreement is communicated is important to prevent
          misunderstandings of agreement such as responsibilities, level of disclosure of
          information, level of achievement for each milestone, between different organizations
          participating in a distributed cybersecurity activity.{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0", color: colors.purple }}>
          {"<"}Supplier: Supplier responsibilities by RASIC; Customer: Customer responsibilities by
          RASIC;{">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0", color: colors.purple }}>
          NOTE: RASIC can be used as follows:
        </p>
        <ul style={{ margin: "0 0 0.5rem 1.25rem", color: colors.purple }}>
          <li>R (responsible): The organization that is responsible for getting the activity done;</li>
          <li>
            A (approval): The organization that has the authority to approve or deny the activity
            once it is complete;
          </li>
          <li>
            S (support): The organization that a will help the organization responsible for the
            activity;
          </li>
          <li>
            I (inform): The organization that is informed of the progress of the activity and any
            decisions being made; and
          </li>
          <li>
            C (consult): The organization that offers advice or guidance but does not actively work
            on the activity
          </li>
        </ul>
        <p style={{ margin: "0 0 0.5rem 0", color: colors.purple }}>
          Possible levels of confidentiality:
        </p>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", color: colors.purple }}>
          <li>Highly Confidential: Only the organization who created the work product is allowed to access it;</li>
          <li>Confidential: Both customer and supplier are allowed to access the work product;</li>
          <li>
            Confidential with Third Parties: This work product is allowed to be shared with external
            parties; and
          </li>
          <li>Public: The work product can be shared without any restrictions.</li>
        </ul>
      </div>
    )
  };

  const getInfoText = (key) => (infoMessages[key] ? infoMessages[key]() : <span>No additional guidance provided.</span>);

  const findSingleEntry = (field) => (sectionConfig.singleEntries || []).find((entry) => entry.field === field);
  const findTable = (key) => (sectionConfig.tables || []).find((table) => table.key === key);

  const buildSingleEntryItem = ({ entry, label, infoKey, headingProps }) => {
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
          <SectionHeading as="h3" title={label} infoText={getInfoText(infoKey)} headingProps={headingProps} />
          <SingleEntryEditor
            key={entry.field}
            definitions={[entry]}
            values={singleEntryValues}
            loading={singleEntryLoading}
            isEditor={isEditor}
            onContentChange={updateSingleEntryContent}
            onImageChange={updateSingleEntryImage}
            onSave={handleSingleEntrySave}
            dirtyFields={{ [entry.field]: singleEntryDirty[entry.field] }}
          />
        </>
      )
    };
  };

  const buildTableItem = ({ table, label, infoKey, headingProps }) => {
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
          <SectionHeading as="h3" title={label} infoText={getInfoText(infoKey)} headingProps={headingProps} />
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
                    onClick={() => handlePrefillTable(table)}
                  >
                    Populate Defaults
                  </button>
                )}
              </div>

              <DataTable
                columns={table.columns}
                data={tableData[table.key] || []}
                onAdd={(payload) => handleAddTableRow(table.key, payload)}
                onEdit={(rowId, payload) => handleEditTableRow(table.key, rowId, payload)}
                onDelete={(rowId) => handleDeleteTableRow(table.key, rowId)}
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

  const stakeholderItem = {
    id: "table-stakeholders",
    label: "List of Stakeholders",
    type: "Table",
    heading: false,
    render: () => (
      <>
        <SectionHeading as="h3" title="List of Stakeholders" infoText={getInfoText("stakeholders")} />
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="card" style={{ padding: "1.5rem" }}>
            <DataTable
              columns={columns}
              data={stakeholders}
              onAdd={handleAdd}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isEditor={isEditor}
              addButtonText="Add in Stakeholders"
              uniqueKeys={["sl_no"]}
            />
          </div>
        )}
      </>
    )
  };

  const navigationItems = [
    buildSingleEntryItem({
      entry: findSingleEntry("organization_structure"),
      label: "Organization Structure",
      infoKey: "organizationStructure"
    }),
    stakeholderItem,
    buildTableItem({
      table: findTable("human_resource_and_special_training_plan"),
      label: "Human Resource & Special Training Plan",
      infoKey: "humanResource"
    }),
    buildTableItem({
      table: findTable("environment_and_tools"),
      label: "Environment & Tools",
      infoKey: "environmentAndTools"
    }),
    buildTableItem({
      table: findTable("build_buy_reuse"),
      label: "Build / Buy / Reuse",
      infoKey: "buildBuyReuse"
    }),
    buildTableItem({
      table: findTable("reuse_analysis"),
      label: "Reuse Analysis",
      infoKey: "reuseAnalysis"
    }),
    buildSingleEntryItem({
      entry: findSingleEntry("summary_estimates_assumptions"),
      label: "Summary of Estimates",
      infoKey: "summaryOfEstimates"
    }),
    buildTableItem({
      table: findTable("size_and_complexity"),
      label: "Size & Complexity",
      infoKey: "sizeAndComplexity"
    }),
    buildTableItem({
      table: findTable("duration_effort_estimate_organization_norms"),
      label: "Duration & Effort Norms",
      infoKey: "durationEffortNorms"
    }),
    buildTableItem({
      table: findTable("usage_of_off_the_shelf_component"),
      label: "Usage of Off-the-Shelf Component",
      infoKey: "usageOfOffTheShelf",
      headingProps: { style: { color: colors.green } }
    }),
    buildTableItem({
      table: findTable("cybersecurity_interface_agreement"),
      label: "Cybersecurity Interface Agreement",
      infoKey: "cybersecurityInterfaceAgreement",
      headingProps: { style: { color: colors.green } }
    })
  ].filter(Boolean);

  return (
    <SectionLayout
      title="Resources Plan & Estimation"
      sectionId={sectionId}
      sectionLabel={sectionName}
      projectId={projectId}
      items={navigationItems}
    />
  );
};

export default M5Resources;
