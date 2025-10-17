import React from "react";
import { deriveOpportunityValue, getOpportunityValueClassName } from "./utils/opportunityValue";

const deriveRiskExposureValue = (row = {}) => {
  const probability = Number(row?.probability);
  const impact = Number(row?.impact);

  if (Number.isFinite(probability) && Number.isFinite(impact)) {
    const product = probability * impact;
    return Number.isFinite(product) ? String(product) : "";
  }

  return "";
};

export const SECTION_CONFIG = {
  M4: {
    title: "Extended Plans & Security",
    singleEntries: [
      { field: "reference_to_pis", label: "Project Introduction and Scope" },
      { field: "product_overview", label: "Product Overview" },
      {
        field: "life_cycle_model",
        label: "Life Cycle Model",
        supportsImage: true,
        description: "Upload diagrams or provide descriptive details for the selected lifecycle model."
      },
      {
        field: "cyber_security_requirements_design_model",
        label: "Cyber Security Requirements Design Model"
      },
      { field: "cybersecurity_case", label: "Cybersecurity Case" },
      { field: "functional_safety_plan", label: "Functional Safety Plan" }
    ],
    tables: []
  },
  M5: {
    title: "Resource Planning Extensions",
    singleEntries: [
      {
        field: "organization_structure",
        label: "Organization Structure",
        supportsImage: true,
        description: "Outline the organisation hierarchy supporting the project."
      },
      {
        field: "summary_estimates_assumptions",
        label: "Summary of Estimates & Assumptions"
      }
    ],
    tables: [
      {
        key: "human_resource_and_special_training_plan",
        title: "Human Resource & Special Training Plan",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "role", label: "Role" },
          { key: "skill_experience_required", label: "Skill / Experience Required" },
          { key: "no_of_people_required", label: "No. of People Required" },
          { key: "available", label: "Available" },
          { key: "project_specific_training_needs", label: "Project Specific Training Needs" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "environment_and_tools",
        title: "Environment & Tools",
        columns: [
          { key: "sl_no", label: "Sl. No." },
          {
            key: "name_brief_description",
            label: "Name/Brief description of H/W, System, S/W or tool"
          },
          { key: "no_of_licenses_required", label: "No. of licenses required" },
          {
            key: "source",
            label:
              "Source (Organisation Standard, Customer Supplied, Purchase, Remote Access)"
          },
          {
            key: "status",
            label: "Status (Available or to be Purchased)"
          },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "build_buy_reuse",
        title: "Build / Buy / Reuse",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "component_product", label: "Component / Product" },
          { key: "build_buy_reuse", label: "Build / Buy / Reuse" },
          { key: "reuse_goals_objectives", label: "Reuse Goals & Objectives" },
          { key: "vendor_project_name_version", label: "Vendor / Project / Version" },
          { key: "responsible_person_reuse", label: "Responsible Person (Reuse)" },
          { key: "quality_evaluation_criteria", label: "Quality Evaluation Criteria" },
          { key: "responsible_person_qualification", label: "Responsible Person Qualification" },
          { key: "modifications_planned", label: "Modifications Planned" },
          { key: "selected_item_operational_environment", label: "Operational Environment" },
          {
            key: "known_defect_vulnerabilities_limitations",
            label: "Known Defects / Vulnerabilities / Limitations"
          }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "reuse_analysis",
        title: "Reuse Analysis",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "component_product", label: "Component / Product" },
          { key: "reuse", label: "Reuse" },
          { key: "modifications_required", label: "Modifications Required" },
          { key: "constraints_for_reuse", label: "Constraints for Reuse" },
          { key: "risk_analysis_result", label: "Risk Analysis Result" },
          { key: "impact_on_plan_activities", label: "Impact on Plan / Activities" },
          {
            key: "evaluation_to_comply_cyber_security",
            label: "Evaluation to Comply Cyber Security"
          },
          {
            key: "impact_on_integration_documents",
            label: "Impact on Integration Documents"
          },
          { key: "known_defects", label: "Known Defects" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "size_and_complexity",
        title: "Size & Complexity",
        columns: [
          { key: "sl_no", label: "Sl. No." },
          { key: "product_component_module", label: "Product / Component / Module" },
          { key: "size_kloc", label: "Size (KLOC)" },
          { key: "percent_reuse_estimated", label: "Percent Re-Use Estimated" },
          {
            key: "effort_person_days_weeks_months",
            label: "Effort (in Person Days / Weeks / Months)"
          },
          { key: "complexity", label: "Complexity (High, Medium, Low)" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "duration_effort_estimate_organization_norms",
        title: "Duration & Effort Estimate (Org Norms)",
        columns: [
          { key: "phase_milestone", label: "Phase / Milestone" },
          { key: "schedule_days_weeks", label: "Schedule (Days / Weeks)" },
          { key: "effort_person_days_weeks", label: "Effort (Person Days / Weeks)" },
          { key: "remarks_on_deviation", label: "Remarks on Deviation" }
        ],
        uniqueFields: ["phase_milestone"]
      },
      {
        key: "usage_of_off_the_shelf_component",
        title: "Usage of Off-the-Shelf Component",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "name_of_component", label: "Name of Component" },
          { key: "requirements_complied", label: "Requirements Complied" },
          { key: "requirement_document_updated", label: "Requirement Document Updated" },
          { key: "specific_application_context", label: "Specific Application Context" },
          { key: "documentation_sufficient", label: "Documentation Sufficient" },
          { key: "vulnerabilities_identified", label: "Vulnerabilities Identified" },
          { key: "integration_document_updated", label: "Integration Document Updated" },
          { key: "test_design_document", label: "Test Design Document" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "cybersecurity_interface_agreement",
        title: "Cybersecurity Interface Agreement",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "phase", label: "Phase" },
          { key: "work_product", label: "Work Product" },
          { key: "document_ref", label: "Document Ref" },
          { key: "supplier", label: "Supplier" },
          { key: "customer", label: "Customer" },
          { key: "level_of_confidentiality", label: "Level of Confidentiality" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      }
    ]
  },
  M6: {
    title: "Monitoring & Control",
    singleEntries: [
      { field: "transition_plan", label: "Transition Plan" }
    ],
    tables: [
      {
        key: "project_monitoring_and_control",
        title: "Project Monitoring & Control",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          {
            key: "type_of_progress_reviews",
            label: "Type of Progress Reviews",
            options: [
              "<Internal Team reviews>",
              "<DR1/Q1>",
              "<DR2>",
              "<DR3>",
              "<DR4/Q2>",
              "<DR5/Q3>",
              "<Metrics reporting>",
              "Client interactions (T-Con, Video Con...etc.)",
              "Process compliance index audits",
              "Internal audits",
              "Incident Report and Audit*"
            ],
            placeholderOption: "Select type of progress review"
          },
          { key: "month_phase_milestone_frequency", label: "Month / Phase / Milestone / Frequency" },
          { key: "participants", label: "Participants" },
          { key: "remarks", label: "Remarks" },
          { key: "mode_of_communication", label: "Mode of Communication" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "quantitative_objectives_measurement_and_data_management_plan",
        title: "Quantitative Objectives, Measurement & Data Management Plan",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "objective", label: "Objective" },
          { key: "metric", label: "Metric" },
          { key: "priority", label: "Priority" },
          { key: "project_goal", label: "Project Goal" },
          { key: "organisation_norm", label: "Organisation Norm" },
          { key: "data_source", label: "Data Source" },
          {
            key: "reason_for_deviation_from_organization_norm",
            label: "Reason for Deviation"
          }
        ],
        uniqueFields: ["objective"]
      }
    ]
  },
  M7: {
    title: "Quality Management",
    singleEntries: [
      { field: "supplier_evaluation_capability", label: "Supplier Evaluation Capability" },
      {
        field: "cyber_security_assessment_and_release",
        label: "Cyber Security Assessment & Release"
      }
    ],
    tables: [
      {
        key: "standards_qm",
        title: "Standards",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "name_of_standard", label: "Name of Standard" },
          { key: "brief_description", label: "Brief Description" },
          { key: "source", label: "Source" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "verification_and_validation_plan",
        title: "Verification & Validation Plan",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "artifact_name", label: "Artifact Name" },
          { key: "verification_method", label: "Verification Method" },
          { key: "verification_type", label: "Verification Type" },
          { key: "validation_method", label: "Validation Method" },
          { key: "validation_type", label: "Validation Type" },
          { key: "tools_used", label: "Tools Used" },
          { key: "approving_authority", label: "Approving Authority" },
          { key: "verification_validation_evidence", label: "Verification & Validation Evidence" },
          { key: "remarks_deviation", label: "Remarks / Deviation" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "confirmation_review_plan",
        title: "Confirmation Review Plan",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "artifact_name", label: "Artifact Name" },
          { key: "phase", label: "Phase" },
          { key: "confirmation_measure", label: "Confirmation Measure" },
          { key: "plan_schedule", label: "Plan / Schedule" },
          { key: "asil", label: "ASIL" },
          { key: "independence_level", label: "Independence Level" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "proactive_causal_analysis_plan",
        title: "A) Explorative Based (Proactive Causal Analysis Plan)",
        columns: [
          { key: "sl_no", label: "Sl. No." },
          {
            key: "previous_similar_projects_executed",
            label: "Previous Similar Projects Executed"
          },
          {
            key: "major_issues_defects_identified_by_customer",
            label: "Major Issues / Defects Identified by Customer"
          },
          {
            key: "corrective_preventive_measures",
            label: "Corrective or Preventive Measures"
          }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "reactive_causal_analysis_plan",
        title: "B) During Project Execution (Reactive Causal Analysis Plan)",
        columns: [
          { key: "sl_no", label: "Sl. No." },
          { key: "phase_milestone", label: "Phase / Milestone" },
          {
            key: "brief_description_of_instances_when_causal_analysis_needs_to_be_done",
            label: "Brief Description of Instances When Causal Analysis Needs to Be Done"
          },
          {
            key: "causal_analysis_method_tool",
            label: "Tool (e.g., 5 Why Technique, Cause-Effect Diagram)"
          },
          { key: "responsibility", label: "Responsibility" }
        ],
        uniqueFields: ["sl_no"]
      }
    ]
  },
  M8: {
    title: "Decision Management & Release",
    tables: [
      {
        key: "decision_management_plan",
        title: "Decision Management Plan",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "phase_milestone", label: "Phase / Milestone" },
          {
            key: "brief_description_of_major_decisions",
            label: "Brief Description of Major Decisions"
          },
          { key: "decision_making_method_tool", label: "Decision Making Method / Tool" },
          { key: "responsibility", label: "Responsibility" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "tailoring_qms",
        title: "Tailoring QMS",
        columns: [
          { key: "sl_no", label: "Sl. No." },
          { key: "brief_description_of_deviation", label: "Brief description of Tailoring" },
          { key: "gap_analysis_details", label: "Gap analysis details" },
          { key: "reasons_justifications", label: "Reasons / Justifications" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "deviations",
        title: "Deviations",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "brief_description_of_deviation", label: "Brief Description of Deviation" },
          { key: "reasons_justifications", label: "Reasons / Justifications" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "product_release_plan",
        title: "Product Release Plan",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "release_type", label: "Release Type" },
          { key: "objective", label: "Objective" },
          { key: "release_date_milestones", label: "Release Date / Milestones" },
          { key: "mode_of_delivery", label: "Mode of Delivery" },
          { key: "qa_release_audit_date", label: "QA Release Audit Date" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "tailoring_due_to_component_out_of_context",
        title: "Tailoring due to Component Out of Context",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          {
            key: "name_of_the_out_of_context_component",
            label: "Out-of-Context Component"
          },
          {
            key: "name_of_the_cyber_security_requirements_impacted",
            label: "Impacted Cyber Security Requirements"
          },
          { key: "external_interfaces_document", label: "External Interfaces Document" },
          { key: "impact_on_cyber_security_claims", label: "Impact on Cyber Security Claims" },
          { key: "impact_on_cyber_security_assumptions", label: "Impact on Cyber Security Assumptions" },
          {
            key: "validations_of_requirement_assumption_and_claims_are_done",
            label: "Validations Completed"
          },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "release_cybersecurity_interface_agreement",
        title: "Release Cybersecurity Interface Agreement",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "phase", label: "Phase" },
          { key: "work_product", label: "Work Product" },
          { key: "document_ref", label: "Document Ref" },
          { key: "supplier", label: "Supplier" },
          { key: "customer", label: "Customer" },
          { key: "level_of_confidentiality", label: "Level of Confidentiality" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      }
    ]
  },
  M9: {
    title: "Risk Management",
    tables: [
      {
        key: "risk_management_plan",
        title: "Risk Management Plan",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "risk_identification_method", label: "Risk Identification Method" },
          { key: "phase_sprint_milestone", label: "Phase / Sprint / Milestone" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"],
        preventDuplicateRows: true
      },
      {
        key: "risk_mitigation_and_contingency",
        title: "Risk Mitigation & Contingency",
        columns: [
          { key: "risk_id", label: "Risk ID", numericOnly: true },
          { key: "risk_description", label: "Risk Description" },
          {
            key: "risk_category",
            label: "Risk Category",
            options: [
              "Product Engineering Risk",
              "Development Environment risks",
              "Program Constraints",
              "Information Security",
              "Supplier Engagement"
            ]
          },
          { key: "risk_originator_name", label: "Risk Originator" },
          {
            key: "risk_source",
            label: "Risk Source",
            options: [
              "Acceptance Testing",
              "Coding and Unit testing",
              "Compliance to Standard/s",
              "Development System",
              "Engineering Specialities",
              "Hardware Availability / Procurement",
              "Hardware Development Process",
              "Hardware Software Interface Specification",
              "Information Security",
              "Integration Testing",
              "Management Methods",
              "Management Process",
              "Program Interfaces related",
              "Requirements Specification",
              "Resources related",
              "Safety Qualification",
              "Software Development Process",
              "Supplier Contract",
              "Supplier Engagement",
              "System Development Process",
              "Work environment"
            ]
          },
          { key: "date_of_risk_identification", label: "Date of Identification" },
          {
            key: "phase_of_risk_identification",
            label: "Phase of Identification",
            options: [
              "Requirement",
              "Planning",
              "Design",
              "Coding",
              "Unit Testing",
              "System Testing",
              "Integration Testing",
              "Sprint Planning",
              "Backlog Refinement",
              "Sprint Execution",
              "Sprint Review",
              "Sprint Retrospective",
              "HardwareDesignSpecification",
              "HardwareRequirementsSpecification",
              "HardwareSoftwareInterfaceSpecification",
              "HardwareIntegrationTestReport",
              "HARA",
              "SafetyConcept",
              "SystemArchitecturalDesignSpecification",
              "SystemRequirementsSpecification",
              "SystemIntegrationTestReport",
              "SystemQualificationTestReport",
              "Training Planning",
              "Training Implementation",
              "Training Evaluation",
              "Others"
            ]
          },
          {
            key: "risk_treatment_option",
            label: "Risk Treatment Option",
            options: [
              "Avoidance",
              "Reduction",
              "Sharing",
              "Acceptance",
              "Transfer"
            ],
            placeholderOption: "Select risk treatment"
          },
          {
            key: "rationale_to_choose_risk_treatment_option",
            label: "Rationale"
          },
          { key: "effort_required_for_risk_treatment", label: "Effort Required" },
          { key: "risk_treatment_schedule", label: "Risk Treatment Schedule" },
          {
            key: "success_criteria_for_risk_treatment_activities",
            label: "Success Criteria"
          },
          {
            key: "criteria_for_cancellation_of_risk_treatment_activities",
            label: "Cancellation Criteria"
          },
          {
            key: "frequency_of_monitoring_risk_treatment_activities",
            label: "Monitoring Frequency"
          },
          { key: "threshold", label: "Threshold" },
          { key: "trigger", label: "Trigger" },
          {
            key: "probability",
            label: "Probability",
            options: ["1", "2", "3"],
            placeholderOption: "Select probability"
          },
          {
            key: "impact",
            label: "Impact",
            options: ["1", "2", "3"],
            placeholderOption: "Select impact"
          },
          {
            key: "risk_exposure",
            label: "Risk Exposure",
            readOnly: true,
            deriveValue: deriveRiskExposureValue,
            renderDisplay: (_, row) => deriveRiskExposureValue(row) || "-"
          },
          { key: "mitigation_plan", label: "Mitigation Plan" },
          { key: "contingency_plan", label: "Contingency Plan" },
          {
            key: "verification_methods_for_mitigation_contingency_plan",
            label: "Verification Methods"
          },
          { key: "list_of_stakeholders", label: "List of Stakeholders" },
          { key: "responsibility", label: "Responsibility" },
          {
            key: "status",
            label: "Status",
            options: [
              "Under Observation",
              "Mitigated",
              "Contingency Activated",
              "Not Occured",
              "Closed",
              "Residual Risk"
            ]
          },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["risk_id"]
      },
      {
        key: "risk_exposure_history",
        title: "Risk Exposure History",
        columns: [
          { key: "risk", label: "Risk" },
          { key: "date", label: "Date" },
          { key: "exposure_value", label: "Exposure Value" }
        ]
      }
    ]
  },
  M10: {
    title: "Opportunity Management",
    tables: [
      {
        key: "opportunity_register",
        title: "Opportunity Register",
        columns: [
          { key: "opportunity_id", label: "Opportunity ID", numericOnly: true },
          { key: "opportunity_description", label: "Description" },
          {
            key: "opportunity_category",
            label: "Opportunity Category",
            options: [
              "Product Engineering",
              "Development Environment",
              "Program Constraints",
              "Information Security",
              "Supplier Engagement"
            ]
          },
          {
            key: "opportunity_source",
            label: "Opportunity Source",
            options: [
              "Acceptance Testing",
              "Coding and Unit testing",
              "Compliance to Standard/s",
              "Development System",
              "Engineering Specialities",
              "Hardware Availability / Procurement",
              "Hardware Development Process",
              "Hardware Software Interface Specification",
              "Information Security",
              "Integration Testing",
              "Management Methods",
              "Management Process",
              "Program Interfaces related",
              "Requirements Specification",
              "Resources related",
              "Safety Qualification",
              "Software Development Process",
              "Supplier Contract",
              "Supplier Engagement",
              "System Development Process",
              "Work environment"
            ]
          },
          { key: "date_of_identification", label: "Date of Identification" },
          {
            key: "phase_of_identification",
            label: "Phase of Identification",
            options: [
              "Requirement",
              "Planning",
              "Design",
              "Coding",
              "Unit Testing",
              "System Testing",
              "Integration Testing",
              "Sprint Planning",
              "Backlog Refinement",
              "Sprint Execution",
              "Sprint Review",
              "Sprint Retrospective",
              "HardwareDesignSpecification",
              "HardwareRequirementsSpecification",
              "HardwareSoftwareInterfaceSpecification",
              "HardwareIntegrationTestReport",
              "HARA",
              "SafetyConcept",
              "SystemArchitecturalDesignSpecification",
              "SystemRequirementsSpecification",
              "SystemIntegrationTestReport",
              "SystemQualificationTestReport",
              "Training Planning",
              "Training Implementation",
              "Training Evaluation",
              "Others"
            ]
          },
          {
            key: "cost",
            label: "Cost",
            numericOnly: true,
            options: ["1", "2", "3"]
          },
          {
            key: "benefit",
            label: "Benefit",
            numericOnly: true,
            options: ["1", "2", "3"]
          },
          {
            key: "opportunity_value",
            label: "Opportunity Value",
            readOnly: true,
            deriveValue: deriveOpportunityValue,
            renderDisplay: (_, row) => {
              const derivedValue = deriveOpportunityValue(row);
              const displayValue = derivedValue || row?.opportunity_value || "";

              if (!displayValue) {
                return "-";
              }

              const badgeClassName = [
                "opportunity-value-badge",
                getOpportunityValueClassName(displayValue)
              ]
                .filter(Boolean)
                .join(" ");

              return React.createElement("span", { className: badgeClassName }, displayValue);
            }
          },
          {
            key: "leverage_plan_to_maximize_opportunities_identified",
            label: "Leverage Plan"
          },
          { key: "responsibility", label: "Responsibility" },
          {
            key: "status",
            label: "Status",
            options: [
              "Under Observation",
              "In progress",
              "Not Occurred",
              "Opportunity Leveraged",
              "Closed"
            ]
          },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["opportunity_id"]
      },
      {
        key: "opportunity_management_plan",
        title: "Opportunity Management Plan",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "opportunity_identification_method", label: "Identification Method" },
          { key: "phase_sprint_milestone", label: "Phase / Sprint / Milestone" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"],
        preventDuplicateRows: true
      },
      {
        key: "opportunity_value_history",
        title: "Opportunity Value History",
        columns: [
          { key: "opportunity", label: "Opportunity" },
          { key: "date", label: "Date" },
          { key: "opportunity_value", label: "Opportunity Value" }
        ]
      }
    ]
  },
  M11: {
    title: "Configuration Management",
    singleEntries: [
      {
        field: "configuration_management_tools",
        label: "Configuration Management Tools",
        description: "List the configuration management tools and repositories used."
      },
      {
        field: "location_of_ci",
        label: "Location of CI",
        supportsImage: true,
        description: "Upload diagrams or photos that show where configuration items are stored."
      },
      { field: "versioning", label: "Versioning" },
      { field: "baselining", label: "Baselining" },
      { field: "change_management_plan", label: "Change Management Plan" },
      { field: "backup_and_retrieval", label: "Backup & Retrieval" },
      { field: "recovery", label: "Recovery" },
      { field: "release_mechanism", label: "Release Mechanism" },
      { field: "information_retention_plan", label: "Information Retention Plan" },
      {
        field: "configuration_status_accounting_notes",
        label: "Configuration Status Accounting Notes",
        inlineWithTable: "configuration_status_accounting",
        description: "Summarize key updates or decisions recorded in the status accounting log."
      },
      {
        field: "configuration_management_audit_notes",
        label: "Configuration Management Audit Notes",
        inlineWithTable: "configuration_management_audit",
        description: "Capture follow-up actions or observations from the latest configuration audits."
      }
    ],
    tables: [
      {
        key: "list_of_configuration_items",
        title: "List of Configuration Items",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "ci_name_description", label: "CI Name / Description" },
          { key: "source", label: "Source" },
          { key: "format_type", label: "Format / Type" },
          { key: "description_of_level", label: "Description of Level" },
          { key: "branching_merging_required", label: "Branching / Merging Required" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "list_of_non_configurable_items",
        title: "List of Non-Configurable Items",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "ci_name_description", label: "Item Name / Description" },
          { key: "source", label: "Source" },
          { key: "format_type", label: "Format / Type" },
          { key: "description_of_level", label: "Description of Level" },
          { key: "branching_merging_required", label: "Branching / Merging Required" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "naming_convention",
        title: "Naming Convention",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "files_and_folders", label: "Files & Folders" },
          { key: "naming_convention", label: "Naming Convention" },
          { key: "name_of_ci", label: "Name of CI" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "branching_and_merging",
        title: "Branching & Merging",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "branch_convention", label: "Branch Convention" },
          { key: "phase", label: "Phase" },
          { key: "branch_name", label: "Branch Name" },
          { key: "risk_associated_with_branching", label: "Risk Associated" },
          { key: "verification", label: "Verification" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "labelling_baselines",
        title: "Labelling Baselines",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "ci", label: "CI" },
          {
            key: "planned_baseline_phase_milestone_date",
            label: "Planned Baseline Phase / Milestone / Date",
            inputType: "text"
          },
          { key: "criteria_for_baseline", label: "Criteria for Baseline" },
          { key: "baseline_name_label_or_tag", label: "Baseline Name / Label / Tag" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "labelling_baselines2",
        title: "Labelling Baselines (Branches)",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "branch_convention", label: "Branch Convention" },
          { key: "phase", label: "Phase" },
          { key: "branch_name_tag", label: "Branch Name / Tag" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "configuration_control",
        title: "Configuration Control",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "ci_or_folder_name_path", label: "CI / Folder Path" },
          { key: "developer_role", label: "Developer Role" },
          { key: "team_leader_role", label: "Team Leader Role" },
          { key: "em_role", label: "EM Role" },
          { key: "ed_role", label: "ED Role" },
          { key: "qa_role", label: "QA Role" },
          { key: "ccb_member", label: "CCB Member" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "configuration_control_board",
        title: "Configuration Control Board",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "ccb_members_name", label: "CCB Member Name" },
          { key: "role", label: "Role" },
          { key: "remarks_need_for_inclusion", label: "Remarks / Need for Inclusion" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "configuration_status_accounting",
        title: "Configuration Status Accounting",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "phase_milestone_month", label: "Phase / Milestone / Month" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "configuration_management_audit",
        title: "Configuration Management Audit",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "phase_milestone_month", label: "Phase / Milestone / Month" }
        ],
        uniqueFields: ["sl_no"]
      }
    ]
  },
  M13: {
    title: "Supplier Agreement Management",
    singleEntries: [
      {
        field: "supplier_project_introduction_and_scope",
        label: "Supplier Project Introduction & Scope"
      },
      { field: "support_project_plan", label: "Support Project Plan" },
      {
        field: "supplier_configuration_management_plan",
        label: "Supplier Configuration Management Plan"
      },
      { field: "sam_location_of_ci", label: "Location of CI (Supplier)" },
      { field: "sam_versioning", label: "Versioning (Supplier)" },
      { field: "sam_baselining", label: "Baselining (Supplier)" },
      { field: "sam_change_management_plan", label: "Change Management Plan (Supplier)" },
      {
        field: "sam_configuration_management_audit",
        label: "Configuration Management Audit (Supplier)"
      },
      { field: "sam_backup", label: "Backup (Supplier)" },
      { field: "sam_release_mechanism", label: "Release Mechanism (Supplier)" },
      {
        field: "sam_information_retention_plan",
        label: "Information Retention Plan (Supplier)"
      },
      {
        field: "supplier_acceptance_criteria",
        label: "Supplier Acceptance Criteria"
      },
      { field: "transition_plan", label: "Transition Plan" }
    ],
    tables: [
      {
        key: "sam_assumptions",
        title: "SAM Assumptions",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "brief_description", label: "Brief Description" },
          { key: "impact_on_project_objectives", label: "Impact on Project Objectives" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "sam_constraints",
        title: "SAM Constraints",
        columns: [
          { key: "constraint_no", label: "Sl. No" },
          { key: "brief_description", label: "Brief Description" },
          { key: "impact_on_project_objectives", label: "Impact on Project Objectives" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["constraint_no"]
      },
      {
        key: "sam_dependencies",
        title: "SAM Dependencies",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "brief_description", label: "Brief Description" },
          { key: "impact_on_project_objectives", label: "Impact on Project Objectives" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "sam_risks",
        title: "SAM Risks",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "brief_description", label: "Brief Description" },
          { key: "impact_of_project_objectives", label: "Impact on Project Objectives" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "sam_status_reporting_and_communication_plan",
        title: "Status Reporting & Communication Plan",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "type_of_progress_reviews", label: "Type of Progress Reviews" },
          {
            key: "month_phase_milestone_frequency",
            label: "Month / Phase / Milestone / Frequency"
          },
          { key: "participants", label: "Participants" },
          { key: "remarks", label: "Remarks" }
        ],
        prefillRows: [
          { sl_no: "1", type_of_progress_reviews: "Internal Team reviews" },
          { sl_no: "2", type_of_progress_reviews: "Metrics reporting" },
          { sl_no: "3", type_of_progress_reviews: "Process compliance index audits" },
          { sl_no: "4", type_of_progress_reviews: "Supplier audits" },
          { sl_no: "5", type_of_progress_reviews: "Management Review" },
          { sl_no: "6", type_of_progress_reviews: "Others (specify)" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "sam_quantitative_objectives_measurement_and_data_management_plan",
        title: "Quantitative Objectives & Data Management Plan",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "objective", label: "Objective" },
          { key: "metric", label: "Metric" },
          { key: "project_goal", label: "Project Goal" },
          { key: "organisation_norm", label: "Organisation Norm" },
          { key: "data_source", label: "Data Source" },
          {
            key: "reason_for_deviation_from_organization_norm",
            label: "Reason for Deviation"
          },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "sam_verification_and_validation_plan",
        title: "Verification & Validation Plan (Supplier)",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "work_product", label: "Work Product" },
          { key: "verification_method", label: "Verification Method" },
          { key: "validation_method", label: "Validation Method" },
          { key: "approving_authority", label: "Approving Authority" },
          { key: "remarks_for_deviation", label: "Remarks for Deviation" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "tailoring_sam",
        title: "Tailoring SAM",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "brief_description_of_deviation", label: "Brief Description of Deviation" },
          { key: "reasons_justifications", label: "Reasons / Justifications" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "sam_deviations",
        title: "SAM Deviations",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "brief_description_of_deviation", label: "Brief Description of Deviation" },
          { key: "reasons_justifications", label: "Reasons / Justifications" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "sam_product_release_plan",
        title: "SAM Product Release Plan",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "release_type", label: "Release Type" },
          { key: "objective", label: "Objective" },
          { key: "release_date_milestones", label: "Release Date / Milestones" },
          { key: "remarks", label: "Remarks" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "sam_labelling_baselines",
        title: "SAM Labelling Baselines",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "ci", label: "CI" },
          { key: "planned_baseline_phase_milestone_date", label: "Planned Baseline Phase / Milestone / Date" },
          { key: "criteria_for_baseline", label: "Criteria for Baseline" },
          { key: "baseline_name_label_or_tag", label: "Baseline Name / Label / Tag" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "sam_labelling_baselines2",
        title: "SAM Labelling Baselines (Branches)",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "branch_convention", label: "Branch Convention" },
          { key: "phase", label: "Phase" },
          { key: "branch_name_tag", label: "Branch Name / Tag" }
        ],
        uniqueFields: ["sl_no"]
      },
      {
        key: "sam_configuration_control",
        title: "SAM Configuration Control",
        columns: [
          { key: "sl_no", label: "Sl. No" },
          { key: "ci_or_folder_name_path", label: "CI / Folder Path" },
          { key: "developer_role", label: "Developer Role" },
          { key: "team_leader_role", label: "Team Leader Role" },
          { key: "pm_role", label: "PM Role" },
          { key: "pgm_dh_role", label: "PGM / DH Role" },
          { key: "qa_role", label: "QA Role" },
          { key: "ccb_member", label: "CCB Member" }
        ],
        uniqueFields: ["sl_no"]
      }
    ]
  }
};
