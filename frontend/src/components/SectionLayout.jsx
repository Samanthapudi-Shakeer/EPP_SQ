import React, { createContext, useMemo, useState, useEffect, useRef } from "react";
import { useGlobalSearch } from "../context/GlobalSearchContext";

export const SectionItemContext = createContext(null);

const SectionLayout = ({
  title,
  projectId,
  sectionId,
  sectionLabel,
  items = [],
  defaultItemId
}) => {
  const { navigateToSection } = useGlobalSearch();
  const validItems = useMemo(
    () => items.filter((item) => item && item.id && typeof item.render === "function"),
    [items]
  );
  const resolvedSectionLabel = sectionLabel || title || "Section";
  const computedDefaultId = useMemo(() => {
    if (defaultItemId && validItems.some((item) => item.id === defaultItemId)) {
      return defaultItemId;
    }
    return validItems[0]?.id || null;
  }, [defaultItemId, validItems]);

  const [activeId, setActiveId] = useState(computedDefaultId);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const itemRefs = useRef({});

  useEffect(() => {
    setActiveId((current) => {
      if (current && validItems.some((item) => item.id === current)) {
        return current;
      }
      return computedDefaultId;
    });
  }, [computedDefaultId, validItems]);

  const handleSelect = (itemId) => {
    setActiveId(itemId);
    const node = itemRefs.current[itemId];
    if (node && typeof node.scrollIntoView === "function") {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            const aIndex = Number(a.target.getAttribute("data-index") || 0);
            const bIndex = Number(b.target.getAttribute("data-index") || 0);
            return aIndex - bIndex;
          })[0];

        if (visibleEntry) {
          const nextId = visibleEntry.target.getAttribute("data-item-id");
          if (nextId) {
            setActiveId((current) => (current === nextId ? current : nextId));
          }
        }
      },
      {
        root: null,
        rootMargin: "-30% 0px -50% 0px",
        threshold: [0.1, 0.25, 0.5]
      }
    );

    validItems.forEach((item) => {
      const node = itemRefs.current[item.id];
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, [validItems]);

  const bodyClassName = useMemo(
    () => `section-shell__body ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`,
    [isSidebarOpen]
  );

  return (
    <div className="section-shell">
      <div className="section-shell__header">
        <button
          type="button"
          className="btn btn-outline btn-sm section-shell__nav-toggle"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? "Hide Navigation" : "Show Navigation"}
        </button>
        {title ? <h2 className="section-shell__title">{title}</h2> : null}
      </div>
      <div className={bodyClassName}>
        <aside className={`section-shell__sidebar${isSidebarOpen ? " is-open" : ""}`}>
          <div className="section-shell__sidebar-header">
            <span className="section-shell__sidebar-title">Navigate Section</span>
          </div>
          <nav className="section-shell__sidebar-nav">
            <ul>
              {validItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#section-${item.id}`}
                    className={`section-shell__sidebar-link${
                      item.id === activeId ? " is-active" : ""
                    }`}
                    onClick={(event) => {
                      event.preventDefault();
                      handleSelect(item.id);
                    }}
                  >
                    <span className="section-shell__sidebar-link-label">{item.label}</span>
                    
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        {isSidebarOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            className="section-shell__overlay"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}
        <div className="section-shell__content">
          {validItems.length ? (
            <div className="section-shell__content-inner">
              {validItems.map((item, index) => {
                const shouldRenderHeading =
                  item.heading !== undefined ? item.heading : item.type === "Table";
                const contextValue = {
                  projectId,
                  sectionId,
                  sectionLabel: resolvedSectionLabel,
                  itemId: item.id,
                  itemLabel: item.label,
                  itemType: item.type,
                  navigateToSection
                };

                return (
                  <section
                    key={item.id}
                    id={`section-${item.id}`}
                    ref={(node) => {
                      if (node) {
                        itemRefs.current[item.id] = node;
                      } else {
                        delete itemRefs.current[item.id];
                      }
                    }}
                    data-item-id={item.id}
                    data-index={index}
                    className="section-shell__content-section"
                  >
                    {shouldRenderHeading ? (
                      <h3 className="section-shell__content-heading">{item.label}</h3>
                    ) : null}
                    <SectionItemContext.Provider value={contextValue}>
                      <div className="section-shell__content-body">{item.render()}</div>
                    </SectionItemContext.Provider>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="section-shell__empty">No content available for this section.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionLayout;
