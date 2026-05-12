"use client";

import { useState, useEffect, useCallback } from "react";
import { GrammarCollection, GrammarCollectionsData, GrammarPoint, GrammarExample } from "@/types";
import { getItem, setItem, StorageKeys } from "@/lib/storage";

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useGrammarCollections() {
  const [collections, setCollections] = useState<GrammarCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const data = getItem<GrammarCollectionsData>(StorageKeys.GRAMMAR_COLLECTIONS);
      if (data?.collections) {
        setCollections(data.collections);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const save = useCallback((updated: GrammarCollection[]) => {
    setCollections(updated);
    setItem<GrammarCollectionsData>(StorageKeys.GRAMMAR_COLLECTIONS, { collections: updated });
  }, []);

  // --- Collection CRUD ---

  const addCollection = useCallback(
    (name: string, description?: string): GrammarCollection => {
      const collection: GrammarCollection = {
        id: generateId("gc"),
        name: name.trim(),
        description: description?.trim(),
        createdAt: new Date().toISOString(),
        grammarPoints: [],
      };
      setCollections((prev) => {
        const updated = [...prev, collection];
        setItem<GrammarCollectionsData>(StorageKeys.GRAMMAR_COLLECTIONS, { collections: updated });
        return updated;
      });
      return collection;
    },
    []
  );

  const updateCollection = useCallback(
    (id: string, updates: { name?: string; description?: string }) => {
      setCollections((prev) => {
        const updated = prev.map((c) =>
          c.id === id
            ? {
                ...c,
                ...(updates.name !== undefined && { name: updates.name.trim() }),
                ...(updates.description !== undefined && { description: updates.description.trim() }),
              }
            : c
        );
        setItem<GrammarCollectionsData>(StorageKeys.GRAMMAR_COLLECTIONS, { collections: updated });
        return updated;
      });
    },
    []
  );

  const deleteCollection = useCallback(
    (id: string) => {
      setCollections((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        setItem<GrammarCollectionsData>(StorageKeys.GRAMMAR_COLLECTIONS, { collections: updated });
        return updated;
      });
    },
    []
  );

  const getCollectionById = useCallback(
    (id: string) => collections.find((c) => c.id === id),
    [collections]
  );

  // --- Grammar Point CRUD ---

  const addGrammarPoint = useCallback(
    (
      collectionId: string,
      data: {
        structure: string;
        meaning: string;
        explanation?: string;
        mnemonic?: string;
        level?: string;
        notes?: string;
      }
    ): GrammarPoint => {
      const grammarPoint: GrammarPoint = {
        id: generateId("gp"),
        structure: data.structure.trim(),
        meaning: data.meaning.trim(),
        explanation: data.explanation?.trim(),
        mnemonic: data.mnemonic?.trim(),
        level: data.level,
        notes: data.notes?.trim(),
        examples: [],
        relatedGrammar: [],
      };

      setCollections((prev) => {
        const updated = prev.map((c) =>
          c.id === collectionId
            ? { ...c, grammarPoints: [...c.grammarPoints, grammarPoint] }
            : c
        );
        setItem<GrammarCollectionsData>(StorageKeys.GRAMMAR_COLLECTIONS, { collections: updated });
        return updated;
      });

      return grammarPoint;
    },
    []
  );

  const updateGrammarPoint = useCallback(
    (
      collectionId: string,
      grammarId: string,
      updates: Partial<Omit<GrammarPoint, "id" | "examples">>
    ) => {
      setCollections((prev) => {
        const updated = prev.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                grammarPoints: c.grammarPoints.map((gp) =>
                  gp.id === grammarId ? { ...gp, ...updates } : gp
                ),
              }
            : c
        );
        setItem<GrammarCollectionsData>(StorageKeys.GRAMMAR_COLLECTIONS, { collections: updated });
        return updated;
      });
    },
    []
  );

  const deleteGrammarPoint = useCallback(
    (collectionId: string, grammarId: string) => {
      setCollections((prev) => {
        const updated = prev.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                grammarPoints: c.grammarPoints.filter((gp) => gp.id !== grammarId),
              }
            : c
        );
        setItem<GrammarCollectionsData>(StorageKeys.GRAMMAR_COLLECTIONS, { collections: updated });
        return updated;
      });
    },
    []
  );

  const getGrammarPointById = useCallback(
    (collectionId: string, grammarId: string) => {
      const collection = collections.find((c) => c.id === collectionId);
      return collection?.grammarPoints.find((gp) => gp.id === grammarId);
    },
    [collections]
  );

  // --- Example CRUD ---

  const addExample = useCallback(
    (
      collectionId: string,
      grammarId: string,
      data: {
        sentence: string;
        meaning: string;
        romaji?: string;
        breakdown?: string;
      }
    ): GrammarExample => {
      const example: GrammarExample = {
        id: generateId("ex"),
        sentence: data.sentence.trim(),
        meaning: data.meaning.trim(),
        romaji: data.romaji?.trim(),
        breakdown: data.breakdown?.trim(),
      };

      setCollections((prev) => {
        const updated = prev.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                grammarPoints: c.grammarPoints.map((gp) =>
                  gp.id === grammarId
                    ? { ...gp, examples: [...gp.examples, example] }
                    : gp
                ),
              }
            : c
        );
        setItem<GrammarCollectionsData>(StorageKeys.GRAMMAR_COLLECTIONS, { collections: updated });
        return updated;
      });

      return example;
    },
    []
  );

  const updateExample = useCallback(
    (
      collectionId: string,
      grammarId: string,
      exampleId: string,
      updates: Partial<Omit<GrammarExample, "id">>
    ) => {
      setCollections((prev) => {
        const updated = prev.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                grammarPoints: c.grammarPoints.map((gp) =>
                  gp.id === grammarId
                    ? {
                        ...gp,
                        examples: gp.examples.map((ex) =>
                          ex.id === exampleId ? { ...ex, ...updates } : ex
                        ),
                      }
                    : gp
                ),
              }
            : c
        );
        setItem<GrammarCollectionsData>(StorageKeys.GRAMMAR_COLLECTIONS, { collections: updated });
        return updated;
      });
    },
    []
  );

  const deleteExample = useCallback(
    (collectionId: string, grammarId: string, exampleId: string) => {
      setCollections((prev) => {
        const updated = prev.map((c) =>
          c.id === collectionId
            ? {
                ...c,
                grammarPoints: c.grammarPoints.map((gp) =>
                  gp.id === grammarId
                    ? {
                        ...gp,
                        examples: gp.examples.filter((ex) => ex.id !== exampleId),
                      }
                    : gp
                ),
              }
            : c
        );
        setItem<GrammarCollectionsData>(StorageKeys.GRAMMAR_COLLECTIONS, { collections: updated });
        return updated;
      });
    },
    []
  );

  // --- Export / Import ---

  const exportCollection = useCallback(
    (collectionId: string): string => {
      const collection = collections.find((c) => c.id === collectionId);
      if (!collection) return "{}";
      const data = {
        grammarCollection: {
          name: collection.name,
          description: collection.description,
          grammarPoints: collection.grammarPoints,
        },
      };
      return JSON.stringify(data, null, 2);
    },
    [collections]
  );

  const exportAllCollections = useCallback(
    (): string => {
      const data = {
        grammarCollections: collections.map((c) => ({
          name: c.name,
          description: c.description,
          grammarPoints: c.grammarPoints,
        })),
      };
      return JSON.stringify(data, null, 2);
    },
    [collections]
  );

  return {
    collections,
    isLoading,
    save,
    addCollection,
    updateCollection,
    deleteCollection,
    getCollectionById,
    addGrammarPoint,
    updateGrammarPoint,
    deleteGrammarPoint,
    getGrammarPointById,
    addExample,
    updateExample,
    deleteExample,
    exportCollection,
    exportAllCollections,
  };
}
