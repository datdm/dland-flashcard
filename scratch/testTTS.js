async function testTTS() {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent('こんにちは')}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    console.log('Status:', res.status, 'Content-Type:', res.headers.get('content-type'));
    const buf = await res.arrayBuffer();
    console.log('Buffer bytes:', buf.byteLength);
  } catch (err) {
    console.error('Error fetching TTS:', err);
  }
}
testTTS();
