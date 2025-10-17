import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API } from "../App";

const toApiName = (definition) => definition.apiName || definition.key;

const mapRows = (rows) => rows.map((row) => ({ id: row.id, ...row.data }));

export const useGenericTables = (projectId, sectionId, tableDefinitions) => {
  const [tableData, setTableData] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchTables = useCallback(async () => {
    if (!projectId || !sectionId || tableDefinitions.length === 0) {
      setTableData({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const responses = await Promise.all(
        tableDefinitions.map((definition) =>
          axios.get(
            `${API}/projects/${projectId}/sections/${sectionId}/tables/${toApiName(definition)}`
          )
        )
      );

      const nextState = {};
      tableDefinitions.forEach((definition, index) => {
        nextState[definition.key] = mapRows(responses[index].data || []);
      });

      setTableData(nextState);
    } catch (err) {
      console.error(`Failed to load tables for section ${sectionId}`, err);
      setTableData({});
    } finally {
      setLoading(false);
    }
  }, [projectId, sectionId, tableDefinitions]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const createRow = useCallback(
    async (tableKey, payload) => {
      const definition = tableDefinitions.find((table) => table.key === tableKey);
      if (!definition) {
        return;
      }

      await axios.post(
        `${API}/projects/${projectId}/sections/${sectionId}/tables/${toApiName(definition)}`,
        { data: payload }
      );
      await fetchTables();
    },
    [fetchTables, projectId, sectionId, tableDefinitions]
  );

  const updateRow = useCallback(
    async (tableKey, rowId, payload) => {
      const definition = tableDefinitions.find((table) => table.key === tableKey);
      if (!definition) {
        return;
      }

      await axios.put(
        `${API}/projects/${projectId}/sections/${sectionId}/tables/${toApiName(definition)}/${rowId}`,
        { data: payload }
      );
      await fetchTables();
    },
    [fetchTables, projectId, sectionId, tableDefinitions]
  );

  const deleteRow = useCallback(
    async (tableKey, rowId) => {
      const definition = tableDefinitions.find((table) => table.key === tableKey);
      if (!definition) {
        return;
      }

      await axios.delete(
        `${API}/projects/${projectId}/sections/${sectionId}/tables/${toApiName(definition)}/${rowId}`
      );
      await fetchTables();
    },
    [fetchTables, projectId, sectionId, tableDefinitions]
  );

  return {
    data: tableData,
    loading,
    refresh: fetchTables,
    createRow,
    updateRow,
    deleteRow
  };
};
