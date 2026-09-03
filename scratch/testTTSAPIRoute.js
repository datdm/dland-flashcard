async function splitAndFetchTTS(text, lang = "ja") {
  // Split into chunks under 150 chars by punctuation
  const clean = text.replace(/<[^>]+>/g, '').trim();
  const sentences = clean.split(/([。\n！？\.\!\?]+)/).filter(Boolean);
  const chunks = [];
  let current = "";

  for (let i = 0; i < sentences.length; i++) {
    const s = sentences[i];
    if ((current + s).length > 150 && current.length > 0) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  console.log(`Split into ${chunks.length} chunks:`, chunks);

  const buffers = [];
  for (const chunk of chunks) {
    if (!chunk) continue;
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    if (!res.ok) throw new Error(`TTS fetch failed: ${res.status}`);
    const ab = await res.arrayBuffer();
    buffers.push(Buffer.from(ab));
  }

  const combined = Buffer.concat(buffers);
  console.log(`Total MP3 size: ${combined.byteLength} bytes`);
  return combined;
}

splitAndFetchTTS("会社で女の人と男の人が話しています。\n女：山田さん、明日の企画会議の準備、進んでる？\n男：はい、会議室の予約とプロジェクターの手配はもう終わっています。配布資料もコピーしました。\n女：あ、その資料なんだけど、さっき部長から売上データのグラフに一部修正が入ったって連絡があったの。修正版のデータをメールで送ったから、差し替えてもう一度印刷し直してくれる？\n男：分かりました。じゃあ、古い資料を破棄して、修正版を印刷します。");
