import React, { useMemo } from "react";
import { getChartColor } from "../../utils/chartColors";

const clamp = (value, min, max) => {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, value));
};

const HorizontalBarChart = ({
  data = [],
  emptyMessage = "No data available",
  maxValue,
  valueFormatter = (value) => value,
  showTotal = false,
  totalLabel = "Total"
}) => {
  const { processedData, computedMax, total } = useMemo(() => {
    const safeData = Array.isArray(data)
      ? data.filter((item) => item && Number.isFinite(Number(item.value)))
      : [];

    const values = safeData.map((item) => Number(item.value) || 0);
    const derivedMax = maxValue ?? Math.max(0, ...values);
    const computedTotal = values.reduce((sum, current) => sum + current, 0);

    return {
      processedData: safeData.map((item, index) => ({
        label: item.label || item.key || `Item ${index + 1}`,
        value: Number(item.value) || 0,
        color: item.color || getChartColor(index)
      })),
      computedMax: derivedMax,
      total: computedTotal
    };
  }, [data, maxValue]);

  if (!processedData.length || computedMax <= 0) {
    return (
      <div className="insight-chart insight-chart--bar insight-chart--empty">
        <p className="insight-chart__empty">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="insight-chart insight-chart--bar">
      <div className="insight-chart__bars">
        {processedData.map((item, index) => {
          const percent = clamp((item.value / computedMax) * 100, 0, 100);
          return (
            <div key={`${item.label}-${index}`} className="insight-chart__bar-row">
              <div className="insight-chart__bar-label" title={item.label}>
                {item.label}
              </div>
              <div className="insight-chart__bar-track">
                <div
                  className="insight-chart__bar-fill"
                  style={{ width: `${percent}%`, backgroundColor: item.color }}
                  aria-hidden
                />
              </div>
              <div className="insight-chart__bar-value">{valueFormatter(item.value)}</div>
            </div>
          );
        })}
      </div>
      {showTotal && (
        <div className="insight-chart__total" aria-live="polite">
          <span className="insight-chart__total-label">{totalLabel}</span>
          <span className="insight-chart__total-value">{valueFormatter(total)}</span>
        </div>
      )}
    </div>
  );
};

export default HorizontalBarChart;
