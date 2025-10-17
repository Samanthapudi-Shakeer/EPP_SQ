import React, { useMemo } from "react";
import { getChartColor } from "../../utils/chartColors";

const formatTick = (value) => {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(2);
};

const MultiLineTrendChart = ({
  labels = [],
  series = [],
  height = 280,
  emptyMessage = "No trend data available",
  valueFormatter = (value) => value,
  labelFormatter = (label) => label,
  yTicks = 4
}) => {
  const chartModel = useMemo(() => {
    if (!Array.isArray(labels) || !labels.length || !Array.isArray(series)) {
      return null;
    }

    const sanitizedSeries = series
      .map((line, index) => {
        const safeValues = Array.isArray(line?.values)
          ? line.values.map((raw) => {
              const value = Number(raw);
              return Number.isFinite(value) ? value : null;
            })
          : [];

        if (!safeValues.some((value) => value !== null)) {
          return null;
        }

        return {
          id: line.id ?? `series-${index}`,
          label: line.label ?? line.id ?? `Series ${index + 1}`,
          values: safeValues,
          color: line.color || getChartColor(index)
        };
      })
      .filter(Boolean);

    if (!sanitizedSeries.length) {
      return null;
    }

    const pointsPerSeries = sanitizedSeries.map((line) =>
      line.values.map((value, valueIndex) => ({
        label: labels[valueIndex],
        value,
        index: valueIndex
      }))
    );

    const flattened = pointsPerSeries.flat().filter((point) => point.value !== null);

    if (!flattened.length) {
      return null;
    }

    const maxValue = Math.max(...flattened.map((point) => point.value));
    const minValue = Math.min(...flattened.map((point) => point.value));

    return {
      labels,
      series: sanitizedSeries,
      maxValue,
      minValue
    };
  }, [labels, series]);

  if (!chartModel) {
    return (
      <div className="insight-chart insight-chart--line insight-chart--empty">
        <p className="insight-chart__empty">{emptyMessage}</p>
      </div>
    );
  }

  const width = 720;
  const padding = { top: 24, right: 32, bottom: 56, left: 64 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxValue = chartModel.maxValue || 0;
  const minValue = Math.min(0, chartModel.minValue);
  const valueRange = Math.max(maxValue - minValue, 1);

  const toX = (index) => {
    if (chartModel.labels.length === 1) {
      return padding.left + innerWidth / 2;
    }
    const ratio = index / (chartModel.labels.length - 1);
    return padding.left + ratio * innerWidth;
  };

  const toY = (value) => {
    if (!Number.isFinite(value)) {
      return padding.top + innerHeight;
    }
    const normalized = (value - minValue) / valueRange;
    return padding.top + (1 - normalized) * innerHeight;
  };

  const yTickCount = Math.max(2, yTicks);
  const yStep = valueRange / yTickCount;
  const ticks = Array.from({ length: yTickCount + 1 }, (_, index) => minValue + index * yStep);

  return (
    <div className="insight-chart insight-chart--line">
      <svg
        className="insight-chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Trend chart"
      >
        <desc>Multi-line trend of historical values</desc>
        {/* Grid lines */}
        {ticks.map((tickValue, index) => {
          const y = toY(tickValue);
          return (
            <g key={`grid-${tickValue}-${index}`} className="insight-chart__grid-row">
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                className="insight-chart__grid-line"
              />
              <text x={padding.left - 12} y={y + 4} className="insight-chart__axis-label">
                {formatTick(tickValue)}
              </text>
            </g>
          );
        })}

        {/* Axis */}
        <line
          x1={padding.left}
          y1={toY(minValue)}
          x2={width - padding.right}
          y2={toY(minValue)}
          className="insight-chart__axis-line"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          className="insight-chart__axis-line"
        />

        {/* X-axis labels */}
        {chartModel.labels.map((label, index) => {
          const x = toX(index);
          const y = height - padding.bottom + 20;
          return (
            <text key={`label-${label}-${index}`} x={x} y={y} className="insight-chart__axis-label" textAnchor="middle">
              {labelFormatter(label)}
            </text>
          );
        })}

        {/* Data series */}
        {chartModel.series.map((line) => {
          const points = line.values
            .map((value, index) => {
              if (value === null) {
                return null;
              }
              return {
                x: toX(index),
                y: toY(value),
                label: labelFormatter(chartModel.labels[index]),
                value
              };
            })
            .filter(Boolean);

          if (!points.length) {
            return null;
          }

          const path = points
            .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
            .join(" ");

          return (
            <g key={line.id} className="insight-chart__series">
              <path d={path} className="insight-chart__series-line" stroke={line.color} fill="none" />
              {points.map((point, pointIndex) => (
                <g key={`${line.id}-point-${pointIndex}`}>
                  <circle cx={point.x} cy={point.y} r={4} fill={line.color} />
                  <title>
                    {`${line.label} on ${point.label}: ${valueFormatter(point.value)}`}
                  </title>
                </g>
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="insight-chart__legend">
        {chartModel.series.map((line) => (
          <div key={`${line.id}-legend`} className="insight-chart__legend-item">
            <span className="insight-chart__legend-swatch" style={{ backgroundColor: line.color }} />
            <span className="insight-chart__legend-label">{line.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiLineTrendChart;
