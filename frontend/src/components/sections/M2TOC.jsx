import React, { useCallback, useMemo } from "react";
import { useGlobalSearch } from "../../context/GlobalSearchContext";
import SectionLayout from "../SectionLayout";

const TOC_STRUCTURE = [
  {
    sheetId: "M3",
    sheetName: "Definitions and References",
    sections: [
      "Definitions And References",
      "Links To PIF, Other Plans, Other Documents"
    ]
  },
  {
    sheetId: "M4",
    sheetName: "Project Introduction",
    sections: [
      "Project Scope and Approach",
      "Product Overview",
      "Life Cycle Model",
      "Business Continuity"
    ]
  },
  {
    sheetId: "M5",
    sheetName: "Resource Plan and Estimation",
    sections: [
      "Assumptions, Constraints and Dependencies",
      "Organization Structure",
      "List of Stakeholders",
      "Human Resource and Special Training Plan",
      "Environment and Tools",
      "Build/Buy/Reuse",
      "Summary of Estimates"
    ]
  },
  {
    sheetId: "M6",
    sheetName: "PMC and Project Objectives",
    sections: [
      "Project Monitoring and Control, Transition Plan",
      "Quantitative Objectives, Measurement and Data Management Plan"
    ]
  },
  {
    sheetId: "M7",
    sheetName: "Quality Management",
    sections: ["Standards", "Verification and Validation Plan", "Causal Analysis Plan"]
  },
  {
    sheetId: "M8",
    sheetName: "DAR, Tailoring and Release Plan",
    sections: ["Decision Management Plan", "Tailoring", "Deviations", "Product Release Plan"]
  },
  {
    sheetId: "M9",
    sheetName: "Risk Management",
    sections: ["Risk Management Plan", "Risks", "Risk Exposure Trend"]
  },
  {
    sheetId: "M10",
    sheetName: "Opportunity Management",
    sections: ["Opportunity Management Plan and tracking"]
  },
  {
    sheetId: "M11",
    sheetName: "Configuration Management",
    sections: [
      "List of Configuration Items",
      "Naming Convention",
      "Location of CIs",
      "Versioning",
      "Baselining",
      "Labelling Baselines (Tagging)",
      "Configuration Control",
      "Configuration Control Board",
      "Configuration Status Accounting",
      "Configuration Audit",
      "Back up",
      "Release Mechanism"
    ]
  },
  {
    sheetId: "M12",
    sheetName: "List of Deliverables",
    sections: ["List of Deliverables"]
  },
  {
    sheetId: null,
    sheetName: "Skill Matrix",
    sections: ["Skill Matrix sheet"]
  },
  {
    sheetId: "M13",
    sheetName: "Supplie Agreement Management",
    sections: [
      "Supplier Project Introduction and Scope",
      "Supplier Project Plan",
      "List down Assumptions, Dependencies, Constraints and Risks",
      "Status Reporting and Communication Plan",
      "Quantitative Objectives, Measurement and Data Management Plan",
      "Verification and Validation Plan",
      "Tailoring",
      "Deviations",
      "Product Release Plan",
      "Supplier Configuration Management plan",
      "Location of CIs",
      "Versioning",
      "Baselining",
      "Labelling Baselines (Tagging)",
      "Change Management Plan",
      "Configuration Control",
      "Configuration Management Audit",
      "Back up",
      "Release Mechanism",
      "Information Retention Plan",
      "Deliverable List"
    ]
  }
];

const ensureSections = (sections = []) => (sections.length ? sections : ["—"]);

const M2TOC = ({ projectId, sectionId, sectionName }) => {
  const { navigateToSection } = useGlobalSearch();

  const handleNavigate = useCallback(
    async (sheetId) => {
      if (!sheetId || typeof navigateToSection !== "function") {
        return;
      }

      try {
        await navigateToSection(sheetId);
      } catch (error) {
        console.error(`Failed to navigate to section ${sheetId}`, error);
      }
    },
    [navigateToSection]
  );

  const navigationItems = useMemo(
    () => [
      {
        id: "table-toc",
        label: "Table of Contents",
        type: "Table",
        render: () => (
          <>
            <p className="muted-text" style={{ marginBottom: "1.5rem" }}>
              Use this quick reference to see every sheet and jump directly to the matching
              project tab.
            </p>
            <div className="toc-table-wrapper">
              <table className="data-table toc-table">
                <thead>
                  <tr>
                    <th scope="col">Sheet Name</th>
                    <th scope="col">Sections in the sheet</th>
                  </tr>
                </thead>
                <tbody>
                  {TOC_STRUCTURE.map((entry) => {
                    const sections = ensureSections(entry.sections);
                    return sections.map((section, index) => {
                      const rowKey = `${entry.sheetId || entry.sheetName}-${index}`;

                      return (
                        <tr key={rowKey}>
                          {index === 0 ? (
                            <td rowSpan={sections.length} className="toc-sheet-cell">
                              {entry.sheetId ? (
                                <button
                                  type="button"
                                  className="toc-sheet-link"
                                  onClick={() => handleNavigate(entry.sheetId)}
                                >
                                  {entry.sheetName}
                                </button>
                              ) : (
                                <span className="toc-sheet-text">{entry.sheetName}</span>
                              )}
                            </td>
                          ) : null}
                          <td className="toc-section-cell">{section}</td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </>
        )
      }
    ],
    [handleNavigate]
  );

  return (
    <SectionLayout
      title="Table of Contents"
      sectionId={sectionId}
      sectionLabel={sectionName}
      projectId={projectId}
      items={navigationItems}
    />
  );
};

export default M2TOC;
