const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'practice', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update stopAllAudio to stop generated listening playing
content = content.replace(
  `const stopAllAudio = () => {
    isAutoplayingKaiwaRef.current = false;
    setIsAutoplayingKaiwa(false);
    setKaiwaPlayingIdx(null);
    setListeningPlayingId(null);`,
  `const stopAllAudio = () => {
    isAutoplayingKaiwaRef.current = false;
    setIsAutoplayingKaiwa(false);
    setKaiwaPlayingIdx(null);
    setListeningPlayingId(null);
    setIsGenListeningPlaying(false);`
);

// 2. Add handlers for AI listening and reading right after stopAllAudio
const helperMethods = `
  // Effect to auto-select valid mondai when level changes
  useEffect(() => {
    if (selectedLang === "ja") {
      const rList = getReadingMondaiConfigs(selectedLevel);
      if (rList.length > 0 && !rList.some((m) => m.mondaiNumber === selectedReadingMondai)) {
        setSelectedReadingMondai(rList[0].mondaiNumber);
      }
      const lList = getListeningMondaiConfigs(selectedLevel);
      if (lList.length > 0 && !lList.some((m) => m.mondaiNumber === selectedListeningMondai)) {
        setSelectedListeningMondai(lList[0].mondaiNumber);
      }
    }
  }, [selectedLevel, selectedLang]);

  // Audio player for AI generated listening
  const playGeneratedListeningAudio = (item: GeneratedListeningItem) => {
    if (typeof window === "undefined") return;
    if (isGenListeningPlaying) {
      window.speechSynthesis.cancel();
      setIsGenListeningPlaying(false);
      return;
    }

    stopAllAudio();
    setIsGenListeningPlaying(true);

    let textToSpeak = "";
    if (item.mondaiNumber === 1 || item.mondaiNumber === 2) {
      const qText = item.questions?.[0]?.question || item.question || "";
      textToSpeak = \`\${item.situation}。\\n質問：\${qText}。\\n\${item.audioScript}。\\n質問：\${qText}\`;
    } else if (item.mondaiNumber === 3) {
      const qText = item.questions?.[0]?.question || item.question || "";
      textToSpeak = \`\${item.situation}。\\n\${item.audioScript}。\\n質問：\${qText}\`;
    } else if (item.mondaiNumber === 4) {
      const opts = (item.questions?.[0]?.options || item.options || []).map((o, idx) => \`\${idx + 1}、\${o}\`).join("。\\n");
      textToSpeak = \`\${item.situation}。\\n\${item.audioScript}。\\n\${opts}\`;
    } else if (item.mondaiNumber === 5) {
      const q1 = item.questions?.[0]?.question ? \`質問1：\${item.questions[0].question}\` : "";
      const q2 = item.questions?.[1]?.question ? \`質問2：\${item.questions[1].question}\` : "";
      textToSpeak = \`\${item.situation}。\\n\${item.audioScript}。\\n\${q1}。\\n\${q2}\`;
    } else {
      textToSpeak = \`\${item.situation}。\\n\${item.audioScript}。\\n質問：\${item.question || ""}\`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "ja-JP";
    utterance.rate = playbackRate;
    utterance.onend = () => {
      setIsGenListeningPlaying(false);
    };
    utterance.onerror = () => {
      setIsGenListeningPlaying(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  // Check generated reading answer
  const checkGeneratedReadingAnswer = (qItem: ReadingQuestionItem) => {
    const selectedOptId = readingAnswers[qItem.id];
    if (!selectedOptId) return;

    setReadingChecked((prev) => ({ ...prev, [qItem.id]: true }));
    const correctOpt = qItem.options.find((o) => o.isCorrect);
    const isCorrect = selectedOptId === correctOpt?.id;
    const score = isCorrect ? 100 : 0;

    const chosenOpt = qItem.options.find((o) => o.id === selectedOptId);

    recordPracticeHistory({
      type: "reading",
      typeName: \`📚 Đọc hiểu JLPT \${selectedLevel} (Mondai \${readingData?.mondaiNumber || selectedReadingMondai})\`,
      topic: readingData?.title || activeTopic,
      lang: "ja",
      score,
      userAnswer: chosenOpt?.text || selectedOptId,
      correctAnswer: correctOpt?.text || "Đáp án đúng",
      feedback: isCorrect ? "Chính xác! Bạn phân tích bài đọc rất tốt." : (qItem.explanation || "Chưa chính xác. Hãy đọc lại dẫn chứng trong bài."),
    });
  };

  // Check generated listening answer
  const checkGeneratedListeningAnswer = (qItem: GeneratedListeningQuestion) => {
    const selectedIdx = genListeningAnswers[qItem.id];
    if (selectedIdx === undefined) return;

    setGenListeningChecked((prev) => ({ ...prev, [qItem.id]: true }));
    const isCorrect = selectedIdx === qItem.correctAnswer;
    const score = isCorrect ? 100 : 0;

    recordPracticeHistory({
      type: "shadowing",
      typeName: \`🎧 Nghe hiểu JLPT \${selectedLevel} (Mondai \${generatedListeningData?.mondaiNumber || selectedListeningMondai})\`,
      topic: generatedListeningData?.title || activeTopic,
      lang: "ja",
      score,
      userAnswer: qItem.options[selectedIdx] || \`Lựa chọn \${selectedIdx + 1}\`,
      correctAnswer: qItem.options[qItem.correctAnswer] || \`Lựa chọn \${qItem.correctAnswer + 1}\`,
      feedback: isCorrect ? "Chính xác! Bạn nghe bắt thông tin rất chuẩn." : (qItem.explanation || "Chưa chính xác. Hãy mở kịch bản (Script) để nghe lại kỹ."),
    });
  };
`;

