async function testLibreTranslate() {
  const instances = [
    "https://libretranslate.com/translate",
    "https://translate.terraprint.co/translate",
    "https://libretranslate.de/translate",
    "https://translate.argosopentech.com/translate"
  ];

  for (const url of instances) {
    try {
      console.log("Testing:", url);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: "こんにちは、お元気ですか？",
          source: "ja",
          target: "vi",
          format: "text"
        })
      });
      console.log(url, "status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("Success ->", data);
        return;
      } else {
        const errText = await res.text();
        console.log("Failed ->", errText.slice(0, 100));
      }
    } catch (e) {
      console.log(url, "error:", e.message);
    }
  }
}

testLibreTranslate();
