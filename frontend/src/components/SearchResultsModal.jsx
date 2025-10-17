import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import { XCircle } from "lucide-react";
import { useGlobalSearch } from "../context/GlobalSearchContext";

const groupResults = (results) => {
  const sections = new Map();

  results.forEach((result) => {
    const sectionKey = result.sectionId || "global";
    if (!sections.has(sectionKey)) {
      sections.set(sectionKey, {
        label: result.sectionLabel || "General",
        groups: new Map()
      });
    }

    const sectionEntry = sections.get(sectionKey);
    const groupKey = result.groupId || "other";
    if (!sectionEntry.groups.has(groupKey)) {
      sectionEntry.groups.set(groupKey, {
        label: result.groupLabel || "Details",
        items: []
      });
    }

    sectionEntry.groups.get(groupKey).items.push(result);
  });

  return Array.from(sections.entries()).map(([key, value]) => ({
    id: key,
    label: value.label,
    groups: Array.from(value.groups.entries()).map(([groupId, groupValue]) => ({
      id: groupId,
      label: groupValue.label,
      items: groupValue.items
    }))
  }));
};

const SearchResultsModal = () => {
  const { isModalOpen, hideAllResults, results, selectResult } = useGlobalSearch();

  const groupedResults = useMemo(() => groupResults(results), [results]);

  if (!isModalOpen) {
    return null;
  }

  return createPortal(
    <div className="search-modal-overlay" role="dialog" aria-modal="true">
      <div className="search-modal">
        <header className="search-modal__header">
          <div>
            <h2>Search results</h2>
            <p>{results.length} matches found across the project</p>
          </div>
          <button type="button" className="search-modal__close" onClick={hideAllResults}>
            <XCircle aria-hidden="true" size={20} />
            <span>Close</span>
          </button>
        </header>
        <div className="search-modal__body">
          {groupedResults.length ? (
            groupedResults.map((section) => (
              <section key={section.id} className="search-modal__section">
                <h3>{section.label}</h3>
                {section.groups.map((group) => (
                  <div key={group.id} className="search-modal__group">
                    <h4>{group.label}</h4>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            className="search-modal__result"
                            onClick={() => selectResult(item)}
                          >
                            <span className="search-modal__result-title">{item.label}</span>
                            <span className="search-modal__result-description">{item.description}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))
          ) : (
            <div className="search-modal__empty">No results found.</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SearchResultsModal;