content = content.replace(
  `  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);`,
  `  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);\n` + helperMethods
);

// 3. Update handleGenerate to reset listening and pass mondaiNumber
const oldHandleGenerateBody = `      const res = await fetch("/api/practice/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: selectedType === "presentation" ? "presentation_slides" : selectedType,
          topic: activeTopic,
          level: selectedLevel,
          lang: selectedLang,
          seed: Math.floor(Math.random() * 1000000),
          nonce: Date.now(),
        }),
      });`;

const newHandleGenerateBody = `      const res = await fetch("/api/practice/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: selectedType === "presentation" ? "presentation_slides" : selectedType,
          topic: activeTopic,
          level: selectedLevel,
          lang: selectedLang,
          mondaiNumber: selectedType === "reading" ? selectedReadingMondai : selectedType === "listening" ? selectedListeningMondai : undefined,
          seed: Math.floor(Math.random() * 1000000),
          nonce: Date.now(),
        }),
      });`;

content = content.replace(oldHandleGenerateBody, newHandleGenerateBody);

// In handleGenerate resets:
content = content.replace(
  `    setSelectedOptionId(null);
    setShowAnswerIdx({});
    setTranslationInputs({});
    setShowPassageTranslation(false);`,
  `    setSelectedOptionId(null);
    setShowAnswerIdx({});
    setTranslationInputs({});
    setShowPassageTranslation(false);
    setReadingAnswers({});
    setReadingChecked({});
    setGenListeningAnswers({});
    setGenListeningChecked({});
    setShowGenListeningScript(false);
    setIsGenListeningPlaying(false);`
);

// In handleGenerate response handling:
content = content.replace(
  `} else if (selectedType === "reading") {
          setReadingData(resData.data.reading || null);
        } else if (selectedType === "presentation") {`,
  `} else if (selectedType === "reading") {
          setReadingData(resData.data.reading || null);
          setReadingViewMode("ai");
        } else if (selectedType === "listening") {
          setGeneratedListeningData(resData.data.listening || null);
          setListeningViewMode("ai");
        } else if (selectedType === "presentation") {`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully updated part 2 (handlers and handleGenerate)!");
