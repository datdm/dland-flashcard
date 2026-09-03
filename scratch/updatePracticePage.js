const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'practice', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import for jlptMondaiConfig
if (!content.includes('jlptMondaiConfig')) {
  content = content.replace(
    'import { autoSync } from "@/lib/syncService";',
    `import { autoSync } from "@/lib/syncService";
import {
  getReadingMondaisForLevel as getReadingMondaiConfigs,
  getListeningMondaisForLevel as getListeningMondaiConfigs,
  JLPTMondaiInfo,
} from "@/lib/jlptMondaiConfig";`
  );
}

// 2. Expand ReadingItem & add GeneratedListeningItem interfaces
const oldReadingItemInterface = `interface ReadingItem {
  passage: string;
  passage_ruby: string;
  passage_translation: string;
  question: string;
  options: ReadingOption[];
  explanation: string;
  vocabulary?: {
    kanji: string;
    hiragana: string;
    meaning: string;
  }[];
}`;

const newReadingAndListeningInterfaces = `export interface ReadingQuestionItem {
  id: string;
  question: string;
  question_vietnamese?: string;
  options: ReadingOption[];
  explanation: string;
}

export interface ReadingItem {
  mondaiNumber?: number;
  mondaiName?: string;
  mondaiSubtitle?: string;
  title?: string;
  passage?: string;
  passage_ruby?: string;
  passage_translation?: string;
  passageA?: {
    title?: string;
    text: string;
    text_ruby: string;
    translation: string;
  };
  passageB?: {
    title?: string;
    text: string;
    text_ruby: string;
    translation: string;
  };
  notice?: {
    title: string;
    content: string;
    content_ruby: string;
    translation: string;
    scenario?: string;
  };
  questions?: ReadingQuestionItem[];
  question?: string;
  options?: ReadingOption[];
  explanation?: string;
  vocabulary?: {
    kanji: string;
    hiragana: string;
    meaning: string;
  }[];
}

export interface GeneratedListeningQuestion {
  id: string;
  question: string;
  question_vietnamese?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface GeneratedListeningItem {
  id: string;
  level: string;
  mondaiNumber: number;
  mondaiName: string;
  mondaiSubtitle: string;
  title: string;
  situation: string;
  situation_translation?: string;
  audioScript: string;
  audioScript_ruby?: string;
  vietnameseTranslation: string;
  questions?: GeneratedListeningQuestion[];
  question?: string;
  options?: string[];
  correctAnswer?: number;
  explanation?: string;
  vocabulary?: {
    kanji: string;
    hiragana: string;
    meaning: string;
  }[];
}`;

if (content.includes(oldReadingItemInterface)) {
  content = content.replace(oldReadingItemInterface, newReadingAndListeningInterfaces);
}

// 3. Add states for AI generated listening and single-select mondais
const targetStateMarker = `  // JLPT Reading & Listening by Mondai states (Japanese only)
  const [selectedReadingMondai, setSelectedReadingMondai] = useState<number | "all">("all");
  const [selectedListeningMondai, setSelectedListeningMondai] = useState<number | "all">("all");`;

const newStateBlock = `  // JLPT Reading & Listening by Mondai states (Japanese only) - single select only
  const [selectedReadingMondai, setSelectedReadingMondai] = useState<number>(() => {
    return 10;
  });
  const [selectedListeningMondai, setSelectedListeningMondai] = useState<number>(1);
  const [generatedListeningData, setGeneratedListeningData] = useState<GeneratedListeningItem | null>(null);
  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [readingChecked, setReadingChecked] = useState<Record<string, boolean>>({});
  const [genListeningAnswers, setGenListeningAnswers] = useState<Record<string, number>>({});
  const [genListeningChecked, setGenListeningChecked] = useState<Record<string, boolean>>({});
  const [showGenListeningScript, setShowGenListeningScript] = useState<boolean>(false);
  const [isGenListeningPlaying, setIsGenListeningPlaying] = useState<boolean>(false);
  const [readingViewMode, setReadingViewMode] = useState<"ai" | "extracted">("ai");
  const [listeningViewMode, setListeningViewMode] = useState<"ai" | "extracted">("ai");`;

if (content.includes(targetStateMarker)) {
  content = content.replace(targetStateMarker, newStateBlock);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated part 1 of practice/page.tsx!");
