import React from "react";
import axios from "axios";
import { API } from "../../App";
import DataTable from "../DataTable";
import SectionHeading from "../SectionHeading";
import SectionLayout from "../SectionLayout";
import { useGenericTables } from "../../hooks/useGenericTables";
import { SECTION_CONFIG } from "../../sectionConfig";

const SECTION_ID = "M8";

const M8DecisionManagement = ({ projectId, isEditor, sectionId, sectionName }) => {
  const config = SECTION_CONFIG[SECTION_ID] || { tables: [], singleEntries: [] };
  const { data: tableData, loading, createRow, updateRow, deleteRow, refresh } =
    useGenericTables(projectId, SECTION_ID, config.tables || []);

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

  const colors = {
    green: "#0f766e",
    orange: "#c2410c",
    purple: "#6b21a8"
  };

  const infoMessages = {
    decisionManagementPlan: () => (
      <p style={{ margin: 0 }}>
        {"<"}Selection of alternative solutions for Modification Request, identification of
        parameters/ programs for performance optimization, selection of tools and
        Engineering methods etc.{">"}
      </p>
    ),
    tailoring: () => (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}List all processes which are tailored from QMS to suit project specific needs
          Ex. Use of project specific checklist instead of QMS specified or combining of
          DR’s, not conducting unit testing for reused components etc. This should have
          been addressed in the Tailoring guidelines.{">"}
        </p>
        <div style={{ color: colors.green }}>
          <p style={{ margin: "0 0 0.5rem 0" }}>
            {"Keep green font from this "}
            {"<"}For ISO 26262, An activity is tailored if it is omitted or performed in a
            different manner compared to its description in this document. Note: Activities
            that are not performed because they are performed by another entity in the
            supply chain are not considered as tailored, but as distributed activities.{">"}
          </p>
          <p style={{ margin: 0 }}>
            {"<"}For ISO 21434, NOTE 1: An activity is tailored if it is omitted or performed in
            a different manner compared to its description in this document. NOTE 2:
            Activities that are not performed because they are performed by another entity
            in the supply chain are not considered as tailored, but as distributed
            activities.{">"}
          </p>
        </div>
      </div>
    ),
    deviations: () => (
      <p style={{ margin: 0 }}>
        {"<"}List all processes which are deviated from QMS to suit project specific needs
        Ex. Omitting the Use of a checklist mandated by the QMS or not conducting a
        process step mandated by the QMS etc. for which no corresponding tailoring exits in
        tailoring guidelines.{">"}
      </p>
    ),
    productReleasePlan: () => (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"}List all intermediate and formal releases along with date{">"}
        </p>
        <p style={{ margin: 0, color: colors.orange }}>
          {"Keep this font in Orange "}
          {"<"}Also provide information about 'service levels' and 'duration of support' if applicable{">"}
        </p>
      </div>
    ),
    tailoringComponentOutOfContext: () => (
      <div style={{ color: colors.green }}>
        <p style={{ margin: 0 }}>
          {"Keep headig and font in green font "}
          {"<"}Cybersecurity activities are tailored in accordance with a component is
          developed out of context{">"}
        </p>
      </div>
    ),
    cybersecurityInterfaceAgreement: () => (
      <div>
        <div style={{ color: colors.green }}>
          <p style={{ margin: "0 0 0.5rem 0" }}>
            {"Keep heading and info in green font "}
            {"<"}Cybersecurity Interface Agreement is communicated is important to prevent
            misunderstandings of agreement such as responsibilities, level of disclosure of
            information, level of achievement for each milestone, between different
            organizations participating in a distributed cybersecurity activity
            {">"}
          </p>
          <p style={{ margin: "0 0 0.5rem 0" }}>
            {"<"}Cybersecurity Interface Agreement is communicated is important to prevent
            misunderstandings of agreement such as responsibilities, level of disclosure of
            information, level of achievement for each milestone, between different
            organizations participating in a distributed cybersecurity activity{">"}
          </p>
          <p style={{ margin: "0 0 0.5rem 0" }}>
            NOTE1: Use TL_CS_05_Cyber Security Interface Agreement from QMS
            <br />
            NOTE 2: The cybersecurity interface agreement should be mutually agreed upon
            between customer and supplier prior to the start of the distributed cybersecurity
            activities.
            <br />
            NOTE 3: Mile Stone Date for Distributed Cyber Security Activity shall be clearly
            mentioned in Project Plan and schedule document
          </p>
        </div>
        <div style={{ color: colors.purple }}>
          <p style={{ margin: "0 0 0.5rem 0" }}>
            {"Keep from this as purple font "}
            {"<"}Supplier: Supplier responsibilities by RASIC; Customer: Customer
            responsibilities by RASIC; NOTE: RASIC can be used as follows: - R (responsible):
            The organization that is responsible for getting the activity done; - A
            (approval): The organization that has the authority to approve or deny the
            activity once it is complete; - S (support): The organization that a will help the
            organization responsible for the activity; - I (inform): The organization that is
            informed of the progress of the activity and any decisions being made; and - C
            (consult): The organization that offers advice or guidance but does not actively
            work on the activity{">"}
          </p>
        </div>
        <p style={{ margin: 0 }}>
          {"<"}Possible levels of confidentiality: Highly Confidential: Only the organization
          who created the work product is allowed to access it; Confidential: Both customer
          and supplier are allowed to access the work product; Confidential with Third
          Parties: This work product is allowed to be shared with external parties; and
          Public: The work product can be shared without any restrictions.{">"}
        </p>
      </div>
    )
  };

  const getInfoText = (key) => (infoMessages[key] ? infoMessages[key]() : null);

  const findTable = (key) => (config.tables || []).find((table) => table.key === key);

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
          {loading ? (
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

  const navigationItems = [
    buildTableItem({
      table: findTable("decision_management_plan"),
      label: "Decision Management Plan",
      infoKey: "decisionManagementPlan"
    }),
    buildTableItem({
      table: findTable("tailoring_qms"),
      label: "Tailoring",
      infoKey: "tailoring"
    }),
    buildTableItem({
      table: findTable("deviations"),
      label: "Deviations",
      infoKey: "deviations"
    }),
    buildTableItem({
      table: findTable("product_release_plan"),
      label: "Product Release Plan",
      infoKey: "productReleasePlan"
    }),
    buildTableItem({
      table: findTable("tailoring_due_to_component_out_of_context"),
      label: "Tailoring Due to Component Out of Context",
      infoKey: "tailoringComponentOutOfContext",
      headingColor: colors.green
    }),
    buildTableItem({
      table: findTable("release_cybersecurity_interface_agreement"),
      label: "Cybersecurity Interface Agreement",
      infoKey: "cybersecurityInterfaceAgreement",
      headingColor: colors.green
    })
  ].filter(Boolean);

  if (!navigationItems.length) {
    navigationItems.push({
      id: "info-empty",
      label: "Decision Guidance",
      type: "Info",
      render: () => <div className="info-message">No tables configured for this section.</div>
    });
  }

  return (
    <SectionLayout
      title="M8 - Decision Management & Release"
      sectionId={sectionId}
      sectionLabel={sectionName}
      projectId={projectId}
      items={navigationItems}
    />
  );
};

export default M8DecisionManagement;
