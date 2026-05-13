"use client";

import { useState, useRef } from "react";
import { useCurriculums } from "@/hooks/useCurriculums";
import { useNotebooks } from "@/hooks/useNotebooks";
import { useGrammarCollections } from "@/hooks/useGrammarCollections";
import ExportImportPanel from "@/components/ExportImportPanel";
import Link from "next/link";
import { Vocabulary } from "@/types";

interface ParseResult {
  valid: boolean;
  type?: "curriculum" | "notebook" | "notebooks" | "curriculums" | "grammar" | "grammars";
  data?: {
    curriculumName?: string;
    lessonCount?: number;
    notebookName?: string;
    notebookCount?: number;
    curriculumCount?: number;
    vocabCount?: number;
    grammarCollectionName?: string;
    grammarPointCount?: number;
    grammarCollectionCount?: number;
  };
  error?: string;
}

function getSingleGrammarCollection(data: Record<string, unknown>) {
  const collection = (data.collection ?? data.grammarCollection) as Record<string, unknown> | undefined;
  if (collection && typeof collection === "object") {
    return collection;
  }
  return null;
}

function getMultipleGrammarCollections(data: Record<string, unknown>) {
  const collections = (data.collections ?? data.grammarCollections) as unknown;
  return Array.isArray(collections) ? (collections as Record<string, unknown>[]) : null;
}

function parseUploadedJson(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { valid: false, error: "Không thể parse JSON. Kiểm tra lại định dạng file." };
  }

  const data = raw as Record<string, unknown>;

  // Check if curriculum format
  if (data.curriculum && typeof data.curriculum === "string" && Array.isArray(data.lessons)) {
    const lessons = data.lessons as unknown[];
    let vocabCount = 0;

    for (const lesson of lessons) {
      const l = lesson as Record<string, unknown>;
      if (!l.name || !Array.isArray(l.vocabulary)) {
        return { valid: false, error: `Bài học phải có "name" và "vocabulary".` };
      }
      vocabCount += (l.vocabulary as unknown[]).length;
    }

    return {
      valid: true,
      type: "curriculum",
      data: {
        curriculumName: data.curriculum,
        lessonCount: lessons.length,
        vocabCount,
      },
    };
  }

  // Check if single notebook format
  if (data.notebook && typeof data.notebook === "object") {
    const nb = data.notebook as Record<string, unknown>;
    if (nb.name && Array.isArray(nb.vocabulary)) {
      return {
        valid: true,
        type: "notebook",
        data: {
          notebookName: nb.name as string,
          vocabCount: (nb.vocabulary as unknown[]).length,
        },
      };
    }
  }

  // Check if multiple notebooks format
  if (Array.isArray(data.notebooks)) {
    let totalVocab = 0;
    for (const nb of data.notebooks) {
      const notebook = nb as Record<string, unknown>;
      if (!notebook.name || !Array.isArray(notebook.vocabulary)) {
        return { valid: false, error: "Mỗi sổ tay phải có 'name' và 'vocabulary'." };
      }
      totalVocab += (notebook.vocabulary as unknown[]).length;
    }
    return {
      valid: true,
      type: "notebooks",
      data: {
        notebookCount: data.notebooks.length,
        vocabCount: totalVocab,
      },
    };
  }

  // Check if multiple curriculums format (export all)
  if (Array.isArray(data.curriculums)) {
    let totalLessons = 0;
    let totalVocab = 0;
    for (const curr of data.curriculums) {
      const curriculum = curr as Record<string, unknown>;
      if (!curriculum.name || !Array.isArray(curriculum.lessons)) {
        return { valid: false, error: "Mỗi giáo trình phải có 'name' và 'lessons'." };
      }
      totalLessons += (curriculum.lessons as unknown[]).length;
      for (const lesson of curriculum.lessons as unknown[]) {
        const l = lesson as Record<string, unknown>;
        if (Array.isArray(l.vocabulary)) {
          totalVocab += (l.vocabulary as unknown[]).length;
        }
      }
    }
    return {
      valid: true,
      type: "curriculums",
      data: {
        curriculumCount: data.curriculums.length,
        lessonCount: totalLessons,
        vocabCount: totalVocab,
      },
    };
  }

  // Check if single grammar collection format
  const singleGrammarCollection = getSingleGrammarCollection(data);
  if (singleGrammarCollection) {
    const coll = singleGrammarCollection;
    if (coll.name && Array.isArray(coll.grammarPoints)) {
      const pointCount = (coll.grammarPoints as unknown[]).length;
      let exampleCount = 0;
      for (const point of coll.grammarPoints as unknown[]) {
        const p = point as Record<string, unknown>;
        if (Array.isArray(p.examples)) {
          exampleCount += (p.examples as unknown[]).length;
        }
      }
      return {
        valid: true,
        type: "grammar",
        data: {
          grammarCollectionName: coll.name as string,
          grammarPointCount: pointCount,
        },
      };
    }
  }

  // Check if multiple grammar collections format
  const multipleGrammarCollections = getMultipleGrammarCollections(data);
  if (multipleGrammarCollections) {
    let totalPoints = 0;
    for (const coll of multipleGrammarCollections) {
      const collection = coll as Record<string, unknown>;
      if (!collection.name || !Array.isArray(collection.grammarPoints)) {
        return { valid: false, error: "Mỗi bộ ngữ pháp phải có 'name' và 'grammarPoints'." };
      }
      totalPoints += (collection.grammarPoints as unknown[]).length;
    }
    return {
      valid: true,
      type: "grammars",
      data: {
        grammarCollectionCount: multipleGrammarCollections.length,
        grammarPointCount: totalPoints,
      },
    };
  }

  return { valid: false, error: 'File phải có định dạng Giáo trình {"curriculum": "...", "lessons": [...]} hoặc Sổ tay {"notebook": {...}} hoặc {"notebooks": [...]} hoặc {"curriculums": [...]} hoặc Ngữ pháp {"collection": {...}} hoặc {"collections": [...]}.' };
}

