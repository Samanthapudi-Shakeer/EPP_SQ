import React, { useMemo } from "react";
import HorizontalBarChart from "./charts/HorizontalBarChart";

const RISK_STATUS_COLUMNS = [
  { key: "total", label: "Total Risks Identified" },
  { key: "closed", label: "Risks Closed" },
  { key: "mitigated", label: "Risk Mitigated" },
  { key: "underObservation", label: "Risk Under Observation" },
  { key: "contingencyActivated", label: "Risk Contingency Activated" },
  { key: "notOccurred", label: "Risk Not Occurred" },
  { key: "residual", label: "Residual Risk" }
];

const normalizeStatus = (value) => {
  if (!value) return "";
  return value.toString().toLowerCase().replace(/[^a-z0-9]/g, "");
};

const mapNormalizedToKey = {
  closed: "closed",
  mitigated: "mitigated",
  underobservation: "underObservation",
  contingencyactivated: "contingencyActivated",
  notoccured: "notOccurred",
  notoccurred: "notOccurred",
  residualrisk: "residual"
};

const RiskStatusInsightTable = ({ riskRegister = [] }) => {
  const counts = useMemo(() => {
    const tally = {
      total: riskRegister.length,
      closed: 0,
      mitigated: 0,
      underObservation: 0,
      contingencyActivated: 0,
      notOccurred: 0,
      residual: 0
    };

    riskRegister.forEach((risk) => {
      const normalized = normalizeStatus(risk?.status);
      const key = mapNormalizedToKey[normalized];
      if (key) {
        tally[key] = (tally[key] || 0) + 1;
      }
    });

    return tally;
  }, [riskRegister]);

  const chartData = useMemo(() => {
    const labels = RISK_STATUS_COLUMNS.filter((column) => column.key !== "total");
    return labels
      .map((column) => ({
        label: column.label,
        value: counts[column.key] || 0
      }))
      .filter((item) => item.value > 0);
  }, [counts]);

  return (
    <div className="risk-status-insight insight-card">
      <div className="risk-status-insight__chart">
        <HorizontalBarChart
          data={chartData}
          emptyMessage="No risk status insights available"
          valueFormatter={(value) => value.toString()}
        />
      </div>
      <div className="risk-status-insight__table-wrapper">
        <table className="risk-status-insight__table">
          <thead>
            <tr>
              <th scope="col" colSpan={RISK_STATUS_COLUMNS.length}>
                Risk Status Summary
              </th>
            </tr>
            <tr>
              {RISK_STATUS_COLUMNS.map((column) => (
                <th key={column.key} scope="col">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {RISK_STATUS_COLUMNS.map((column) => (
                <td key={column.key}>{counts[column.key] || 0}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RiskStatusInsightTable;
