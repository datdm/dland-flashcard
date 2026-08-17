"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Notebook, NotebooksData, Vocabulary } from "@/types";
import { getItem, setItem, StorageKeys } from "@/lib/storage";
import { autoSync, checkAuthStatus, loadNotebooksFromServer, uploadSingleVocab, deleteVocabOnServer, patchVocabOnServer, moveVocabOnServer } from "@/lib/syncService";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function reorderByIds<T extends { id: string }>(items: T[], draggedId: string, targetId: string) {
  if (draggedId === targetId) return items;

  const fromIndex = items.findIndex((item) => item.id === draggedId);
  const toIndex = items.findIndex((item) => item.id === targetId);

  if (fromIndex === -1 || toIndex === -1) return items;

  const updated = [...items];
  const [movedItem] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, movedItem);
  return updated;
}

function getActiveLanguageCode(): string {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("dland_target_language");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return saved;
      }
    }
  }
  return "ja";
}

export function useNotebooks() {
  const [allNotebooks, setAllNotebooks] = useState<Notebook[]>(() => {
    if (typeof window !== "undefined") {
      const data = getItem<NotebooksData>(StorageKeys.NOTEBOOKS);
      if (data?.notebooks && Array.isArray(data.notebooks)) {
        return data.notebooks;
      }
    }
    return [];
  });

  const activeLang = getActiveLanguageCode();

  const notebooks = useMemo(() => {
    return allNotebooks.filter((nb) => (nb.lang || "ja") === activeLang);
  }, [allNotebooks, activeLang]);

  const refreshNotebooks = useCallback(async () => {
    // 1. Load local data first
    const data = getItem<NotebooksData>(StorageKeys.NOTEBOOKS);
    if (data?.notebooks) {
      setAllNotebooks(data.notebooks);
    }

    // 2. Sync from database if logged in
    if (checkAuthStatus()) {
      try {
        const serverData = await loadNotebooksFromServer() as any;
        const notebooksList = Array.isArray(serverData) 
          ? serverData 
          : (serverData?.notebooks || []);
        
        if (notebooksList.length > 0) {
          setAllNotebooks(notebooksList);
          setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: notebooksList });
        }
      } catch (error) {
        console.error("Failed to load notebooks from server:", error);
      }
    }
  }, []);

  useEffect(() => {
    refreshNotebooks();

    const handleUpdate = () => {
      const data = getItem<NotebooksData>(StorageKeys.NOTEBOOKS);
      if (data?.notebooks) setAllNotebooks(data.notebooks);
    };

    window.addEventListener("notebooks-updated", handleUpdate);
    return () => window.removeEventListener("notebooks-updated", handleUpdate);
  }, [refreshNotebooks]);

  const notifyChange = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("notebooks-updated"));
    }
  };

  const save = useCallback((updated: Notebook[]) => {
    setAllNotebooks((prev) => {
      const activeLang = getActiveLanguageCode();
      const others = prev.filter((nb) => (nb.lang || "ja") !== activeLang);
      const updatedWithLang = updated.map(nb => ({ ...nb, lang: nb.lang || activeLang }));
      const merged = [...others, ...updatedWithLang];
      setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: merged });
      setTimeout(() => autoSync(), 0);
      notifyChange();
      return merged;
    });
  }, []);

  // --- Notebook CRUD ---

  const createNotebook = useCallback(
    (name: string): Notebook => {
      const activeLang = getActiveLanguageCode();
      const notebook: Notebook = {
        id: generateId("nb"),
        name: name.trim(),
        createdAt: new Date().toISOString(),
        vocabulary: [],
        lang: activeLang,
      };
      setAllNotebooks((prev) => {
        const updated = [...prev, notebook];
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        setTimeout(() => autoSync(), 0);
        return updated;
      });
      return notebook;
    },
    []
  );

  const deleteNotebook = useCallback(
    (id: string) => {
      setAllNotebooks((prev) => {
        const updated = prev.filter((nb) => nb.id !== id);
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        setTimeout(() => autoSync(), 0);
        return updated;
      });
    },
    []
  );

  const renameNotebook = useCallback(
    (id: string, name: string) => {
      setAllNotebooks((prev) => {
        const updated = prev.map((nb) =>
          nb.id === id ? { ...nb, name: name.trim() } : nb
        );
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        setTimeout(() => autoSync(), 0);
        return updated;
      });
    },
    []
  );

  const reorderNotebooks = useCallback(
    (draggedNotebookId: string, targetNotebookId: string) => {
      setAllNotebooks((prev) => {
        const activeLang = getActiveLanguageCode();
        const activeList = prev.filter((nb) => (nb.lang || "ja") === activeLang);
        const otherList = prev.filter((nb) => (nb.lang || "ja") !== activeLang);
        const reorderedActive = reorderByIds(activeList, draggedNotebookId, targetNotebookId);
        if (reorderedActive === activeList) return prev;
        const updated = [...otherList, ...reorderedActive];
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        setTimeout(() => autoSync(), 0);
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
    async (
      notebookId: string,
      fields: Omit<Vocabulary, "id">,
      skipSync: boolean = false
    ): Promise<Vocabulary | null> => {
      const vocabId = generateId("v");
      const vocab: Vocabulary = { id: vocabId, ...fields };

      if (skipSync) {
        setAllNotebooks((prev) => {
          const updated = prev.map((nb) =>
            nb.id === notebookId
              ? { ...nb, vocabulary: [vocab, ...nb.vocabulary] }
              : nb
          );
          setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
          setTimeout(() => {
            autoSync();
          }, 0);
          return updated;
        });
        return vocab;
      }

      const toastId = Date.now();
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { id: toastId, message: "Đang tải lên...", type: "loading" },
        })
      );

      // Check duplicate locally first (prevents double submits or obvious duplicates)
      const normalizedKanji = fields.kanji?.trim();
      const normalizedHiragana = fields.hiragana?.trim();
      let localDup = null;
      for (const nb of notebooks) {
        const found = nb.vocabulary.find(
          (v) => v.kanji?.trim() === normalizedKanji && v.hiragana?.trim() === normalizedHiragana
        );
        if (found) {
          localDup = { notebookName: nb.name };
          break;
        }
      }

      if (localDup) {
        window.dispatchEvent(
          new CustomEvent("show-toast", {
            detail: {
              id: toastId,
              message: `Từ vựng "${fields.kanji} (${fields.hiragana})" đã tồn tại trong sổ tay "${localDup.notebookName}"!`,
              type: "error",
            },
          })
        );
        return null;
      }

      if (checkAuthStatus()) {
        const result = await uploadSingleVocab(notebookId, vocab);
        if (!result.success) {
          window.dispatchEvent(
            new CustomEvent("show-toast", {
              detail: { id: toastId, message: result.error || "Thêm từ vựng thất bại", type: "error" },
            })
          );
          return null;
        }
        
        if (result.vocab) {
          vocab.id = result.vocab.id;
          if (result.vocab.createdAt) {
            vocab.createdAt = result.vocab.createdAt;
          }
        }
      }

      setAllNotebooks((prev) => {
        const updated = prev.map((nb) =>
          nb.id === notebookId
            ? { ...nb, vocabulary: [vocab, ...nb.vocabulary] }
            : nb
        );
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        setTimeout(() => autoSync(), 0);
        return updated;
      });

      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: { id: toastId, message: "Đã thêm từ vựng thành công!", type: "success" },
        })
      );

      return vocab;
    },
    [notebooks]
  );

  const updateVocab = useCallback(
    async (notebookId: string, vocabId: string, patch: Partial<Omit<Vocabulary, "id">>) => {
      // 1. Update locally first (optimistic)
      setAllNotebooks((prev) => {
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

      // 2. Delta sync to server
      if (checkAuthStatus()) {
        const result = await patchVocabOnServer(notebookId, vocabId, patch);
        if (!result.success) {
          console.error('Patch vocab on server failed:', result.error);
          autoSync();
        }
      } else {
        autoSync();
      }
    },
    []
  );

  const deleteVocab = useCallback(
    async (notebookId: string, vocabId: string) => {
      // 1. Remove locally first (optimistic)
      setAllNotebooks((prev) => {
        const updated = prev.map((nb) =>
          nb.id === notebookId
            ? { ...nb, vocabulary: nb.vocabulary.filter((v) => v.id !== vocabId) }
            : nb
        );
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        return updated;
      });

      // 2. Delta delete on server
      if (checkAuthStatus()) {
        const result = await deleteVocabOnServer(notebookId, vocabId);
        if (!result.success) {
          console.error('Delete vocab on server failed:', result.error);
          autoSync();
        }
      } else {
        autoSync();
      }
    },
    []
  );

  const moveVocab = useCallback(
    async (fromNotebookId: string, toNotebookId: string, vocabId: string) => {
      // 1. Update locally first (optimistic)
      setAllNotebooks((prev) => {
        const sourceNotebook = prev.find((nb) => nb.id === fromNotebookId);
        const vocabToMove = sourceNotebook?.vocabulary.find((v) => v.id === vocabId);
        
        if (!vocabToMove) return prev;
        
        const updated = prev.map((nb) => {
          if (nb.id === fromNotebookId) {
            return { ...nb, vocabulary: nb.vocabulary.filter((v) => v.id !== vocabId) };
          } else if (nb.id === toNotebookId) {
            return { ...nb, vocabulary: [vocabToMove, ...nb.vocabulary] };
          }
          return nb;
        });
        
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        return updated;
      });

      // 2. Delta move on server
      if (checkAuthStatus()) {
        const result = await moveVocabOnServer([vocabId], toNotebookId);
        if (!result.success) {
          console.error('Move vocab on server failed:', result.error);
          autoSync();
        }
      } else {
        autoSync();
      }
    },
    []
  );

  const moveMultipleVocab = useCallback(
    async (fromNotebookId: string, toNotebookId: string, vocabIds: string[]) => {
      // 1. Update locally first (optimistic)
      setAllNotebooks((prev) => {
        const sourceNotebook = prev.find((nb) => nb.id === fromNotebookId);
        if (!sourceNotebook) return prev;
        
        const vocabSet = new Set(vocabIds);
        const vocabToMove = sourceNotebook.vocabulary.filter((v) => vocabSet.has(v.id));
        
        if (vocabToMove.length === 0) return prev;
        
        const updated = prev.map((nb) => {
          if (nb.id === fromNotebookId) {
            return { ...nb, vocabulary: nb.vocabulary.filter((v) => !vocabSet.has(v.id)) };
          } else if (nb.id === toNotebookId) {
            return { ...nb, vocabulary: [...vocabToMove, ...nb.vocabulary] };
          }
          return nb;
        });
        
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        return updated;
      });

      // 2. Delta move on server
      if (checkAuthStatus()) {
        const result = await moveVocabOnServer(vocabIds, toNotebookId);
        if (!result.success) {
          console.error('Move multiple vocab on server failed:', result.error);
          autoSync();
        }
      } else {
        autoSync();
      }
    },
    []
  );

  const reorderVocabInNotebook = useCallback(
    (notebookId: string, draggedVocabId: string, targetVocabId: string) => {
      setAllNotebooks((prev) => {
        const updated = prev.map((nb) =>
          nb.id === notebookId
            ? { ...nb, vocabulary: reorderByIds(nb.vocabulary, draggedVocabId, targetVocabId) }
            : nb
        );
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        setTimeout(() => autoSync(), 0);
        return updated;
      });
    },
    []
  );

  // --- Validation ---

  const checkDuplicate = useCallback(
    (notebookId: string, kanji?: string, hiragana?: string, excludeVocabId?: string): Array<{ notebookId: string; notebookName: string; vocab: Vocabulary }> | null => {
      if (!kanji?.trim() || !hiragana?.trim()) return null;
      
      const normalizedKanji = kanji.trim();
      const normalizedHiragana = hiragana.trim();
      
      const duplicates: Array<{ notebookId: string; notebookName: string; vocab: Vocabulary }> = [];
      
      for (const nb of notebooks) {
        const duplicate = nb.vocabulary.find(
          (v) =>
            v.id !== excludeVocabId &&
            v.kanji?.trim() === normalizedKanji &&
            v.hiragana?.trim() === normalizedHiragana
        );
        
        if (duplicate) {
          duplicates.push({
            notebookId: nb.id,
            notebookName: nb.name,
            vocab: duplicate,
          });
        }
      }
      
      return duplicates.length > 0 ? duplicates : null;
    },
    [notebooks]
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

  const exportAllNotebooks = useCallback(
    (): string => {
      return JSON.stringify({ notebooks }, null, 2);
    },
    [notebooks]
  );

  const mergeVocabIntoNotebook = useCallback(
    (notebookId: string, vocabularyToAdd: Array<Omit<Vocabulary, "id">>): { added: number; skipped: number } => {
      let added = 0;
      let skipped = 0;
      
      setAllNotebooks((prev) => {
        const notebook = prev.find((nb) => nb.id === notebookId);
        if (!notebook) return prev;
        
        const toAdd: Vocabulary[] = [];
        
        for (const vocab of vocabularyToAdd) {
          const isDuplicate = notebook.vocabulary.some((existing) => {
            const kanjiMatch = vocab.kanji?.trim() && existing.kanji?.trim() === vocab.kanji.trim();
            const hiraganaMatch = vocab.hiragana?.trim() && existing.hiragana?.trim() === vocab.hiragana.trim();
            return kanjiMatch || hiraganaMatch;
          });
          
          if (isDuplicate) {
            skipped++;
          } else {
            const newVocab: Vocabulary = {
              id: generateId("v"),
              kanji: vocab.kanji,
              hiragana: vocab.hiragana,
              onyomi: vocab.onyomi,
              meaning: vocab.meaning,
              phonetic: vocab.phonetic,
            };
            toAdd.push(newVocab);
            added++;
          }
        }
        
        const updated = prev.map((nb) =>
          nb.id === notebookId
            ? { ...nb, vocabulary: [...toAdd, ...nb.vocabulary] }
            : nb
        );
        
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        setTimeout(() => autoSync(), 0);
        return updated;
      });
      
      return { added, skipped };
    },
    []
  );

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
      setAllNotebooks((prev) => {
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
        setTimeout(() => autoSync(), 0);
        return updated;
      });
      return { imported: count };
    },
    []
  );

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
      setAllNotebooks((prev) => {
        const activeLang = getActiveLanguageCode();
        const existingIdx = prev.findIndex((n) => n.id === nb.id);
        const imported: Notebook = {
          id: nb.id ?? generateId("nb"),
          name: nb.name!,
          createdAt: nb.createdAt ?? new Date().toISOString(),
          vocabulary: Array.isArray(nb.vocabulary) ? nb.vocabulary : [],
          lang: nb.lang ?? activeLang,
        };
        const updated =
          existingIdx >= 0
            ? prev.map((n, i) => (i === existingIdx ? imported : n))
            : [...prev, imported];
        setItem<NotebooksData>(StorageKeys.NOTEBOOKS, { notebooks: updated });
        setTimeout(() => autoSync(), 0);
        return updated;
      });
      return { name: nb.name };
    },
    []
  );

  return {
    notebooks,
    refreshNotebooks,
    save,
    createNotebook,
    deleteNotebook,
    renameNotebook,
    reorderNotebooks,
    getNotebookById,
    addVocab,
    updateVocab,
    deleteVocab,
    moveVocab,
    moveMultipleVocab,
    reorderVocabInNotebook,
    checkDuplicate,
    exportNotebook,
    exportAllNotebooks,
    importVocabFromJson,
    importNotebook,
    mergeVocabIntoNotebook,
  };
}
