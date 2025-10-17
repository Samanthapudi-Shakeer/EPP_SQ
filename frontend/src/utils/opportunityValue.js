export const ALLOWED_OPPORTUNITY_VALUES = ["1", "2", "3", "4", "6", "9"];

export const deriveOpportunityValue = (row = {}) => {
  const cost = Number(row?.cost);
  const benefit = Number(row?.benefit);

  if (Number.isFinite(cost) && Number.isFinite(benefit)) {
    const product = cost * benefit;
    return Number.isFinite(product) ? String(product) : "";
  }

  return "";
};

export const getOpportunityValueLevel = (value) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  if (numericValue >= 6) {
    return "high";
  }

  if (numericValue >= 3) {
    return "medium";
  }

  if (numericValue >= 1) {
    return "low";
  }

  return "";
};

export const getOpportunityValueClassName = (value, prefix = "opportunity-value-badge--") => {
  const level = getOpportunityValueLevel(value);
  return level ? `${prefix}${level}` : "";
};
