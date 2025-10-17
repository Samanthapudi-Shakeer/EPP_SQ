import { createRowMessage, scrollToAndHighlight, waitForElement } from "./searchHighlight";

const truncate = (value, length = 220) => {
  if (!value) {
    return "";
  }

  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length - 1)}…`;
};

export const buildTableSearchItems = ({
  projectId,
  sectionId,
  sectionLabel,
  tableId,
  tableLabel,
  rows = [],
  columns = [],
  navigateToSection,
  anchorPrefix
}) => {
  if (!projectId || !sectionId || !tableId) {
    return [];
  }

  const normalizedRows = Array.isArray(rows) ? rows : [];
  const normalizedColumns = Array.isArray(columns) ? columns : [];
  const groupId = `${sectionId}-${tableId}`;
  const resolvedTableLabel = tableLabel || "Table";

  return normalizedRows.map((row, index) => {
    const rowKey = row?.id ?? row?._id ?? `index-${index}`;
    const anchorId = anchorPrefix ? `${anchorPrefix}-row-${rowKey}` : null;
    const rowNumber = index + 1;

    const previewParts = normalizedColumns
      .map((column) => {
        const value = row?.[column.key];
        if (value === null || value === undefined || value === "") {
          return null;
        }

        return `${column.label}: ${String(value).trim()}`;
      })
      .filter(Boolean);

    const preview = truncate(previewParts.join(" • ")); // preview for UI
    const searchText = `${resolvedTableLabel} ${previewParts.join(" ")}`.toLowerCase();

    return {
      id: `${projectId}-${sectionId}-${tableId}-${rowKey}`,
      sectionId,
      sectionLabel,
      groupId,
      groupLabel: resolvedTableLabel,
      type: "tableRow",
      label: `${resolvedTableLabel} — Row ${rowNumber}`,
      description: preview || "No data provided.",
      searchText,
      onNavigate: async () => {
        if (navigateToSection) {
          await navigateToSection(sectionId);
        }

        if (!anchorId) {
          return;
        }

        const element = await waitForElement(`#${anchorId}`, { attempts: 12, delay: 100 });
        if (!element) {
          return;
        }

        scrollToAndHighlight(element, { message: createRowMessage(rowNumber) });
      }
    };
  });
};

export const buildSingleEntrySearchItems = ({
  projectId,
  sectionId,
  sectionLabel,
  groupId,
  groupLabel,
  entries = [],
  values = {},
  navigateToSection,
  anchorPrefix
}) => {
  if (!projectId || !sectionId || !groupId) {
    return [];
  }

  const normalizedEntries = Array.isArray(entries) ? entries : [];
  const resolvedGroupLabel = groupLabel || "Details";

  return normalizedEntries.map((entry, index) => {
    const fieldId = entry?.field ?? `field-${index}`;
    const anchorId = anchorPrefix ? `${anchorPrefix}-${fieldId}` : null;
    const rawValue = values?.[fieldId]?.content;
    const contentValue =
      typeof rawValue === "string"
        ? rawValue
        : rawValue === null || rawValue === undefined
        ? ""
        : String(rawValue);
    const trimmedContent = contentValue.trim();
    const preview = trimmedContent || "No content provided.";
    const searchText = `${entry?.label || ""} ${trimmedContent}`.toLowerCase();

    return {
      id: `${projectId}-${sectionId}-${groupId}-${fieldId}`,
      sectionId,
      sectionLabel,
      groupId,
      groupLabel: resolvedGroupLabel,
      type: "singleEntry",
      label: entry?.label || `Field ${index + 1}`,
      description: truncate(preview),
      searchText,
      onNavigate: async () => {
        if (navigateToSection) {
          await navigateToSection(sectionId);
        }

        if (!anchorId) {
          return;
        }

        const element = await waitForElement(`#${anchorId}`, { attempts: 12, delay: 100 });
        if (!element) {
          return;
        }

        scrollToAndHighlight(element, {
          focusSelector: "textarea, input",
          message: entry?.label || resolvedGroupLabel
        });
      }
    };
  });
};
