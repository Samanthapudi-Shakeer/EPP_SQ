import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API } from "../App";

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const normalizeValue = (value = {}) => ({
  content: typeof value.content === "string" ? value.content : value.content ?? "",
  image_data: value.image_data || null
});

export const useSingleEntries = (projectId, definitions = []) => {
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [dirtyMap, setDirtyMap] = useState({});
  const initialRef = useRef({});

  const updateInitialState = useCallback((nextInitial) => {
    initialRef.current = nextInitial;
  }, []);

  const setDirtyForField = useCallback((field, nextValue) => {
    const initialValue = normalizeValue(initialRef.current[field]);
    const normalizedNext = normalizeValue(nextValue);

    const isDirty =
      initialValue.content !== normalizedNext.content ||
      initialValue.image_data !== normalizedNext.image_data;

    setDirtyMap((prev) => {
      if (prev[field] === isDirty) {
        return prev;
      }

      return { ...prev, [field]: isDirty };
    });
  }, []);

  useEffect(() => {
    const fetchEntries = async () => {
      if (!projectId || !definitions.length) {
        setValues({});
        updateInitialState({});
        setDirtyMap({});
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const responses = await Promise.all(
          definitions.map((definition) =>
            axios.get(`${API}/projects/${projectId}/single-entry/${definition.field}`)
          )
        );

        const nextValues = {};
        const nextInitial = {};
        definitions.forEach((definition, index) => {
          const payload = responses[index].data || {};
          const normalized = normalizeValue(payload);
          nextValues[definition.field] = normalized;
          nextInitial[definition.field] = { ...normalized };
        });

        setValues(nextValues);
        updateInitialState(nextInitial);
        setDirtyMap({});
      } catch (error) {
        console.error("Failed to fetch single entry fields", error);
        setValues({});
        updateInitialState({});
        setDirtyMap({});
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, [projectId, definitions, updateInitialState]);

  const updateContent = useCallback(
    (field, content) => {
      setValues((prev) => {
        const nextValue = {
          ...(prev[field] || { image_data: null, content: "" }),
          content
        };

        setDirtyForField(field, nextValue);
        return { ...prev, [field]: nextValue };
      });
    },
    [setDirtyForField]
  );

  const updateImage = useCallback(async (field, file) => {
    if (!file) {
      setValues((prev) => {
        const nextValue = {
          ...(prev[field] || { content: "", image_data: null }),
          image_data: null
        };

        setDirtyForField(field, nextValue);
        return { ...prev, [field]: nextValue };
      });
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setValues((prev) => {
      const nextValue = {
        ...(prev[field] || { content: "", image_data: null }),
        image_data: dataUrl
      };

      setDirtyForField(field, nextValue);
      return { ...prev, [field]: nextValue };
    });
  }, [setDirtyForField]);

  const saveEntry = useCallback(
    async (field) => {
      const payload = normalizeValue(values[field]);
      await axios.post(`${API}/projects/${projectId}/single-entry`, {
        field_name: field,
        content: payload.content,
        image_data: payload.image_data
      });

      const nextInitial = {
        ...initialRef.current,
        [field]: { ...payload }
      };

      updateInitialState(nextInitial);
      setDirtyMap((prev) => ({ ...prev, [field]: false }));
    },
    [projectId, updateInitialState, values]
  );

  return {
    values,
    loading,
    updateContent,
    updateImage,
    saveEntry,
    dirtyFields: dirtyMap,
    hasUnsavedChanges: Object.values(dirtyMap).some(Boolean)
  };
};