export default function UploadPage() {
  const { curriculums, addCurriculum, addLessonsToExistingCurriculum } = useCurriculums();
  const { notebooks, createNotebook, addVocab, mergeVocabIntoNotebook } = useNotebooks();
  const { collections, addCollection, addGrammarPoint, addExample } = useGrammarCollections();
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [rawData, setRawData] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParsePaste = () => {
    setSaved(null);
    const res = parseUploadedJson(pasteText);
    setResult(res);
    if (res.valid) setRawData(pasteText);
  };

  const processFile = (file: File) => {
    setSaved(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawData(text);
      const res = parseUploadedJson(text);
      setResult(res);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleSave = () => {
    if (!result?.valid || !result.type || !rawData) return;

    try {
      const data = JSON.parse(rawData) as Record<string, unknown>;

      if (result.type === "curriculum") {
        const curriculumName = data.curriculum as string;
        const lessonsData = data.lessons as Record<string, unknown>[];
        
        // Check for duplicate curriculum name
        const duplicate = curriculums.find((c) => c.name.toLowerCase() === curriculumName.toLowerCase());
        if (duplicate) {
          setSaved(`❌ Giáo trình "${curriculumName}" đã tồn tại!`);
          return;
        }
        
        const newCurriculum = addCurriculum(curriculumName);
        
        // Map lessons with vocabulary IDs generated automatically
        const lessons = lessonsData.map((lessonData) => ({
          name: lessonData.name as string,
          vocabulary: (lessonData.vocabulary as Record<string, unknown>[]).map((v, idx) => ({
            id: `v-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
            kanji: v.kanji as string | undefined,
            hiragana: v.hiragana as string | undefined,
            onyomi: v.onyomi as string | undefined,
            meaning: v.meaning as string | undefined,
            phonetic: v.phonetic as string | undefined,
          }))
        }));
        
        addLessonsToExistingCurriculum(newCurriculum.id, lessons);
        
        setSaved(`✅ Đã import giáo trình "${curriculumName}" với ${lessonsData.length} bài học (${result.data?.vocabCount} từ)!`);
        
      } else if (result.type === "notebook") {
        const notebook = data.notebook as Record<string, unknown>;
        const notebookName = notebook.name as string;
        const vocabulary = notebook.vocabulary as Record<string, unknown>[];
        
        // Check if notebook with same name exists
        const existingNotebook = notebooks.find((nb) => nb.name.toLowerCase() === notebookName.toLowerCase());
        
        if (existingNotebook) {
          // Merge vocabulary into existing notebook
          const vocabToAdd = vocabulary.map((v) => ({
            kanji: v.kanji as string | undefined,
            hiragana: v.hiragana as string | undefined,
            onyomi: v.onyomi as string | undefined,
            meaning: v.meaning as string | undefined,
            phonetic: v.phonetic as string | undefined,
          }));
          
          const { added, skipped } = mergeVocabIntoNotebook(existingNotebook.id, vocabToAdd);
          
          if (added > 0 && skipped > 0) {
            setSaved(`✅ Sổ tay "${notebookName}" đã tồn tại - Thêm ${added} từ mới, bỏ qua ${skipped} từ trùng`);
          } else if (added > 0) {
            setSaved(`✅ Sổ tay "${notebookName}" đã tồn tại - Thêm ${added} từ mới`);
          } else {
            setSaved(`⚠️ Sổ tay "${notebookName}" đã tồn tại - Tất cả ${skipped} từ đều bị trùng`);
          }
        } else {
          // Create new notebook
          const newNotebook = createNotebook(notebookName);
          
          for (const vocab of vocabulary) {
            addVocab(newNotebook.id, {
              kanji: vocab.kanji as string | undefined,
              hiragana: vocab.hiragana as string | undefined,
              onyomi: vocab.onyomi as string | undefined,
              meaning: vocab.meaning as string | undefined,
              phonetic: vocab.phonetic as string | undefined,
            });
          }
          
          setSaved(`✅ Tạo sổ tay "${notebookName}" với ${vocabulary.length} từ vựng!`);
        }
        
      } else if (result.type === "notebooks") {
        const notebooksData = data.notebooks as Record<string, unknown>[];
        let created = 0;
        let merged = 0;
        const createdDetails: Array<{ name: string; vocabCount: number }> = [];
        const mergedDetails: Array<{ name: string; added: number; skipped: number }> = [];
        
        for (const nb of notebooksData) {
          const notebookName = nb.name as string;
          const vocabulary = nb.vocabulary as Record<string, unknown>[];
          
          // Check if notebook with same name exists
          const existingNotebook = notebooks.find((existing) => existing.name.toLowerCase() === notebookName.toLowerCase());
          
          if (existingNotebook) {
            // Merge vocabulary into existing notebook
            const vocabToAdd = vocabulary.map((v) => ({
              kanji: v.kanji as string | undefined,
              hiragana: v.hiragana as string | undefined,
              onyomi: v.onyomi as string | undefined,
              meaning: v.meaning as string | undefined,
              phonetic: v.phonetic as string | undefined,
            }));
            
            const { added, skipped } = mergeVocabIntoNotebook(existingNotebook.id, vocabToAdd);
            merged++;
            mergedDetails.push({ name: notebookName, added, skipped });
          } else {
            // Create new notebook
            const newNotebook = createNotebook(notebookName);
            created++;
            createdDetails.push({ name: notebookName, vocabCount: vocabulary.length });
            
            for (const vocab of vocabulary) {
              addVocab(newNotebook.id, {
                kanji: vocab.kanji as string | undefined,
                hiragana: vocab.hiragana as string | undefined,
                onyomi: vocab.onyomi as string | undefined,
                meaning: vocab.meaning as string | undefined,
                phonetic: vocab.phonetic as string | undefined,
              });
            }
          }
        }
        
        // Build detailed message
        let message = '';
        if (created > 0) {
          const totalCreatedVocab = createdDetails.reduce((sum, d) => sum + d.vocabCount, 0);
          message += `✅ Tạo mới ${created} sổ tay (${totalCreatedVocab} từ):\n`;
          createdDetails.forEach(detail => {
            message += `   • ${detail.name} (${detail.vocabCount} từ)\n`;
          });
        }
        if (merged > 0) {
          if (message) message += '\n';
          message += `🔄 Đồng bộ ${merged} sổ tay:\n`;
          mergedDetails.forEach(detail => {
            message += `   • ${detail.name}`;
            if (detail.added > 0) {
              message += ` (+${detail.added} từ mới)`;
            }
            if (detail.skipped > 0) {
              message += ` (bỏ qua ${detail.skipped} từ trùng)`;
            }
            if (detail.added === 0 && detail.skipped === 0) {
              message += ` (không có thay đổi)`;
            }
            message += '\n';
          });
        }
        setSaved(message || '✅ Hoàn tất!');
      } else if (result.type === "curriculums") {
        const curriculumsData = data.curriculums as Record<string, unknown>[];
        let imported = 0;
        let skipped = 0;
        let totalLessons = 0;
        let totalVocab = 0;
        const importedDetails: Array<{ name: string; lessons: number; vocab: number }> = [];
        const skippedNames: string[] = [];
        
        for (const curr of curriculumsData) {
          const curriculumName = curr.name as string;
          const lessonsData = curr.lessons as Record<string, unknown>[];
          
          // Check for duplicate curriculum name
          const duplicate = curriculums.find((existing) => existing.name.toLowerCase() === curriculumName.toLowerCase());
          if (duplicate) {
            skipped++;
            skippedNames.push(curriculumName);
            continue;
          }
          
          const newCurriculum = addCurriculum(curriculumName);
          imported++;
          
          let currLessons = 0;
          let currVocab = 0;
          const lessons = lessonsData.map((lessonData) => {
            const vocabList = lessonData.vocabulary as Record<string, unknown>[];
            currLessons++;
            currVocab += vocabList.length;
            totalLessons++;
            totalVocab += vocabList.length;
            return {
              name: lessonData.name as string,
              vocabulary: vocabList.map((v, idx) => ({
                id: `v-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
                kanji: v.kanji as string | undefined,
                hiragana: v.hiragana as string | undefined,
                onyomi: v.onyomi as string | undefined,
                meaning: v.meaning as string | undefined,
                phonetic: v.phonetic as string | undefined,
              }))
            };
          });
          
          importedDetails.push({ name: curriculumName, lessons: currLessons, vocab: currVocab });
          addLessonsToExistingCurriculum(newCurriculum.id, lessons);
        }
        
        // Build detailed message
        let message = '';
        if (imported > 0) {
          message += `✅ Đã import ${imported} giáo trình (${totalLessons} bài, ${totalVocab} từ):\n`;
          importedDetails.forEach(detail => {
            message += `   • ${detail.name} (${detail.lessons} bài, ${detail.vocab} từ)\n`;
          });
        }
        if (skipped > 0) {
          if (message) message += '\n';
          message += `⚠️ Bỏ qua ${skipped} giáo trình (trùng lặp):\n`;
          skippedNames.forEach(name => {
            message += `   • ${name}\n`;
          });
        }
        setSaved(message || '✅ Hoàn tất!');
      } else if (result.type === "grammar") {
        const collection = getSingleGrammarCollection(data);
        if (!collection) {
          setSaved('❌ File ngữ pháp không hợp lệ');
          return;
        }
        const collectionName = collection.name as string;
        const grammarPoints = collection.grammarPoints as Record<string, unknown>[];
        
        // Check if collection with same name exists
        const existingCollection = collections.find((c) => c.name.toLowerCase() === collectionName.toLowerCase());
        
        if (existingCollection) {
          // Merge grammar points into existing collection
          let added = 0;
          let skipped = 0;
          
          for (const pointData of grammarPoints) {
            const point = pointData as Record<string, unknown>;
            // Check if point with same structure already exists
            const isDuplicate = existingCollection.grammarPoints.some(
              (p) => p.structure.toLowerCase() === (point.structure as string)?.toLowerCase()
            );
            
            if (isDuplicate) {
              skipped++;
              continue;
            }
            
            const examples = (point.examples as Record<string, unknown>[]) || [];
            const newPoint = addGrammarPoint(
              existingCollection.id,
              {
                structure: point.structure as string,
                meaning: point.meaning as string,
                explanation: point.explanation as string | undefined,
                mnemonic: point.mnemonic as string | undefined,
                level: point.level as string | undefined,
                notes: point.notes as string | undefined,
              }
            );
            
            // Add examples to the newly added point
            for (const ex of examples) {
              addExample(
                existingCollection.id,
                newPoint.id,
                {
                  sentence: ex.sentence as string,
                  meaning: ex.meaning as string,
                  romaji: ex.romaji as string | undefined,
                  breakdown: ex.breakdown as string | undefined,
                }
              );
            }
            added++;
          }
          
          if (added > 0 && skipped > 0) {
            setSaved(`✅ Bộ ngữ pháp "${collectionName}" đã tồn tại - Thêm ${added} điểm mới, bỏ qua ${skipped} điểm trùng`);
          } else if (added > 0) {
            setSaved(`✅ Bộ ngữ pháp "${collectionName}" đã tồn tại - Thêm ${added} điểm mới`);
          } else {
            setSaved(`⚠️ Bộ ngữ pháp "${collectionName}" đã tồn tại - Tất cả ${skipped} điểm đều bị trùng`);
          }
        } else {
          // Create new collection
          const newCollection = addCollection(collectionName, collection.description as string | undefined);
          
          let pointCount = 0;
          for (const pointData of grammarPoints) {
            const point = pointData as Record<string, unknown>;
            const examples = (point.examples as Record<string, unknown>[]) || [];
            
            const newPoint = addGrammarPoint(
              newCollection.id,
              {
                structure: point.structure as string,
                meaning: point.meaning as string,
                explanation: point.explanation as string | undefined,
                mnemonic: point.mnemonic as string | undefined,
                level: point.level as string | undefined,
                notes: point.notes as string | undefined,
              }
            );
            
            // Add examples to the newly added point
            for (const ex of examples) {
              addExample(
                newCollection.id,
                newPoint.id,
                {
                  sentence: ex.sentence as string,
                  meaning: ex.meaning as string,
                  romaji: ex.romaji as string | undefined,
                  breakdown: ex.breakdown as string | undefined,
                }
              );
            }
            pointCount++;
          }
          
          setSaved(`✅ Tạo bộ ngữ pháp "${collectionName}" với ${pointCount} điểm!`);
        }
      } else if (result.type === "grammars") {
        const grammarsData = getMultipleGrammarCollections(data);
        if (!grammarsData) {
          setSaved('❌ File bộ ngữ pháp không hợp lệ');
          return;
        }
        let created = 0;
        let merged = 0;
        const createdDetails: Array<{ name: string; pointCount: number }> = [];
        const mergedDetails: Array<{ name: string; added: number; skipped: number }> = [];
        
        for (const coll of grammarsData) {
          const collectionName = coll.name as string;
          const grammarPoints = coll.grammarPoints as Record<string, unknown>[];
          
          // Check if collection with same name exists
          const existingCollection = collections.find((c) => c.name.toLowerCase() === collectionName.toLowerCase());
          
          if (existingCollection) {
            // Merge grammar points into existing collection
            let added = 0;
            let skipped = 0;
            
            for (const pointData of grammarPoints) {
              const point = pointData as Record<string, unknown>;
              // Check if point with same structure already exists
              const isDuplicate = existingCollection.grammarPoints.some(
                (p) => p.structure.toLowerCase() === (point.structure as string)?.toLowerCase()
              );
              
              if (isDuplicate) {
                skipped++;
                continue;
              }
              
              const examples = (point.examples as Record<string, unknown>[]) || [];
              const newPoint = addGrammarPoint(
                existingCollection.id,
                {
                  structure: point.structure as string,
                  meaning: point.meaning as string,
                  explanation: point.explanation as string | undefined,
                  mnemonic: point.mnemonic as string | undefined,
                  level: point.level as string | undefined,
                  notes: point.notes as string | undefined,
                }
              );
              
              // Add examples to the newly added point
              for (const ex of examples) {
                addExample(
                  existingCollection.id,
                  newPoint.id,
                  {
                    sentence: ex.sentence as string,
                    meaning: ex.meaning as string,
                    romaji: ex.romaji as string | undefined,
                    breakdown: ex.breakdown as string | undefined,
                  }
                );
              }
              added++;
            }
            
            merged++;
            mergedDetails.push({ name: collectionName, added, skipped });
          } else {
            // Create new collection
            const newCollection = addCollection(collectionName, coll.description as string | undefined);
            created++;
            
            let pointCount = 0;
            for (const pointData of grammarPoints) {
              const point = pointData as Record<string, unknown>;
              const examples = (point.examples as Record<string, unknown>[]) || [];
              
              const newPoint = addGrammarPoint(
                newCollection.id,
                {
                  structure: point.structure as string,
                  meaning: point.meaning as string,
                  explanation: point.explanation as string | undefined,
                  mnemonic: point.mnemonic as string | undefined,
                  level: point.level as string | undefined,
                  notes: point.notes as string | undefined,
                }
              );
              
              // Add examples to the newly added point
              for (const ex of examples) {
                addExample(
                  newCollection.id,
                  newPoint.id,
                  {
                    sentence: ex.sentence as string,
                    meaning: ex.meaning as string,
                    romaji: ex.romaji as string | undefined,
                    breakdown: ex.breakdown as string | undefined,
                  }
                );
              }
              pointCount++;
            }
            
            createdDetails.push({ name: collectionName, pointCount });
          }
        }
        
        // Build detailed message
        let message = '';
        if (created > 0) {
          const totalCreatedPoints = createdDetails.reduce((sum, d) => sum + d.pointCount, 0);
          message += `✅ Tạo mới ${created} bộ ngữ pháp (${totalCreatedPoints} điểm):\n`;
          createdDetails.forEach(detail => {
            message += `   • ${detail.name} (${detail.pointCount} điểm)\n`;
          });
        }
        if (merged > 0) {
          if (message) message += '\n';
          message += `🔄 Đồng bộ ${merged} bộ ngữ pháp:\n`;
          mergedDetails.forEach(detail => {
            message += `   • ${detail.name}`;
            if (detail.added > 0) {
              message += ` (+${detail.added} điểm mới)`;
            }
            if (detail.skipped > 0) {
              message += ` (bỏ qua ${detail.skipped} điểm trùng)`;
            }
            if (detail.added === 0 && detail.skipped === 0) {
              message += ` (không có thay đổi)`;
            }
            message += '\n';
          });
        }
        setSaved(message || '✅ Hoàn tất!');
      }

      // Reset
      setResult(null);
      setRawData(null);
      setPasteText("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setSaved("❌ Lỗi khi lưu dữ liệu: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Upload từ vựng</h1>
        <Link href="/" className="text-sm text-indigo-600 hover:underline">← Trang chủ</Link>
      </div>

      {/* Input mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => { setPasteMode(false); setResult(null); }}
          className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
            !pasteMode ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600 hover:border-indigo-400"
          }`}
        >
          📁 Chọn file / Kéo thả
        </button>
        <button
          onClick={() => { setPasteMode(true); setResult(null); }}
          className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
            pasteMode ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600 hover:border-indigo-400"
          }`}
        >
          📋 Dán JSON (mobile)
        </button>
      </div>

      {/* Drop zone */}
      {!pasteMode && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
            dragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400"
          }`}
        >
          <input ref={fileInputRef} type="file" accept=".json,application/json" className="sr-only" onChange={handleFileChange} />
          <p className="text-gray-500">Kéo thả file JSON vào đây hoặc <span className="text-indigo-600 underline">chọn file</span></p>
          <p className="text-xs text-gray-400 mt-1">Hỗ trợ định dạng Giáo trình, Sổ tay, hoặc Export All</p>
        </div>
      )}

      {/* Paste textarea (mobile-friendly) */}
      {pasteMode && (
        <div className="space-y-3">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Dán nội dung JSON vào đây..."
            className="w-full h-48 rounded-2xl border border-gray-300 p-4 text-sm font-mono text-gray-700 focus:outline-none focus:border-indigo-400 resize-none"
          />
          <button
            onClick={handleParsePaste}
            disabled={!pasteText.trim()}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            Kiểm tra JSON
          </button>
        </div>
      )}

      {/* Preview */}
      {result && (
        <div className={`rounded-2xl border p-4 ${result.valid ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
          {result.valid ? (
            <>
              {result.type === "curriculum" && (
                <>
                  <p className="font-semibold text-emerald-700 mb-2">✓ Định dạng Giáo trình — {result.data?.curriculumName}</p>
                  <p className="text-sm text-gray-700 mb-4">{result.data?.lessonCount} bài học • {result.data?.vocabCount} từ vựng</p>
                </>
              )}
              {result.type === "notebook" && (
                <>
                  <p className="font-semibold text-emerald-700 mb-2">✓ Định dạng Sổ tay — {result.data?.notebookName}</p>
                  <p className="text-sm text-gray-700 mb-4">{result.data?.vocabCount} từ vựng</p>
                </>
              )}
              {result.type === "notebooks" && (
                <>
                  <p className="font-semibold text-emerald-700 mb-2">✓ Định dạng Nhiều sổ tay</p>
                  <p className="text-sm text-gray-700 mb-4">{result.data?.notebookCount} sổ tay • {result.data?.vocabCount} từ vựng</p>
                </>
              )}
              {result.type === "curriculums" && (
                <>
                  <p className="font-semibold text-emerald-700 mb-2">✓ Định dạng Nhiều giáo trình</p>
                  <p className="text-sm text-gray-700 mb-4">{result.data?.curriculumCount} giáo trình • {result.data?.lessonCount} bài học • {result.data?.vocabCount} từ vựng</p>
                </>
              )}
              {result.type === "grammar" && (
                <>
                  <p className="font-semibold text-emerald-700 mb-2">✓ Định dạng Ngữ pháp — {result.data?.grammarCollectionName}</p>
                  <p className="text-sm text-gray-700 mb-4">{result.data?.grammarPointCount} điểm ngữ pháp</p>
                </>
              )}
              {result.type === "grammars" && (
                <>
                  <p className="font-semibold text-emerald-700 mb-2">✓ Định dạng Nhiều bộ ngữ pháp</p>
                  <p className="text-sm text-gray-700 mb-4">{result.data?.grammarCollectionCount} bộ ngữ pháp • {result.data?.grammarPointCount} điểm</p>
                </>
              )}
              <button
                onClick={handleSave}
                className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
              >
                Lưu vào ứng dụng
              </button>
            </>
          ) : (
            <p className="text-red-600 text-sm">✗ {result.error}</p>
          )}
        </div>
      )}

      {saved && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-emerald-700 font-semibold whitespace-pre-line">{saved}</p>
          <Link href="/" className="text-indigo-600 underline text-sm mt-1 inline-block">Xem danh sách →</Link>
        </div>
      )}

      {/* Format examples */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Định dạng hỗ trợ</h2>

        <div className="space-y-3">
          <details className="group">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-indigo-600">
              📚 Giáo trình (Curriculum)
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-xl overflow-x-auto text-gray-700">
{`{
  "curriculum": "N5 Super Master 語彙",
  "lessons": [
    {
      "name": "Bài 1 - Chào hỏi",
      "vocabulary": [
        {
          "kanji": "日本語",
          "hiragana": "にほんご",
          "onyomi": "ニホンゴ",
          "meaning": "Tiếng Nhật",
          "phonetic": "nihongo"
        }
      ]
    }
  ]
}`}
            </pre>
          </details>

          <details className="group">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-indigo-600">
              📓 Sổ tay đơn (Single Notebook)
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-xl overflow-x-auto text-gray-700">
{`{
  "notebook": {
    "name": "Từ vựng hay nhầm",
    "vocabulary": [
      {
        "kanji": "日本語",
        "hiragana": "にほんご",
        "onyomi": "ニホンゴ",
        "meaning": "Tiếng Nhật",
        "phonetic": "nihongo"
      }
    ]
  }
}`}
            </pre>
          </details>

          <details className="group">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-indigo-600">
              📚 Nhiều sổ tay (Multiple Notebooks)
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-xl overflow-x-auto text-gray-700">
{`{
  "notebooks": [
    {
      "name": "Sổ tay 1",
      "vocabulary": [
        {
          "kanji": "日本語",
          "hiragana": "にほんご",
          "meaning": "Tiếng Nhật"
        }
      ]
    },
    {
      "name": "Sổ tay 2",
      "vocabulary": [
        {
          "kanji": "学生",
          "hiragana": "がくせい",
          "meaning": "Học sinh"
        }
      ]
    }
  ]
}`}
            </pre>
          </details>

          <details className="group">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-indigo-600">
              📖 Ngữ pháp (Grammar Collection)
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-xl overflow-x-auto text-gray-700">
{`{
  "collection": {
    "name": "N5 Ngữ pháp cơ bản",
    "description": "Các điểm ngữ pháp quan trọng N5",
    "grammarPoints": [
      {
        "structure": "～ている",
        "meaning": "Đang làm, vừa làm xong",
        "explanation": "Mô tả hành động đang diễn ra hoặc trạng thái kết quả",
        "mnemonic": "Tư duy: 'ing form' trong tiếng Anh",
        "level": "N5",
        "examples": [
          {
            "sentence": "私は今、本を読んでいます。",
            "romaji": "Watashi wa ima, hon wo yonde imasu.",
            "meaning": "Tôi đang đọc sách lúc này.",
            "breakdown": "読ん (yom - đọc) + でいます (ing form)"
          }
        ],
        "notes": "Có thể diễn tả hành động hoặc trạng thái"
      }
    ]
  }
}`}
            </pre>
          </details>

          <details className="group">
            <summary className="cursor-pointer font-medium text-gray-700 hover:text-indigo-600">
              📚 Nhiều bộ ngữ pháp (Multiple Grammar Collections)
            </summary>
            <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-xl overflow-x-auto text-gray-700">
{`{
  "collections": [
    {
      "name": "N5 Ngữ pháp cơ bản",
      "grammarPoints": [
        {
          "structure": "～です/～ます",
          "meaning": "Hình thức lịch sự",
          "level": "N5",
          "examples": [
            {
              "sentence": "私は学生です。",
              "meaning": "Tôi là học sinh.",
              "breakdown": "です (to be - polite form)"
            }
          ]
        }
      ]
    },
    {
      "name": "N4 Ngữ pháp nâng cao",
      "grammarPoints": [
        {
          "structure": "～のに",
          "meaning": "Mặc dù, bất chập, để làm",
          "level": "N4",
          "examples": []
        }
      ]
    }
  ]
}`}
            </pre>
          </details>
        </div>
      </div>

      {/* Export/Import panel */}
      <ExportImportPanel />
    </div>
  );
}
