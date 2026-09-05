async function testMirrors() {
  const mirrors = [
    "https://lt.vern.cc/translate",
    "https://translate.argosopentech.com/translate",
    "https://libretranslate.de/translate"
  ];
  for (const url of mirrors) {
    try {
      console.log("Testing mirror:", url);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: "こんにちは",
          source: "ja",
          target: "vi",
          format: "text"
        })
      });
      console.log(url, "status:", res.status);
      if (res.ok) {
        const d = await res.json();
        console.log("SUCCESS from", url, "->", d);
        return;
      }
    } catch (e) {
      console.log(url, "err:", e.message);
    }
  }
}
testMirrors();
