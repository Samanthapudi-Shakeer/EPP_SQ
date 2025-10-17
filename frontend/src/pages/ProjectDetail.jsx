import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { useGlobalSearch } from "../context/GlobalSearchContext";
import M1RevisionHistory from "../components/sections/M1RevisionHistory";
import M2TOC from "../components/sections/M2TOC";
import M3Definitions from "../components/sections/M3Definitions";
import M4ProjectOverview from "../components/sections/M4ProjectOverview";
import M5Resources from "../components/sections/M5Resources";
import M6MonitoringControl from "../components/sections/M6MonitoringControl";
import M7QualityManagement from "../components/sections/M7QualityManagement";
import M8DecisionManagement from "../components/sections/M8DecisionManagement";
import M9RiskManagement from "../components/sections/M9RiskManagement";
import M10OpportunityManagement from "../components/sections/M10OpportunityManagement";
import M11ConfigurationManagement from "../components/sections/M11ConfigurationManagement";
import M12Deliverables from "../components/sections/M12Deliverables";
import M13SupplierAgreement from "../components/sections/M13SupplierAgreement";

const SECTION_DEFINITIONS = [
  { id: "M1", name: "Revision History", component: M1RevisionHistory },
  { id: "M2", name: "TOC", component: M2TOC },
  { id: "M3", name: "Definitions & References", component: M3Definitions },
  { id: "M4", name: "Project Introduction", component: M4ProjectOverview },
  { id: "M5", name: "Resource Plan & Estimation", component: M5Resources },
  { id: "M6", name: "PMC & Project Objectives", component: M6MonitoringControl },
  { id: "M7", name: "Quality Management", component: M7QualityManagement },
  { id: "M8", name: "DAR, Tailoring and Release Plan", component: M8DecisionManagement },
  { id: "M9", name: "Risk Management", component: M9RiskManagement },
  { id: "M10", name: "Opportunity Management", component: M10OpportunityManagement },
  { id: "M11", name: "Configuration Management", component: M11ConfigurationManagement },
  { id: "M12", name: "List of Deliverables", component: M12Deliverables },
  { id: "M13", name: "Supplier Agreement", component: M13SupplierAgreement }
];


const SECTION_LOOKUP = SECTION_DEFINITIONS.reduce((accumulator, definition) => {
  accumulator[definition.id] = definition;
  return accumulator;
}, {});




const ProjectDetail = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("M1");
  const [singleEntryDirtySections, setSingleEntryDirtySections] = useState({});
  const [error, setError] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isEditor = ["admin", "editor"].includes(currentUser.role);
  const { searchTerm, registerSectionNavigator, registerSource, setSearchTerm } = useGlobalSearch();

  const fetchProject = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/projects/${projectId}`);
      setProject(response.data);
    } catch (err) {
      setError("Failed to load project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const sections = useMemo(() => SECTION_DEFINITIONS, []);
  const activeSection = SECTION_LOOKUP[activeTab];
  const ActiveSectionComponent = activeSection?.component;

  const updateSingleEntryDirtyState = useCallback((sectionId, isDirty) => {
    if (!sectionId) return;
    setSingleEntryDirtySections((prev) => {
      if (prev[sectionId] === isDirty) {
        return prev;
      }

      return { ...prev, [sectionId]: isDirty };
    });
  }, []);

  const attemptTabChange = useCallback(
    (nextTab) => {
      if (!nextTab || nextTab === activeTab) {
        return true;
      }

      if (singleEntryDirtySections[activeTab]) {
        const confirmLeave = window.confirm(
          "You have unsaved single-entry changes in this section. Continue without saving?"
        );

        if (!confirmLeave) {
          return false;
        }
      }

      setActiveTab(nextTab);
      return true;
    },
    [activeTab, singleEntryDirtySections]
  );

  const handleTabClick = useCallback(
    (nextTab) => {
      attemptTabChange(nextTab);
    },
    [attemptTabChange]
  );

  const navigateWithinProject = useCallback(
    async (nextSectionId) => {
      if (!nextSectionId) {
        return;
      }

      const didChange = attemptTabChange(nextSectionId);
      if (!didChange) {
        throw new Error("Navigation cancelled");
      }

      await new Promise((resolve) => setTimeout(resolve, 260));
    },
    [attemptTabChange]
  );

  useEffect(() => {
    if (!registerSectionNavigator) {
      return undefined;
    }

    const unregister = registerSectionNavigator({ navigate: navigateWithinProject });
    return unregister;
  }, [registerSectionNavigator, navigateWithinProject]);

  useEffect(() => {
    if (!registerSource || !projectId) {
      return undefined;
    }

    const sourceId = `project-${projectId}-sections`;
    const getItems = () =>
      sections.map((section) => ({
        id: `${projectId}-${section.id}-section`,
        sectionId: section.id,
        sectionLabel: section.name,
        groupId: "project-sections",
        groupLabel: "Project Sections",
        type: "section",
        label: `${section.id}: ${section.name}`,
        description: `Jump to ${section.name}`,
        searchText: `${section.id} ${section.name}`.toLowerCase(),
        onNavigate: async () => {
          setSearchTerm("");
          await navigateWithinProject(section.id);
        }
      }));

    const unregister = registerSource({ id: sourceId, getItems });
    return unregister;
  }, [navigateWithinProject, projectId, registerSource, sections, setSearchTerm]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading project...</div>
      </div>
    );
  }



  if (error || !project) {
    return (
      <div className="page-container">
        <div className="error-message">{error || "Project not found"}</div>
        <Link to="/projects" className="btn btn-primary">
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container project-detail-layout">
      <div className="project-detail-header">
        <div className="project-detail-heading">
          <Link
            to="/projects"
            className="btn btn-outline btn-sm project-detail-back"
            data-testid="back-to-projects"
          >
            ← Back to Projects
          </Link>
          <h1 className="project-detail-title">Project Name : {project.name}</h1>
          {project.description && (
            <p className="project-detail-description">{project.description}</p>
          )}
        </div>
        <div className="project-detail-role">
          <span className={`badge badge-${currentUser.role}`}>
            {currentUser.role} Mode
          </span>
        </div>
      </div>

      <div className="tabs-container project-detail-tabs">
        <div className="tabs-header">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`tab-button ${activeTab === section.id ? "active" : ""}`}
              onClick={() => handleTabClick(section.id)}
              data-testid={`tab-${section.id}`}
            >
              {section.name}
            </button>
          ))}
        </div>

        <div className="tab-content">
          <div className="tab-content-header">
            <h2 className="section-title" data-testid="section-heading">
              {activeSection?.name || "Section"}
            </h2>
            {searchTerm && (
              <p className="search-hint">
                Filtering section content for <strong>"{searchTerm}"</strong>
              </p>
            )}
          </div>
          {ActiveSectionComponent && (
            <ActiveSectionComponent
              projectId={projectId}
              isEditor={isEditor}
              sectionId={activeTab}
              sectionName={activeSection?.name}
              onSingleEntryDirtyChange={updateSingleEntryDirtyState}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
