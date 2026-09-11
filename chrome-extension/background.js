// Dland Language Flashcard - Background Service Worker

const DEFAULT_NOTEBOOK = {
  id: "nb-default-ja",
  name: "Sổ tay Tiếng Nhật",
  lang: "ja",
  createdAt: new Date().toISOString(),
  vocabulary: [],
};

// Initialize default storage and context menus
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(["dland_notebooks", "dland_api_url", "dland_web_url"]);
  if (!data.dland_notebooks || !Array.isArray(data.dland_notebooks) || data.dland_notebooks.length === 0) {
    await chrome.storage.local.set({
      dland_notebooks: [DEFAULT_NOTEBOOK],
      dland_api_url: data.dland_api_url || "http://localhost:3001",
      dland_web_url: data.dland_web_url || "http://localhost:3000",
    });
  }

  // Create context menu for quick right-click lookup
  chrome.contextMenus.create({
    id: "dland-lookup-mazii",
    title: "🔍 Tra Mazii & Thêm vào Sổ tay Dland (\"%s\")",
    contexts: ["selection"],
  });
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "dland-lookup-mazii" && info.selectionText && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: "OPEN_LOOKUP_DIALOG",
      selectedText: info.selectionText.trim(),
    });
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "LOOKUP_MAZII") {
    handleLookupMazii(request.query)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }

  if (request.action === "GET_NOTEBOOKS") {
    chrome.storage.local.get(["dland_notebooks", "dland_auth_token", "dland_user"]).then((res) => {
      sendResponse({
        notebooks: res.dland_notebooks || [DEFAULT_NOTEBOOK],
        authToken: res.dland_auth_token || null,
        user: res.dland_user || null,
      });
    });
    return true;
  }

  if (request.action === "SAVE_VOCAB") {
    handleSaveVocab(request.notebookId, request.vocab)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "SYNC_FROM_WEB_APP") {
    handleSyncFromWebApp(request.notebooks, request.authToken, request.user)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// Mazii Search API Handler
async function handleLookupMazii(query) {
  if (!query || !query.trim()) return null;
  const cleanQuery = query.trim();

  try {
    const res = await fetch("https://mazii.net/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: cleanQuery,
        dict: "javi",
        type: "word",
        limit: 5,
      }),
    });

    if (!res.ok) throw new Error("Không thể kết nối đến máy chủ Mazii");

    const json = await res.json();
    if (json.status === 200 && Array.isArray(json.data) && json.data.length > 0) {
      const bestMatch = json.data[0];

      // Parse meanings
      const meanings = [];
      let wordType = "Danh từ";

      if (Array.isArray(bestMatch.means)) {
        bestMatch.means.forEach((m) => {
          if (m.kind) {
            const k = m.kind.toLowerCase();
            if (k.includes("động từ") || k.includes("verb") || k.includes("v")) wordType = "Động từ";
            else if (k.includes("tính từ") || k.includes("adj")) wordType = "Tính từ";
            else if (k.includes("phó từ") || k.includes("adv")) wordType = "Phó từ";
          }
          if (m.mean) {
            meanings.push(m.mean);
          }
        });
      }

      const meaningText = meanings.slice(0, 3).join("; ") || bestMatch.short_mean || "";

      return {
        kanji: bestMatch.word || cleanQuery,
        hiragana: bestMatch.phonetic || bestMatch.word || cleanQuery,
        onyomi: bestMatch.han || bestMatch.hb || "",
        meaning: meaningText,
        wordType: wordType,
        level: bestMatch.level ? `N${bestMatch.level}` : undefined,
        allResults: json.data.slice(0, 3).map((item) => ({
          kanji: item.word,
          hiragana: item.phonetic,
          meaning: item.short_mean || (item.means?.[0]?.mean || ""),
          onyomi: item.han || item.hb || "",
        })),
      };
    }

    // Fallback if no direct word match
    return {
      kanji: cleanQuery,
      hiragana: cleanQuery,
      onyomi: "",
      meaning: "",
      wordType: "Danh từ",
    };
  } catch (error) {
    console.error("Mazii lookup error:", error);
    return {
      kanji: cleanQuery,
      hiragana: cleanQuery,
      onyomi: "",
      meaning: "",
      wordType: "Danh từ",
    };
  }
}

// Save Vocabulary to Notebook and Sync to Database
async function handleSaveVocab(notebookId, vocab) {
  const store = await chrome.storage.local.get([
    "dland_notebooks",
    "dland_auth_token",
    "dland_api_url",
  ]);

  let notebooks = store.dland_notebooks || [DEFAULT_NOTEBOOK];
  let targetNb = notebooks.find((nb) => nb.id === notebookId);

  // If notebook not found, use first notebook or create one
  if (!targetNb) {
    targetNb = notebooks[0] || DEFAULT_NOTEBOOK;
    notebookId = targetNb.id;
  }

  const newVocab = {
    id: `vocab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    kanji: vocab.kanji || "",
    hiragana: vocab.hiragana || "",
    meaning: vocab.meaning || "",
    onyomi: vocab.onyomi || "",
    phonetic: vocab.phonetic || "",
    wordType: vocab.wordType || "Danh từ",
    sourceType: "notebook",
    sourceName: targetNb.name,
    createdAt: new Date().toISOString(),
  };

  if (!Array.isArray(targetNb.vocabulary)) {
    targetNb.vocabulary = [];
  }

  // Check duplicate
  const exists = targetNb.vocabulary.some(
    (v) => (v.kanji && v.kanji === newVocab.kanji) || (v.hiragana && v.hiragana === newVocab.hiragana)
  );

  if (!exists) {
    targetNb.vocabulary.unshift(newVocab);
  } else {
    // Update existing
    const idx = targetNb.vocabulary.findIndex(
      (v) => (v.kanji && v.kanji === newVocab.kanji) || (v.hiragana && v.hiragana === newVocab.hiragana)
    );
    if (idx !== -1) {
      targetNb.vocabulary[idx] = { ...targetNb.vocabulary[idx], ...newVocab };
    }
  }

  // Save in local extension storage
  await chrome.storage.local.set({ dland_notebooks: notebooks });

  // Sync to backend database if token is available
  const token = store.dland_auth_token;
  const apiUrl = store.dland_api_url || "http://localhost:3001";
  let synced = false;

  if (token) {
    try {
      const syncRes = await fetch(`${apiUrl}/api/vocab/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newVocab,
          notebookId: targetNb.id,
        }),
      });

      if (syncRes.ok) {
        synced = true;
      }
    } catch (syncErr) {
      console.warn("Could not sync to remote API, saved locally:", syncErr);
    }
  }

  return {
    success: true,
    vocab: newVocab,
    notebookName: targetNb.name,
    synced,
  };
}

// Sync notebooks and credentials from Web App (localhost:3000)
async function handleSyncFromWebApp(notebooks, authToken, user) {
  const updateData = {};
  if (Array.isArray(notebooks) && notebooks.length > 0) {
    updateData.dland_notebooks = notebooks;
  }
  if (authToken) {
    updateData.dland_auth_token = authToken;
  }
  if (user) {
    updateData.dland_user = user;
  }

  await chrome.storage.local.set(updateData);
  return { success: true, count: notebooks?.length || 0 };
}
