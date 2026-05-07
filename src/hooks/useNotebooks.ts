"use client";

import { useState, useEffect, useCallback } from "react";
import { Notebook, NotebooksData, Vocabulary } from "@/types";
import { getItem, setItem, StorageKeys } from "@/lib/storage";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);

  useEffect(() => {
    const data = getItem<NotebooksData>(StorageKeys.NOTEBOOKS);
    if (data?.notebooks) setNotebooks(data.notebooks);
  }, []);

  const save = useCallback((updated: Notebook[]) => {
    setNotebooks(updated);
    setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
  }, []);

  // --- Notebook CRUD ---

  const createNotebook = useCallback(
    (name: string): Notebook => {
      const notebook: Notebook = {
        id: generateId("nb"),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        vocabulary: [],
      };
      setNotebooks((prev) => {
        const updated = [...prev, notebook];
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        return updated;
      });
      return notebook;
    },
    []
  );

  const deleteNotebook = useCallback(
    (id: string) => {
      setNotebooks((prev) => {
        const updated = prev.filter((nb) => nb.id !== id);
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        return updated;
      });
    },
    []
  );

  const renameNotebook = useCallback(
    (id: string, name: string) => {
      setNotebooks((prev) => {
        const updated = prev.map((nb) =>
          nb.id === id ? { ...nb, name: name.trim() } : nb
        );
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        return updated;
      });
    },
    []
  );

  const getNotebookById = useCallback(
    (id: string) => notebooks.find((nb) => nb.id === id),
    [notebooks]
  );

  // --- Vocabulary CRUD within a notebook ---

  const addVocab = useCallback(
    (notebookId: string, fields: Omit<Vocabulary, "id">): Vocabulary => {
      const vocab: Vocabulary = { id: generateId("v"), ...fields };
      setNotebooks((prev) => {
        const updated = prev.map((nb) =>
          nb.id === notebookId
            ? { ...nb, vocabulary: [...nb.vocabulary, vocab] }
            : nb
        );
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        return updated;
      });
      return vocab;
    },
    []
  );

  const updateVocab = useCallback(
    (notebookId: string, vocabId: string, patch: Partial<Omit<Vocabulary, "id">>) => {
      setNotebooks((prev) => {
        const updated = prev.map((nb) =>
          nb.id === notebookId
            ? {
                ...nb,
                vocabulary: nb.vocabulary.map((v) =>
                  v.id === vocabId ? { ...v, ...patch } : v
                ),
              }
            : nb
        );
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        return updated;
      });
    },
    []
  );

  const deleteVocab = useCallback(
    (notebookId: string, vocabId: string) => {
      setNotebooks((prev) => {
        const updated = prev.map((nb) =>
          nb.id === notebookId
            ? { ...nb, vocabulary: nb.vocabulary.filter((v) => v.id !== vocabId) }
            : nb
        );
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        return updated;
      });
    },
    []
  );

  // --- Export / Import ---

  const exportNotebook = useCallback(
    (id: string): string => {
      const nb = notebooks.find((n) => n.id === id);
      if (!nb) return "{}";
      return JSON.stringify({ notebook: nb }, null, 2);
    },
    [notebooks]
  );

  /** Import vocab entries from a notebook-export JSON string, appending to target notebook */
  const importVocabFromJson = useCallback(
    (notebookId: string, jsonString: string): { imported: number; error?: string } => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonString);
      } catch {
        return { imported: 0, error: "File JSON không hợp lệ." };
      }
      const raw = parsed as { notebook?: { vocabulary?: unknown[] } };
      const incoming = raw?.notebook?.vocabulary;
      if (!Array.isArray(incoming)) {
        return { imported: 0, error: 'JSON phải có trường "notebook.vocabulary".' };
      }
      let count = 0;
      setNotebooks((prev) => {
        const nb = prev.find((n) => n.id === notebookId);
        if (!nb) return prev;
        const existingIds = new Set(nb.vocabulary.map((v) => v.id));
        const toAdd: Vocabulary[] = [];
        for (const item of incoming) {
          const v = item as Partial<Vocabulary>;
          if (!v.id && !v.kanji && !v.hiragana && !v.meaning) continue;
          const entry: Vocabulary = {
            id: v.id && !existingIds.has(v.id) ? v.id : generateId("v"),
            kanji: v.kanji,
            hiragana: v.hiragana,
            onyomi: v.onyomi,
            meaning: v.meaning,
            phonetic: v.phonetic,
          };
          toAdd.push(entry);
          count++;
        }
        const updated = prev.map((n) =>
          n.id === notebookId
            ? { ...n, vocabulary: [...n.vocabulary, ...toAdd] }
            : n
        );
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        return updated;
      });
      return { imported: count };
    },
    []
  );

  /** Import a whole notebook from JSON, creating new if id not found */
  const importNotebook = useCallback(
    (jsonString: string): { name: string; error?: string } => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonString);
      } catch {
        return { name: "", error: "File JSON không hợp lệ." };
      }
      const raw = parsed as { notebook?: Partial<Notebook> };
      const nb = raw?.notebook;
      if (!nb?.name) {
        return { name: "", error: 'JSON phải có trường "notebook.name".' };
      }
      setNotebooks((prev) => {
        const existingIdx = prev.findIndex((n) => n.id === nb.id);
        const imported: Notebook = {
          id: nb.id ?? generateId("nb"),
          name: nb.name!,
          createdAt: nb.createdAt ?? new Date().toISOString(),
          vocabulary: Array.isArray(nb.vocabulary) ? nb.vocabulary : [],
        };
        const updated =
          existingIdx >= 0
            ? prev.map((n, i) => (i === existingIdx ? imported : n))
            : [...prev, imported];
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        return updated;
      });
      return { name: nb.name };
    },
    []
  );

  return {
    notebooks,
    save,
    createNotebook,
    deleteNotebook,
    renameNotebook,
    getNotebookById,
    addVocab,
    updateVocab,
    deleteVocab,
    exportNotebook,
    importVocabFromJson,
    importNotebook,
  };
}
