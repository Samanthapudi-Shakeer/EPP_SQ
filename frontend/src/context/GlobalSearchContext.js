import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

const GlobalSearchContext = createContext(undefined);

export const SearchProvider = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const sourcesRef = useRef(new Map());
  const navigatorRef = useRef(null);
  const searchTermRef = useRef(searchTerm);

  const recomputeResults = useCallback(
    (term) => {
      const query = (term ?? searchTermRef.current).trim().toLowerCase();

      if (!query) {
        setResults((previous) => (previous.length > 0 ? [] : previous));
        return [];
      }

      const aggregated = [];

      sourcesRef.current.forEach(({ getItems }) => {
        if (typeof getItems !== "function") {
          return;
        }

        try {
          const items = getItems();
          if (Array.isArray(items)) {
            aggregated.push(...items);
          }
        } catch (error) {
          console.warn("Failed to collect search items", error);
        }
      });

      const matches = aggregated
        .filter((item) => item && typeof item.searchText === "string")
        .filter((item) => item.searchText.includes(query))
        .map((item, index) => ({ ...item, matchIndex: index }));

      setResults((previous) => {
        if (
          previous.length === matches.length &&
          previous.every((existing, index) => {
            const candidate = matches[index];
            return (
              existing.id === candidate.id &&
              existing.matchIndex === candidate.matchIndex &&
              existing.sectionId === candidate.sectionId &&
              existing.groupId === candidate.groupId
            );
          })
        ) {
          return previous;
        }

        return matches;
      });
      return matches;
    },
    []
  );

  useEffect(() => {
    searchTermRef.current = searchTerm;
    recomputeResults(searchTerm);
  }, [searchTerm, recomputeResults]);

  const registerSource = useCallback(
    ({ id, getItems }) => {
      if (!id || typeof getItems !== "function") {
        return () => {};
      }

      sourcesRef.current.set(id, { getItems });
      recomputeResults();

      return () => {
        const existing = sourcesRef.current.get(id);
        if (existing && existing.getItems === getItems) {
          sourcesRef.current.delete(id);
        } else {
          sourcesRef.current.delete(id);
        }
        recomputeResults();
      };
    },
    [recomputeResults]
  );

  const registerSectionNavigator = useCallback(({ navigate }) => {
    navigatorRef.current = typeof navigate === "function" ? navigate : null;

    return () => {
      if (navigatorRef.current === navigate) {
        navigatorRef.current = null;
      }
    };
  }, []);

  const navigateToSection = useCallback(async (sectionId) => {
    if (!sectionId) {
      return;
    }

    if (navigatorRef.current) {
      await navigatorRef.current(sectionId);
    }
  }, []);

  const showAllResults = useCallback(() => {
    if (results.length) {
      setModalOpen(true);
    }
  }, [results.length]);

  const hideAllResults = useCallback(() => {
    setModalOpen(false);
  }, []);

  const selectResult = useCallback(async (result) => {
    if (!result) {
      return;
    }

    setModalOpen(false);

    try {
      if (typeof result.onNavigate === "function") {
        await result.onNavigate();
      }
    } catch (error) {
      console.error("Failed to navigate to search result", error);
    }
  }, []);

  const value = useMemo(
    () => ({
      searchTerm,
      setSearchTerm,
      results,
      registerSource,
      selectResult,
      showAllResults,
      hideAllResults,
      isModalOpen,
      navigateToSection,
      registerSectionNavigator
    }),
    [
      searchTerm,
      results,
      registerSource,
      selectResult,
      showAllResults,
      hideAllResults,
      isModalOpen,
      navigateToSection,
      registerSectionNavigator
    ]
  );

  return (
    <GlobalSearchContext.Provider value={value}>
      {children}
    </GlobalSearchContext.Provider>
  );
};

export const useGlobalSearch = () => {
  const context = useContext(GlobalSearchContext);
  if (!context) {
    throw new Error("useGlobalSearch must be used within a SearchProvider");
  }
  return context;
};