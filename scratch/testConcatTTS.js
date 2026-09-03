async function testConcatTTS() {
  const parts = [
    "会社で女の人と男の人が話しています。",
    "山田さん、明日の企画会議の準備、進んでる？",
    "はい、会議室の予約とプロジェクターの手配はもう終わっています。"
  ];
  const buffers = [];
  for (const p of parts) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(p)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const ab = await res.arrayBuffer();
    buffers.push(Buffer.from(ab));
  }
  const combined = Buffer.concat(buffers);
  console.log('Combined MP3 bytes:', combined.byteLength);
}
testConcatTTS();
