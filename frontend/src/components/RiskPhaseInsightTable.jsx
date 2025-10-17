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
  { key: "hardwaredesignspecification", label: "Hardware Design Specification" },
  {
    key: "hardwarerequirementsspecification",
    label: "Hardware Requirements Specification"
  },
  {
    key: "hardwaresoftwareinterfacespecification",
    label: "Hardware Software Interface Specification"
  },
  { key: "hardwareintegrationtestreport", label: "Hardware Integration Test Report" },
  { key: "hara", label: "HARA" },
  { key: "safetyconcept", label: "Safety Concept" },
  {
    key: "systemarchitecturaldesignspecification",
    label: "System Architectural Design Specification"
  },
  { key: "systemrequirementsspecification", label: "System Requirements Specification" },
  { key: "systemintegrationtestreport", label: "System Integration Test Report" },
  { key: "systemqualificationtestreport", label: "System Qualification Test Report" },
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

const RiskPhaseInsightTable = ({ riskRegister = [] }) => {
  const { rows, total } = useMemo(() => {
    const counts = PHASE_DEFINITIONS.reduce((acc, phase) => {
      acc[phase.key] = 0;
      return acc;
    }, {});

    riskRegister.forEach((risk) => {
      const normalized = normalizePhaseValue(risk?.phase_of_risk_identification);
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
  }, [riskRegister]);

  const chartData = useMemo(
    () =>
      rows
        .filter((phase) => phase.count > 0)
        .map((phase) => ({ label: phase.label, value: phase.count })),
    [rows]
  );

  return (
    <div className="risk-phase-insight">
      <div className="risk-phase-insight__intro">
        <h3 className="risk-phase-insight__title">Phases of Risk</h3>
        <p className="risk-phase-insight__description">
          Counts of risks grouped by the recorded phase of identification. Values are
          sourced from the Risk Mitigation &amp; Contingency register.
        </p>
      </div>
      <HorizontalBarChart
        data={chartData}
        emptyMessage="No phase distribution recorded for risks"
        valueFormatter={(value) => value.toString()}
      />
      <div className="risk-phase-insight__table-wrapper">
        <table className="risk-phase-insight__table">
          <thead>
            <tr>
              <th scope="col">Phase of Risk Identification</th>
              <th scope="col" className="risk-phase-insight__value">No. of Risks Identified</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((phase) => (
              <tr key={phase.key}>
                <th scope="row">{phase.label}</th>
                <td className="risk-phase-insight__value">{phase.count}</td>
              </tr>
            ))}
            <tr className="risk-phase-insight__total">
              <th scope="row">Total Risks Identified</th>
              <td className="risk-phase-insight__value">{total}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiskPhaseInsightTable;
