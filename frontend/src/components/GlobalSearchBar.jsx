import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Search, XCircle } from "lucide-react";
import clsx from "clsx";
import { useGlobalSearch } from "../context/GlobalSearchContext";
import SearchResultsModal from "./SearchResultsModal";

const EXCLUDED_PATHS = ["/login"];

const GlobalSearchBar = () => {
  const location = useLocation();
  const { searchTerm, setSearchTerm, results, selectResult, showAllResults } = useGlobalSearch();
  const [isFocused, setIsFocused] = useState(false);
  const previewResults = useMemo(() => results.slice(0, 10), [results]);

  if (EXCLUDED_PATHS.includes(location.pathname)) {
    return null;
  }

  const handleClear = () => {
    setSearchTerm("");
  };

  const showPreview = isFocused && Boolean(searchTerm.trim());

  const handleResultSelect = (event, result) => {
    event.preventDefault();
    selectResult(result);
  };

  const handleShowAll = (event) => {
    event.preventDefault();
    showAllResults();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && results.length > 0) {
      event.preventDefault();
      selectResult(results[0]);
    }
  };

  return (
    <div className="global-search-shell">
      <div className="global-search-container">
        <Search aria-hidden="true" className="global-search-icon" size={18} />
        <input
          type="search"
          className="global-search-input"
          placeholder="Search across projects, users, and plan content"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setIsFocused(false), 120);
          }}
          onKeyDown={handleKeyDown}
          aria-label="Global search"
        />
        <button
          type="button"
          className={clsx("global-search-clear", { "is-visible": Boolean(searchTerm) })}
          onClick={handleClear}
          aria-label="Clear global search"
        >
          <XCircle aria-hidden="true" size={16} />
        </button>
      </div>
      {showPreview ? (
        <div className="global-search-preview" role="listbox">
          {previewResults.length ? (
            <ul>
              {previewResults.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    className="global-search-preview-item"
                    onMouseDown={(event) => handleResultSelect(event, result)}
                  >
                    <span className="global-search-preview-title">{result.label}</span>
                    <span className="global-search-preview-description">{result.description}</span>
                    <span className="global-search-preview-meta">
                      {result.sectionLabel}
                      {result.groupLabel ? ` • ${result.groupLabel}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="global-search-preview-empty">
              No matches for <strong>{`"${searchTerm}"`}</strong>
            </div>
          )}
          {results.length > 10 ? (
            <button
              type="button"
              className="global-search-preview-all"
              onMouseDown={handleShowAll}
            >
              Show all results ({results.length})
            </button>
          ) : null}
        </div>
      ) : null}
      <SearchResultsModal />
    </div>
  );
};

export default GlobalSearchBar;
