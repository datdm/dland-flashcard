const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'exam', 'ExamQuestionCard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add import
if (!content.includes('AudioSeekPlayer')) {
  content = content.replace(
    'import { ExamQuestion, ExamSubQuestion } from "@/types/exam";',
    `import { ExamQuestion, ExamSubQuestion } from "@/types/exam";
import AudioSeekPlayer from "@/components/AudioSeekPlayer";`
  );
}

// Remove old isPlayingAudio and handleToggleAudio
const oldAudioHandlersRegex = /  const \[isPlayingAudio, setIsPlayingAudio\][\s\S]*?  \};\n/m;
content = content.replace(oldAudioHandlersRegex, '');

// Replace old audio playback block with AudioSeekPlayer
const oldAudioMarkupRegex = /\{\/\* Audio Playback for Listening questions \*\/\}[\s\S]*?\{\/\* Collapsible Listening Script \*\/\}/;

const newAudioMarkup = `{/* Audio Playback for Listening questions with seek timeline */}
      {((question as any).audioScript || (question as any).majorSection === "listening") && (
        <div className="mb-4 space-y-2">
          <AudioSeekPlayer
            textToSpeak={(question as any).audioScript || question.question}
            title={question.mondai ? \`\${question.mondai} - Câu \${index}\` : \`Câu hỏi \${index}\`}
          />
          {showResult && (question as any).audioScript && (
            <button
              type="button"
              onClick={() => setShowScript((prev) => !prev)}
              className="px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {showScript ? "Ẩn kịch bản (Script)" : "👁️ Xem kịch bản (Script) & Dịch nghĩa"}
            </button>
          )}
        </div>
      )}

      {/* Collapsible Listening Script */}`;

content = content.replace(oldAudioMarkupRegex, newAudioMarkup);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated ExamQuestionCard.tsx with AudioSeekPlayer!");
