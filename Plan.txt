=======================================================
  FlashCash — Ứng dụng Flashcard Học Tiếng Nhật JLPT
  Công nghệ: Next.js 16 (App Router) + TypeScript + Tailwind CSS
  Lưu trữ:   localStorage (không cần backend/database)
  Deploy:     Local (npm run dev) + Vercel (npm run build)
=======================================================


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CẤU TRÚC DỰ ÁN (SOURCE ĐÃ GENERATE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

src/
├── types/
│   └── index.ts                 TypeScript interfaces + constants
│       • Vocabulary             id, kanji?, hiragana?, onyomi?, meaning?, phonetic?
│       • Lesson                 id, name, description?, level?, vocabulary[]
│       • LessonsData            { lessons: Lesson[] }
│       • VocabProgress          learned, favorite, learnedAt?
│       • ProgressMap            Record<vocabId, VocabProgress>
│       • VocabField             "kanji"|"hiragana"|"onyomi"|"meaning"|"phonetic"
│       • CardSideSettings       boolean flags per field
│       • FlashCardSettings      { front, back: CardSideSettings }
│       • FIELD_LABELS           Record<VocabField, string> (tiếng Việt)
│       • ALL_FIELDS             VocabField[] (thứ tự hiển thị)
│       • DEFAULT_SETTINGS       front=[kanji,hiragana], back=[onyomi,meaning,phonetic]
│       • JLPT_LEVELS            ["N5","N4","N3","N2","N1"] as const
│
├── lib/
│   ├── storage.ts               localStorage helpers
│   │   • getItem<T>(key)
│   │   • setItem<T>(key, value)
│   │   • removeItem(key)
│   │   • exportAllData() → JSON string (tất cả 3 keys)
│   │   • importAllData(jsonString)
│   │   • StorageKeys.LESSONS / PROGRESS / SETTINGS
│   │     ↳ keys: "flashcash-lessons", "flashcash-progress", "flashcash-settings"
│   └── shuffle.ts               Fisher-Yates shuffle<T>(arr) → T[]
│
├── hooks/
│   ├── useLessons.ts            CRUD bài học
│   │   • lessons: Lesson[]
│   │   • saveLessons(lessons)   — thay thế toàn bộ
│   │   • addLessons(incoming)   — merge theo id (upsert)
│   │   • deleteLesson(id)
│   │   • getLessonById(id)
│   ├── useProgress.ts           Trạng thái học từng từ
│   │   • progress: ProgressMap
│   │   • toggleLearned(id)      — cập nhật learnedAt timestamp
│   │   • toggleFavorite(id)
│   │   • updateProgress(id, patch)
│   │   • getVocabProgress(id) → VocabProgress
│   └── useFlashCardSettings.ts  Cài đặt hiển thị card
│       • settings: FlashCardSettings
│       • saveSettings(settings)
│
├── components/
│   ├── Navbar.tsx               Navigation
│   │   • Desktop: sticky top bar với links
│   │   • Mobile: sticky top title + fixed bottom tab bar (4 tabs)
│   │   • Active tab detection với usePathname
│   ├── FlashCard.tsx            3D flip card
│   │   • CSS perspective + rotateY animation (500ms)
│   │   • Mặt trước: bg-white, mặt sau: bg-indigo-50
│   │   • Mỗi field hiển thị theo màu riêng (kanji=gray-800, hiragana=indigo-700...)
│   │   • backfaceVisibility hidden để ẩn mặt kia khi lật
│   ├── FlashCardViewer.tsx      Session học flashcard đầy đủ
│   │   • Props: vocabulary[], title?
│   │   • State: deck[], index, flipped, shuffled, filterUnlearned, showSettings
│   │   • Touch gestures: swipe phải → next, swipe trái → prev (threshold 80px)
│   │   • Ignore vertical swipe (scroll)
│   │   • Thanh tiến độ + counter "X / N"
│   │   • Nút: Chưa học filter | 🔀 Trộn | ⚙ Cài đặt | ★ Yêu thích | ✓ Đã học
│   │   • Navigation: ← Trước | Bắt đầu lại | Sau →
│   │   • Hint text mobile: "← Vuốt trái/phải để chuyển thẻ →"
│   │   • Tất cả buttons: min-h-[44px] (WCAG touch target)
│   ├── FlashCardSettingsPanel.tsx  Modal cài đặt fields
│   │   • Overlay backdrop + centered card
│   │   • 2x FieldSelector (mặt trước / mặt sau)
│   │   • Lưu ngay khi thay đổi (realtime)
│   ├── FieldSelector.tsx        Checkbox chọn field hiển thị
│   │   • Dạng pill buttons (toggle bg-indigo-600 khi active)
│   │   • Checkbox ẩn (sr-only), label là toàn bộ pill
│   ├── LevelTabBar.tsx          Tabs lọc theo cấp độ JLPT
│   │   • Props: levels[], active, onChange
│   │   • Tabs: "Tất cả" + mỗi level trong data
│   │   • Overflow scroll ngang (no-scrollbar)
│   │   • Sinh động từ data, không hard-code
│   ├── LessonCard.tsx           Card bài học
│   │   • Tên bài + mô tả (truncate)
│   │   • Badge số từ vựng
│   │   • Progress bar: X/total đã học + phần trăm
│   │   • 2 buttons: Danh sách | Flashcard
│   ├── VocabularyListItem.tsx   Row từ vựng trong danh sách
│   │   • Grid 2-3 cột: kanji (xl bold) | hiragana (indigo) | onyomi (purple) | meaning (emerald) | phonetic (italic)
│   │   • Toggle ★ yêu thích (min-h/w 44px)
│   │   • Toggle ✓ đã học (min-h/w 44px, circle border)
│   │   • Background xanh nhạt khi learned=true
│   ├── FilterBar.tsx            Tab filter danh sách từ
│   │   • Tabs: Tất cả | Chưa học | Đã học | Yêu thích
│   │   • Hiện số lượng mỗi tab
│   └── ExportImportPanel.tsx    Đồng bộ dữ liệu
│       • Export: tạo Blob JSON → download file backup-YYYY-MM-DD.json
│       • Import: file input → FileReader → importAllData → success message
│
└── app/
    ├── layout.tsx               Root layout
    │   • Geist font, lang="vi"
    │   • bg-gray-50 body
    │   • <Navbar /> + <main pb-24>
    ├── globals.css              Tailwind import + CSS variables
    ├── page.tsx                 Trang chủ (/)
    │   • LevelTabBar động từ levels có trong data
    │   • State activeLevel → filter lessons
    │   • Stats: Bài học | Đã học | Chưa học (theo level đang chọn)
    │   • Button "Ôn tập [level]" → /flashcard/level/N5
    │     hoặc "Ôn tập tổng hợp" → /flashcard/all
    │   • Danh sách LessonCard
    ├── lessons/[id]/page.tsx    Chi tiết bài học
    │   • Tiêu đề + mô tả bài
    │   • Button Flashcard →
    │   • Danh sách VocabularyListItem
    ├── flashcard/
    │   ├── lesson/[id]/page.tsx  Flashcard theo bài
    │   ├── level/[level]/page.tsx  Flashcard tất cả từ của 1 cấp độ
    │   └── all/page.tsx          Flashcard tổng hợp tất cả từ
    ├── vocabulary/page.tsx      Danh sách từ vựng toàn bộ
    │   • FilterBar (Tất cả/Chưa/Đã/Yêu thích)
    │   • Danh sách VocabularyListItem
    └── upload/page.tsx          Quản lý từ vựng
        • Toggle: Chọn file/Kéo thả | Dán JSON (mobile)
        • Drop zone với drag-over effect
        • Textarea paste JSON (iOS-friendly)
        • Validate JSON → preview bài học → nút "Lưu vào ứng dụng"
        • Cảnh báo ID trùng lặp
        • Danh sách bài hiện tại nhóm theo level + nút Xoá
        • ExportImportPanel (backup/restore)
        • Xem JSON mẫu (details/summary)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ĐỊNH DẠNG JSON UPLOAD (v2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  "lessons": [
    {
      "id":          "n5-bai-1",        // Bắt buộc, unique
      "name":        "Bài 1 - Chào hỏi",  // Bắt buộc
      "level":       "N5",              // Tùy chọn (N5/N4/N3/N2/N1 hoặc custom)
      "description": "Mô tả bài học",   // Tùy chọn
      "vocabulary": [
        {
          "id":       "n5-001",         // Bắt buộc, unique toàn app
          "kanji":    "日本語",          // Tùy chọn
          "hiragana": "にほんご",        // Tùy chọn
          "onyomi":   "ニホンゴ",        // Tùy chọn (Katakana / Âm Hán)
          "meaning":  "Tiếng Nhật",     // Tùy chọn
          "phonetic": "nihongo"         // Tùy chọn (romaji / phiên âm)
        }
      ]
    }
  ]
}

Ghi chú:
• Tất cả fields trong vocabulary đều tùy chọn (trừ id)
• Field "level" tùy chọn — backward compatible với JSON cũ không có level
• Nếu không có level → bài hiện ở tab "Tất cả", không có tab riêng
• ID phải unique; upload page cảnh báo nếu trùng (không block)
• Có thể upload nhiều lần → bài cùng id sẽ được cập nhật (upsert)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TÍNH NĂNG CHI TIẾT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FLASHCARD SESSION
  • Lật thẻ: nhấn vào card
  • Swipe phải/trái (mobile): chuyển thẻ tiếp/trước
  • Mặt trước/sau hiển thị theo cài đặt (checkbox fields)
  • Cài đặt lưu vào localStorage → giữ nguyên sau reload
  • Default: mặt trước = Kanji + Hiragana; mặt sau = Âm Hán + Nghĩa + Phiên Âm
  • Trộn ngẫu nhiên (Fisher-Yates) → toggle on/off
  • Lọc "Chưa học" → chỉ hiện từ chưa đánh dấu
  • Đánh dấu ★ Yêu thích / ✓ Đã học trực tiếp trên session
  • Thanh tiến độ ở đầu + counter X/N

ĐA CẤP ĐỘ JLPT
  • Field "level" trong JSON → tự động tạo tabs N5/N4/...
  • Thứ tự tabs: N5→N4→N3→N2→N1→(custom levels)→Tất cả
  • Mỗi tab: stats riêng (bài học, đã học, chưa học)
  • Nút ôn tập chuyển sang /flashcard/level/N5 khi đang filter N5
  • Route /flashcard/level/[level] cho từng cấp độ

QUẢN LÝ DỮ LIỆU (localStorage)
  • flashcash-lessons  → toàn bộ bài học + từ vựng
  • flashcash-progress → trạng thái đã học/yêu thích per vocabId
  • flashcash-settings → cài đặt hiển thị card
  • Export → tải file JSON chứa cả 3 keys
  • Import → khôi phục cả 3 keys từ file backup


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ROUTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/                           Trang chủ (level tabs + lesson list)
/lessons/[id]               Chi tiết bài học + vocab list
/flashcard/lesson/[id]      Flashcard session theo bài
/flashcard/level/[level]    Flashcard session theo cấp độ (N5/N4/...)
/flashcard/all              Flashcard tổng hợp tất cả từ
/vocabulary                 Danh sách từ + filter tabs
/upload                     Upload JSON + quản lý bài + export/import


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SCRIPTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

npm run dev     Khởi động dev server → http://localhost:3000
npm run build   Build production (kiểm tra TypeScript errors)
npm start       Chạy production build

File mẫu: public/sample-vocabulary.json (2 bài N5, 11 từ)