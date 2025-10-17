import React, { useMemo } from "react";
import HorizontalBarChart from "./charts/HorizontalBarChart";

const PHASE_DEFINITIONS = [
  { key: "requirement", label: "Requirement" },
  { key: "planning", label: "Planning" },
  { key: "design", label: "Design" },
  { key: "coding", label: "Coding" },
  { key: "unittesting", label: "Unit Testing" },
  { key: "systemtesting", label: "System Testing" },
  { key: "integrationtesting", label: "Integration Testing" },
  { key: "sprintplanning", label: "Sprint Planning" },
  { key: "backlogrefinement", label: "Backlog Refinement" },
  { key: "sprintexecution", label: "Sprint Execution" },
  { key: "sprintreview", label: "Sprint Review" },
  { key: "sprintretrospective", label: "Sprint Retrospective" },
  { key: "hardwaredesignspecification", label: "HardwareDesignSpecification" },
  {
    key: "hardwarerequirementsspecification",
    label: "HardwareRequirementsSpecification"
  },
  {
    key: "hardwaresoftwareinterfacespecification",
    label: "HardwareSoftwareInterfaceSpecification"
  },
  { key: "hardwareintegrationtestreport", label: "HardwareIntegrationTestReport" },
  { key: "hara", label: "HARA" },
  { key: "safetyconcept", label: "SafetyConcept" },
  {
    key: "systemarchitecturaldesignspecification",
    label: "SystemArchitecturalDesignSpecification"
  },
  { key: "systemrequirementsspecification", label: "SystemRequirementsSpecification" },
  { key: "systemintegrationtestreport", label: "SystemIntegrationTestReport" },
  { key: "systemqualificationtestreport", label: "SystemQualificationTestReport" },
  { key: "trainingplanning", label: "Training Planning" },
  { key: "trainingimplementation", label: "Training Implementation" },
  { key: "trainingevaluation", label: "Training Evaluation" },
  { key: "others", label: "Others" }
];

const normalizePhaseValue = (value) => {
  if (!value) return "";
  return value
    .toString()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
};

const OpportunityPhaseInsightTable = ({ opportunityRegister = [] }) => {
  const { rows, total } = useMemo(() => {
    const counts = PHASE_DEFINITIONS.reduce((acc, phase) => {
      acc[phase.key] = 0;
      return acc;
    }, {});

    opportunityRegister.forEach((opportunity) => {
      const normalized = normalizePhaseValue(opportunity?.phase_of_identification);
      const matched = normalized
        ? PHASE_DEFINITIONS.find((phase) => phase.key === normalized)
        : null;

      const targetKey = matched ? matched.key : "others";
      counts[targetKey] = (counts[targetKey] || 0) + 1;
    });

    const orderedRows = PHASE_DEFINITIONS.map((phase) => ({
      key: phase.key,
      label: phase.label,
      count: counts[phase.key] || 0
    }));

    const totalCount = orderedRows.reduce((sum, phase) => sum + phase.count, 0);

    return { rows: orderedRows, total: totalCount };
  }, [opportunityRegister]);

  const chartData = useMemo(
    () =>
      rows
        .filter((phase) => phase.count > 0)
        .map((phase) => ({ label: phase.label, value: phase.count })),
    [rows]
  );

  return (
    <div className="opportunity-phase-insight">
      <div className="opportunity-phase-insight__intro">
        <h3 className="opportunity-phase-insight__title">Phases of Opportunity</h3>
        <p className="opportunity-phase-insight__description">
          Counts of opportunities grouped by their recorded phase of identification. Values are
          sourced from the Opportunity Register.
        </p>
      </div>
      <HorizontalBarChart
        data={chartData}
        emptyMessage="No phase distribution recorded for opportunities"
        valueFormatter={(value) => value.toString()}
      />
      <div className="opportunity-phase-insight__table-wrapper">
        <table className="opportunity-phase-insight__table">
          <thead>
            <tr>
              <th scope="col">Phase of Opportunity Identification</th>
              <th scope="col" className="opportunity-phase-insight__value">
                No. of Opportunities Identified
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((phase) => (
              <tr key={phase.key}>
                <th scope="row">{phase.label}</th>
                <td className="opportunity-phase-insight__value">{phase.count}</td>
              </tr>
            ))}
            <tr className="opportunity-phase-insight__total">
              <th scope="row">Total Opportunities Identified</th>
              <td className="opportunity-phase-insight__value">{total}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OpportunityPhaseInsightTable;
