import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../../App";
import DataTable from "../DataTable";
import SingleEntryEditor from "../SingleEntryEditor";
import SectionHeading from "../SectionHeading";
import SectionLayout from "../SectionLayout";
import { SECTION_CONFIG } from "../../sectionConfig";
import { useSingleEntries } from "../../hooks/useSingleEntries";

const M4ProjectOverview = ({
  projectId,
  isEditor,
  sectionId,
  sectionName,
  onSingleEntryDirtyChange
}) => {
  const [projectDetails, setProjectDetails] = useState([]);
  const [assumptions, setAssumptions] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [businessContinuity, setBusinessContinuity] = useState([]);
  const [informationSecurityRequirements, setInformationSecurityRequirements] = useState([]);
  const singleEntryConfig = SECTION_CONFIG.M4?.singleEntries || [];
  const singleEntryDefinitions = singleEntryConfig.reduce((accumulator, entry) => {
    if (entry?.field) {
      accumulator[entry.field] = entry;
    }
    return accumulator;
  }, {});
  const {
    values: singleEntryValues,
    loading: singleEntryLoading,
    updateContent: updateSingleEntryContent,
    updateImage: updateSingleEntryImage,
    saveEntry: saveSingleEntry,
    dirtyFields: singleEntryDirty,
    hasUnsavedChanges: singleEntryHasUnsaved
  } = useSingleEntries(projectId, singleEntryConfig);

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
      const [
        detailsRes,
        assumptionsRes,
        constraintsRes,
        dependenciesRes,
        businessContinuityRes,
        informationSecurityRes
      ] = await Promise.all([
        axios.get(`${API}/projects/${projectId}/project-details`),
        axios.get(`${API}/projects/${projectId}/assumptions`),
        axios.get(`${API}/projects/${projectId}/constraints`),
        axios.get(`${API}/projects/${projectId}/dependencies`),
        axios.get(`${API}/projects/${projectId}/sections/M4/tables/business_continuity`),
        axios.get(
          `${API}/projects/${projectId}/sections/M4/tables/information_security_requirements`
        )
      ]);

      setProjectDetails(detailsRes.data ? [{ ...detailsRes.data }] : []);
      setAssumptions(assumptionsRes.data || []);
      setConstraints(constraintsRes.data || []);
      setDependencies(dependenciesRes.data || []);
      setBusinessContinuity(
        (businessContinuityRes.data || []).map((row) => ({ id: row.id, ...row.data }))
      );
      setInformationSecurityRequirements(
        (informationSecurityRes.data || []).map((row) => ({ id: row.id, ...row.data }))
      );
    } catch (err) {
      console.error("Failed to fetch project overview", err);
    }
  };

  const handleAddProjectDetail = async (newData) => {
    try {
      await axios.post(`${API}/projects/${projectId}/project-details`, newData);
      fetchData();
    } catch (err) {
      console.error("Failed to add project details", err);
      alert("Failed to add project details");
    }
  };

  const handleEditProjectDetail = async (id, updatedData) => {
    try {
      const { id: _, project_id, ...payload } = updatedData;
      await axios.put(`${API}/projects/${projectId}/project-details/${id}`, payload);
      fetchData();
    } catch (err) {
      console.error("Failed to update project details", err);
      alert("Failed to update project details");
    }
  };

  const handleDeleteProjectDetail = async (id) => {
    if (!window.confirm("Are you sure you want to delete the project details?")) return;
    try {
      await axios.delete(`${API}/projects/${projectId}/project-details/${id}`);
      fetchData();
    } catch (err) {
      console.error("Failed to delete project details", err);
      alert("Failed to delete project details");
    }
  };

  const projectDetailColumns = [
    { key: "project_model", label: "Project Model" },
    { key: "project_type", label: "Project Type" },
    { key: "software_type", label: "Software Type" },
    { key: "standard_to_be_followed", label: "Standard" },
    { key: "customer", label: "Customer" },
    { key: "programming_language", label: "Programming Language" },
    { key: "project_duration", label: "Project Duration" },
    { key: "team_size", label: "Team Size", numericOnly: true }
  ];

  // Assumptions
  const handleAddAssumption = async (newData) => {
    try {
      await axios.post(`${API}/projects/${projectId}/assumptions`, newData);
      fetchData();
    } catch (err) {
      alert("Failed to add assumption");
    }
  };

  const handleEditAssumption = async (id, updatedData) => {
    try {
      const { id: _, project_id, ...dataToSend } = updatedData;
      await axios.put(`${API}/projects/${projectId}/assumptions/${id}`, dataToSend);
      fetchData();
    } catch (err) {
      alert("Failed to update assumption");
    }
  };

  const handleDeleteAssumption = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${API}/projects/${projectId}/assumptions/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete assumption");
    }
  };

  // Constraints
  const handleAddConstraint = async (newData) => {
    try {
      await axios.post(`${API}/projects/${projectId}/constraints`, newData);
      fetchData();
    } catch (err) {
      alert("Failed to add constraint");
    }
  };

  const handleEditConstraint = async (id, updatedData) => {
    try {
      const { id: _, project_id, ...dataToSend } = updatedData;
      await axios.put(`${API}/projects/${projectId}/constraints/${id}`, dataToSend);
      fetchData();
    } catch (err) {
      alert("Failed to update constraint");
    }
  };

  const handleDeleteConstraint = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${API}/projects/${projectId}/constraints/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete constraint");
    }
  };

  // Dependencies
  const handleAddDependency = async (newData) => {
    try {
      await axios.post(`${API}/projects/${projectId}/dependencies`, newData);
      fetchData();
    } catch (err) {
      alert("Failed to add dependency");
    }
  };

  const handleEditDependency = async (id, updatedData) => {
    try {
      const { id: _, project_id, ...dataToSend } = updatedData;
      await axios.put(`${API}/projects/${projectId}/dependencies/${id}`, dataToSend);
      fetchData();
    } catch (err) {
      alert("Failed to update dependency");
    }
  };

  const handleDeleteDependency = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`${API}/projects/${projectId}/dependencies/${id}`);
      fetchData();
    } catch (err) {
      alert("Failed to delete dependency");
    }
  };

  const assumptionColumns = [
    { key: "sl_no", label: "Sl. No", numericOnly: true },
    { key: "brief_description", label: "Brief Description" },
    { key: "impact_on_project_objectives", label: "Impact on Project Objectives" },
    { key: "remarks", label: "Remarks" }
  ];

  const constraintColumns = [
    { key: "constraint_no", label: "Sl. No", numericOnly: true },
    { key: "brief_description", label: "Brief Description" },
    { key: "impact_on_project_objectives", label: "Impact on Project Objectives" },
    { key: "remarks", label: "Remarks" }
  ];

  const dependencyColumns = [
    { key: "sl_no", label: "Sl. No", numericOnly: true },
    { key: "brief_description", label: "Brief Description" },
    { key: "impact_on_project_objectives", label: "Impact on Project Objectives" },
    { key: "remarks", label: "Remarks" }
  ];

  const businessContinuityColumns = [
    { key: "sl_no", label: "Sl. No", numericOnly: true },
    { key: "brief_description", label: "Brief Description" },
    { key: "impact_of_project_objectives", label: "Impact on Project Objectives" },
    { key: "remarks", label: "Remarks" }
  ];

  const infoSecurityColumns = [
    { key: "sl_no", label: "Sl. No", numericOnly: true },
    { key: "phase", label: "Phase" },
    { key: "is_requirement_description", label: "IS Requirement Description" },
    { key: "monitoring_control", label: "Monitoring / Control" },
    { key: "tools", label: "Tools" },
    { key: "artifacts", label: "Artifacts" },
    { key: "remarks", label: "Remarks" }
  ];

  const handleSingleEntrySave = async (field) => {
    try {
      await saveSingleEntry(field);
      alert("Saved successfully!");
    } catch (err) {
      console.error("Failed to save entry", err);
      alert("Failed to save");
    }
  };

  const colors = {
    green: "#0f766e",
    red: "#b91c1c"
  };

  const infoMessages = {
    projectIntroductionAndScope: () => (
      <div>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          Keep info {"<"}Give a brief introduction and back ground of the project such as start
          date and end date, limitations in current product/ circumstances leading to new product
          requirement...etc.{">"}
        </p>
        <p style={{ margin: 0 }}>
          {"<"}Briefly and clearly mention the scope of project in terms of various components,
          products/systems/software and its phases or parts of this which are intended to be
          developed as part of this project. Also mention if only development is involved or if it
          includes defect fixes/ enhancements from previous version of product…etc.{">"}
        </p>
      </div>
    ),
    productOverview: () => (
      <div>
        <p style={{ margin: 0 }}>
          Keep info {"<"}Mention the brief description of the product/component proposed for
          development, its intended usage and overall systems view if this product/component forms
          part of larger system {">"}
        </p>
      </div>
    ),
    projectDetails: () => (
      <div>
        <p style={{ margin: 0 }}>Keep info {"<"}Provide Details{">"}</p>
      </div>
    ),
    lifeCycleModel: () => (
      <div style={{ color: colors.green }}>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          Keep info {"<"}Mention the life cycle model to be used, the iterations or steps required
          to meet the scope…etc. with reasons/ justification. It should include
          product/software/system based on scope of project{">"}
        </p>
        <p style={{ margin: 0 }}>
          “Keep this in Green Color font” {"<"}For function safety project like ISO26262, Cyber
          security Project like ISO 21434 and IEC 62443 please refer the planning guideline document
          for life cycle model to be chosen for details{">"}
        </p>
      </div>
    ),
    assumptions: () => (
      <div>
        <p style={{ margin: 0 }}>
          Keep info {"<"}List assumptions made at the time of planning along with impact if it is
          subject to change{">"}
        </p>
      </div>
    ),
    constraints: () => (
      <div>
        <p style={{ margin: 0 }}>
          Keep info {"<"}List constraints considered or known at the time of planning along with
          impact{">"}
        </p>
      </div>
    ),
    dependencies: () => (
      <div>
        <p style={{ margin: 0 }}>
          Keep info {"<"}List dependencies considered or known at the time of planning along with
          impact{">"}
        </p>
      </div>
    ),
    businessContinuity: () => (
      <div>
        <p style={{ margin: 0 }}>
          Keep info {"<"}Add any additional requirements apart from the organisation Business
          Continuity plan{">"}
        </p>
      </div>
    ),
    cyberSecurityRequirementAndDesign: () => (
      <div style={{ color: colors.green }}>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          Keep heading and info All in green font {"<"} a) define cybersecurity specifications;
          NOTE 1 These can include the specification of cybersecurity-related components that are
          not present in the existing architectural design. b) verify that the defined cybersecurity
          specifications conform to the cybersecurity specifications from higher levels of
          architectural abstraction; c) identify weaknesses in the component; and NOTE 2
          Vulnerability analysis and management are described in Clause 8. d) provide evidence that
          the results of the implementation and integration of components conform to the
          cybersecurity specifications. {">"}
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>“For Cyber security design,”</p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          a) cybersecurity controls selected for implementation, if applicable; and
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          EXAMPLE 1 Use of a separate microcontroller with an embedded hardware trust anchor for
          secure key store functionality and isolation of the trust anchor regarding non-secure
          external connections.
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          NOTE 1 Cybersecurity controls can be selected from trusted catalogues.
        </p>
        <p style={{ margin: "0 0 0.5rem 0" }}>b) existing architectural design, if applicable</p>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          NOTE 2 Cybersecurity specifications include the specification of interfaces between
          sub-components of the defined architectural design related to the fulfilment of the defined
          cybersecurity requirements, including their usage, static and dynamic aspects.
        </p>
        <p style={{ margin: 0 }}>
          {"<"}Requirement specification template and High Level Design template from QMS needs to
          be used.{">"}
        </p>
      </div>
    ),
    cybersecurityCase: () => (
      <div style={{ color: colors.green }}>
        <p style={{ margin: "0 0 0.5rem 0" }}>
          {"<"} A cybersecurity case shall be created to provide the argument, supported by work
          products, for the achieved degree of cybersecurity. Cyber security case contains
          argumentation to support the claim that all objectives and requirements of ISO 21434 have
          been met. Use the Cyber Security Case template in QMS. NOTE: The argument can be implicit
          (i.e., if the argument is evident from the compiled set of work products an explicit
          argument can be omitted). In this scenario, the cybersecurity case contains the list of
          work products required by the cybersecurity plan{">"}
        </p>
      </div>
    ),
    functionalSafetyPlan: () => (
      <div style={{ color: colors.green }}>
        <p style={{ margin: 0 }}>
          {"<"}Define functional safety plan for the product. Reference of Safety plan to be
          mentioned here.{">"}
        </p>
      </div>
    ),
    informationSecurityRequirements: () => (
      <div style={{ color: colors.red }}>
        <p style={{ margin: 0 }}>
          Keep info {"<"}Information Security Requirements{">"}
        </p>
      </div>
    )
  };

  const getInfoText = (key) => (infoMessages[key] ? infoMessages[key]() : null);

  const buildSingleEntryItem = ({ field, label, infoKey }) => {
    const definition = singleEntryDefinitions[field];

    if (!definition) {
      return null;
    }

    return {
      id: `single-${field}`,
      label,
      type: "Single Entry",
      heading: false,
      render: () => (
        <>
          <SectionHeading as="h3" title={label} infoText={getInfoText(infoKey)} />
          <SingleEntryEditor
            key={field}
            definitions={[{ ...definition, label }]}
            values={singleEntryValues}
            loading={singleEntryLoading}
            isEditor={isEditor}
            onContentChange={updateSingleEntryContent}
            onImageChange={updateSingleEntryImage}
            onSave={handleSingleEntrySave}
            dirtyFields={{ [field]: singleEntryDirty[field] }}
          />
        </>
      )
    };
  };

  const buildTableItem = ({ id, label, infoKey, renderTable }) => ({
    id,
    label,
    type: "Table",
    heading: false,
    render: () => (
      <>
        <SectionHeading as="h3" title={label} infoText={getInfoText(infoKey)} />
        {renderTable()}
      </>
    )
  });

  const navigationItems = [
    buildSingleEntryItem({
      field: "reference_to_pis",
      label: "Project Introduction and Scope",
      infoKey: "projectIntroductionAndScope"
    }),
    buildSingleEntryItem({
      field: "product_overview",
      label: "Product Overview",
      infoKey: "productOverview"
    }),
    buildTableItem({
      id: "table-project-details",
      label: "Project Details",
      infoKey: "projectDetails",
      renderTable: () => (
        <DataTable
          columns={projectDetailColumns}
          data={projectDetails}
          onAdd={handleAddProjectDetail}
          onEdit={handleEditProjectDetail}
          onDelete={handleDeleteProjectDetail}
          isEditor={isEditor}
          addButtonText="Add in Project Details"
          maxRows={1}
          addDisabledMessage="Only one project details entry can be added"
        />
      )
    }),
    buildSingleEntryItem({
      field: "life_cycle_model",
      label: "Life Cycle Model",
      infoKey: "lifeCycleModel"
    }),
    buildTableItem({
      id: "table-assumptions",
      label: "Assumptions",
      infoKey: "assumptions",
      renderTable: () => (
        <DataTable
          columns={assumptionColumns}
          data={assumptions}
          onAdd={handleAddAssumption}
          onEdit={handleEditAssumption}
          onDelete={handleDeleteAssumption}
          isEditor={isEditor}
          addButtonText="Add in Assumptions"
          uniqueKeys={["sl_no"]}
        />
      )
    }),
    buildTableItem({
      id: "table-constraints",
      label: "Constraints",
      infoKey: "constraints",
      renderTable: () => (
        <DataTable
          columns={constraintColumns}
          data={constraints}
          onAdd={handleAddConstraint}
          onEdit={handleEditConstraint}
          onDelete={handleDeleteConstraint}
          isEditor={isEditor}
          addButtonText="Add in Constraints"
          uniqueKeys={["constraint_no"]}
        />
      )
    }),
    buildTableItem({
      id: "table-dependencies",
      label: "Dependencies",
      infoKey: "dependencies",
      renderTable: () => (
        <DataTable
          columns={dependencyColumns}
          data={dependencies}
          onAdd={handleAddDependency}
          onEdit={handleEditDependency}
          onDelete={handleDeleteDependency}
          isEditor={isEditor}
          addButtonText="Add in Dependencies"
          uniqueKeys={["sl_no"]}
        />
      )
    }),
    buildTableItem({
      id: "table-business-continuity",
      label: "Business Continuity",
      infoKey: "businessContinuity",
      renderTable: () => (
        <DataTable
          columns={businessContinuityColumns}
          data={businessContinuity}
          onAdd={async (newData) => {
            await axios.post(`${API}/projects/${projectId}/sections/M4/tables/business_continuity`, {
              data: newData
            });
            fetchData();
          }}
          onEdit={async (id, updatedData) => {
            const { id: _, project_id, section, table_name, ...rowData } = updatedData;
            await axios.put(
              `${API}/projects/${projectId}/sections/M4/tables/business_continuity/${id}`,
              { data: rowData }
            );
            fetchData();
          }}
          onDelete={async (id) => {
            if (!window.confirm("Delete this row?")) return;
            await axios.delete(
              `${API}/projects/${projectId}/sections/M4/tables/business_continuity/${id}`
            );
            fetchData();
          }}
          isEditor={isEditor}
          addButtonText="Add in Business Continuity"
          uniqueKeys={["sl_no"]}
        />
      )
    }),
    buildSingleEntryItem({
      field: "cyber_security_requirements_design_model",
      label: "CyberSecurtiy Requikrement and Design",
      infoKey: "cyberSecurityRequirementAndDesign"
    }),
    buildSingleEntryItem({
      field: "cybersecurity_case",
      label: "Cybersecurty Case",
      infoKey: "cybersecurityCase"
    }),
    buildSingleEntryItem({
      field: "functional_safety_plan",
      label: "Functional Safety Plan",
      infoKey: "functionalSafetyPlan"
    }),
    buildTableItem({
      id: "table-information-security",
      label: "Information Security Requirements",
      infoKey: "informationSecurityRequirements",
      renderTable: () => (
        <DataTable
          columns={infoSecurityColumns}
          data={informationSecurityRequirements}
          onAdd={async (newData) => {
            await axios.post(
              `${API}/projects/${projectId}/sections/M4/tables/information_security_requirements`,
              { data: newData }
            );
            fetchData();
          }}
          onEdit={async (id, updatedData) => {
            const { id: _, project_id, section, table_name, ...rowData } = updatedData;
            await axios.put(
              `${API}/projects/${projectId}/sections/M4/tables/information_security_requirements/${id}`,
              { data: rowData }
            );
            fetchData();
          }}
          onDelete={async (id) => {
            if (!window.confirm("Delete this row?")) return;
            await axios.delete(
              `${API}/projects/${projectId}/sections/M4/tables/information_security_requirements/${id}`
            );
            fetchData();
          }}
          isEditor={isEditor}
          addButtonText="Add in Information Security Requirements"
          uniqueKeys={["sl_no"]}
        />
      )
    })
  ].filter(Boolean);

  return (
    <SectionLayout
      title="Project Overview & Requirements"
      sectionId={sectionId}
      sectionLabel={sectionName}
      projectId={projectId}
      items={navigationItems}
    />
  );
};

export default M4ProjectOverview;
