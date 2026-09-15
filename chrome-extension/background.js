// Dland Language Flashcard - Background Service Worker (Manifest V3)

const DEFAULT_WEB_URL = "https://flashcard-japanese-eight.vercel.app";
const DEFAULT_API_URL = "https://flashcard-japanese-be.onrender.com";

// Default admin passcodes that can unlock Admin-only URL configuration
const VALID_ADMIN_KEYS = ["admin", "admin123", "dland@admin", "dlandadmin", "secret", "888888"];

const DEFAULT_NOTEBOOK = {
  id: "nb-default-ja",
  name: "Sổ tay Tiếng Nhật",
  lang: "ja",
  createdAt: new Date().toISOString(),
  vocabulary: [],
};

// Initialize default storage and context menus
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get([
    "dland_notebooks",
    "dland_api_url",
    "dland_web_url",
    "dland_auto_sync",
    "dland_tooltip_enabled",
  ]);

  const toSet = {};
  if (!data.dland_notebooks || !Array.isArray(data.dland_notebooks) || data.dland_notebooks.length === 0) {
    toSet.dland_notebooks = [DEFAULT_NOTEBOOK];
  }
  if (!data.dland_web_url) {
    toSet.dland_web_url = DEFAULT_WEB_URL;
  }
  // Auto migrate or set Render as default API URL
  if (!data.dland_api_url || data.dland_api_url.includes("localhost") || data.dland_api_url.includes("vercel.app")) {
    toSet.dland_api_url = DEFAULT_API_URL;
  }

  if (data.dland_auto_sync === undefined) {
    toSet.dland_auto_sync = true;
  }
  if (data.dland_tooltip_enabled === undefined) {
    toSet.dland_tooltip_enabled = true;
  }

  if (Object.keys(toSet).length > 0) {
    await chrome.storage.local.set(toSet);
  }

  // Create context menu for quick right-click lookup (works on PDFs, Excel, iframes)
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "dland-lookup-mazii",
      title: "🔍 Tra Mazii & Thêm vào Sổ tay Dland (\"%s\")",
      contexts: ["selection"],
    });
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

// Helper to get sanitized API URL (auto falls back to Render if empty or legacy vercel/localhost)
async function getStoredApiUrl() {
  const store = await chrome.storage.local.get(["dland_api_url"]);
  let apiUrl = store.dland_api_url;
  if (!apiUrl || apiUrl.includes("vercel.app") || apiUrl.includes("localhost")) {
    apiUrl = DEFAULT_API_URL;
    await chrome.storage.local.set({ dland_api_url: DEFAULT_API_URL });
  }
  return apiUrl.replace(/\/$/, "");
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "LOOKUP_MAZII":
      handleLookupMazii(request.query)
        .then((data) => sendResponse({ success: true, data }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "GET_NOTEBOOKS":
      chrome.storage.local
        .get([
          "dland_notebooks",
          "dland_auth_token",
          "dland_user",
          "dland_api_url",
          "dland_web_url",
          "dland_auto_sync",
          "dland_tooltip_enabled",
        ])
        .then(async (res) => {
          let apiUrl = res.dland_api_url;
          if (!apiUrl || apiUrl.includes("vercel.app") || apiUrl.includes("localhost")) {
            apiUrl = DEFAULT_API_URL;
            await chrome.storage.local.set({ dland_api_url: DEFAULT_API_URL });
          }

          // Return immediately with the latest local stored notebooks and credentials
          sendResponse({
            notebooks: res.dland_notebooks || [DEFAULT_NOTEBOOK],
            authToken: res.dland_auth_token || null,
            user: res.dland_user || null,
            apiUrl: apiUrl,
            webUrl: res.dland_web_url || DEFAULT_WEB_URL,
            autoSync: res.dland_auto_sync !== false,
            tooltipEnabled: res.dland_tooltip_enabled !== false,
          });

          // If user is authenticated, trigger background sync from database to fetch latest updates
          if (res.dland_auth_token && (request.forceSync || res.dland_auto_sync !== false)) {
            handleDownloadFromDatabase().catch((err) => {
              console.warn("[Dland Extension] Auto-sync GET_NOTEBOOKS background:", err.message);
            });
          }
        });
      return true;

    case "SAVE_VOCAB":
      handleSaveVocab(request.notebookId, request.vocab)
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "SYNC_FROM_WEB_APP":
      handleSyncFromWebApp(request.notebooks, request.authToken, request.user)
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "LOGIN_WITH_CREDENTIALS":
      handleLogin(request.username, request.password)
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "REGISTER_WITH_CREDENTIALS":
      handleRegister(request.username, request.password)
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "LOGOUT":
      handleLogout()
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "SYNC_FROM_DATABASE_NOW":
      handleDownloadFromDatabase()
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "UPLOAD_TO_DATABASE_NOW":
      handleUploadToDatabase()
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "SYNC_LOGIN_FROM_OPEN_TABS":
      handleSyncFromOpenTabs()
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "TEST_SERVER_CONNECTION":
      handleTestConnection(request.apiUrl)
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "SAVE_SETTINGS":
      handleSaveSettings(request.settings, request.adminKey)
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "VERIFY_ADMIN_KEY":
      {
        const key = String(request.key || "").trim().toLowerCase();
        const isValid = VALID_ADMIN_KEYS.some((k) => k.toLowerCase() === key);
        sendResponse({ success: true, isValid });
      }
      return true;


    case "SET_TOOLTIP_ENABLED":
      handleSetTooltipEnabled(request.enabled)
        .then((res) => sendResponse(res))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;

    case "GET_SETTINGS":
      chrome.storage.local
        .get([
          "dland_api_url",
          "dland_web_url",
          "dland_auto_sync",
          "dland_tooltip_enabled",
          "dland_auth_token",
          "dland_user",
        ])
        .then(async (res) => {
          let apiUrl = res.dland_api_url;
          if (!apiUrl || apiUrl.includes("vercel.app") || apiUrl.includes("localhost")) {
            apiUrl = DEFAULT_API_URL;
            await chrome.storage.local.set({ dland_api_url: DEFAULT_API_URL });
          }
          sendResponse({
            apiUrl: apiUrl,
            webUrl: res.dland_web_url || DEFAULT_WEB_URL,
            autoSync: res.dland_auto_sync !== false,
            tooltipEnabled: res.dland_tooltip_enabled !== false,
            isAuthenticated: !!res.dland_auth_token,
            user: res.dland_user || null,
            isAdmin: Boolean(
              res.dland_user?.isAdmin ||
              res.dland_user?.username === "admin" ||
              res.dland_user?.username === "datdm" ||
              res.dland_user?.username === "admin@dland.com"
            ),
          });
        });
      return true;

    default:
      break;
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

// Save Vocabulary to Notebook and optionally sync to Database
async function handleSaveVocab(notebookId, vocab) {
  const store = await chrome.storage.local.get([
    "dland_notebooks",
    "dland_auth_token",
    "dland_api_url",
    "dland_auto_sync",
  ]);

  let notebooks = store.dland_notebooks || [DEFAULT_NOTEBOOK];
  let targetNb = notebooks.find((nb) => nb.id === notebookId);

  if (!targetNb) {
    targetNb = notebooks[0] || DEFAULT_NOTEBOOK;
    notebookId = targetNb.id;
  }

  const cleanKanji = (vocab.kanji || "").trim().toLowerCase();
  const cleanHiragana = (vocab.hiragana || "").trim().toLowerCase();
  const wordDisplay = vocab.kanji || vocab.hiragana || "Từ vựng này";

  const isMatchingWord = (v) => {
    const k = (v.kanji || "").trim().toLowerCase();
    const h = (v.hiragana || "").trim().toLowerCase();
    if (cleanKanji && k && cleanKanji === k) return true;
    if (cleanHiragana && h && cleanHiragana === h) return true;
    return false;
  };

  if (!Array.isArray(targetNb.vocabulary)) {
    targetNb.vocabulary = [];
  }

  // 1. Check duplicate in target notebook
  const duplicateInTarget = targetNb.vocabulary.find(isMatchingWord);
  if (duplicateInTarget) {
    return {
      success: false,
      duplicate: true,
      error: `Từ vựng "${wordDisplay}" đã tồn tại trong sổ tay "${targetNb.name}"!`,
      notebookName: targetNb.name,
    };
  }

  // 2. Check duplicate in any other notebook
  const duplicateInOtherNb = notebooks.find(
    (nb) => nb.id !== targetNb.id && Array.isArray(nb.vocabulary) && nb.vocabulary.some(isMatchingWord)
  );
  if (duplicateInOtherNb) {
    return {
      success: false,
      duplicate: true,
      error: `Từ vựng "${wordDisplay}" đã tồn tại trong sổ tay "${duplicateInOtherNb.name}"!`,
      notebookName: duplicateInOtherNb.name,
    };
  }

  // If not duplicate, create and add
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

  targetNb.vocabulary.unshift(newVocab);

  // Save in local extension storage
  await chrome.storage.local.set({ dland_notebooks: notebooks });

  // Sync to database if token is available and auto-sync is enabled
  const token = store.dland_auth_token;
  const apiUrl = await getStoredApiUrl();
  const autoSync = store.dland_auto_sync !== false;
  let synced = false;
  let syncError = null;

  if (token && autoSync) {
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
      } else {
        const errData = await syncRes.json().catch(() => ({}));
        syncError = errData.error || `HTTP ${syncRes.status}`;
      }
    } catch (syncErr) {
      syncError = syncErr.message;
      console.warn("Could not sync to remote API, saved locally:", syncErr);
    }
  }

  return {
    success: true,
    vocab: newVocab,
    notebookName: targetNb.name,
    synced,
    syncError,
    isAuthenticated: !!token,
  };
}

// Sync notebooks and credentials from Web App
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
  return {
    success: true,
    count: notebooks?.length || 0,
    user: user || null,
    isAuthenticated: !!authToken,
  };
}

// Login directly via API
async function handleLogin(username, password) {
  if (!username || !password) {
    throw new Error("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
  }

  const apiUrl = await getStoredApiUrl();
  const cleanUser = username.trim();
  const cleanPass = password.trim();

  async function postLogin(u, p) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 40000);

    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res;
  }

  let response;
  try {
    response = await postLogin(cleanUser, cleanPass);

    // Smart fallback: If user enters 'admin' and server had 'admin@dland.com' (or vice-versa), try alternate
    if (response.status === 401) {
      if (cleanUser.toLowerCase() === "admin") {
        const altRes = await postLogin("admin@dland.com", cleanPass);
        if (altRes.ok) response = altRes;
      } else if (cleanUser.toLowerCase() === "admin@dland.com") {
        const altRes = await postLogin("admin", cleanPass);
        if (altRes.ok) response = altRes;
      }
    }
  } catch (netErr) {
    if (netErr.name === "AbortError") {
      throw new Error(
        `Máy chủ (${apiUrl}) mất quá nhiều thời gian phản hồi (>40s). Máy chủ Render có thể đang thức dậy (cold start). Vui lòng đợi 10-20 giây rồi bấm Đăng nhập lại!`
      );
    }
    throw new Error(
      `Không thể kết nối đến máy chủ API (${apiUrl}). Nếu bạn đang mở Web App trên trình duyệt, hãy bấm '🔗 Đồng bộ từ Web App'. Hoặc kiểm tra lại URL API Server trong Cài đặt (Dành cho Admin).`
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (parseErr) {
    if (response.status === 404) {
      throw new Error(
        `Máy chủ (${apiUrl}) không hỗ trợ API /api/auth/login (HTTP 404). Nếu bạn dùng Web App Vercel, vui lòng đăng nhập trên trang web rồi bấm '🔗 Đồng bộ từ Web App'! Hoặc nhờ Admin cấu hình đúng URL API Server.`
      );
    }
    throw new Error(`Máy chủ trả về phản hồi không hợp lệ (HTTP ${response.status}).`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "Sai tên đăng nhập hoặc mật khẩu (hoặc tài khoản chưa được tạo). Bạn có thể bấm 'Đăng ký mới' để tạo tài khoản, hoặc bấm 'Đồng bộ từ Web App'!"
      );
    }
    throw new Error(data.error || `Đăng nhập thất bại (HTTP ${response.status}).`);
  }


  const { token, user } = data;
  if (!token) throw new Error("Không nhận được mã xác thực từ máy chủ");

  // Save auth info
  await chrome.storage.local.set({
    dland_auth_token: token,
    dland_user: user,
  });

  // Attempt to download user's notebooks from Database immediately
  let downloadedCount = 0;
  try {
    const syncRes = await fetch(`${apiUrl}/api/sync/data`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (syncRes.ok) {
      const syncJson = await syncRes.json();
      if (syncJson.success && syncJson.data) {
        const rawNotebooks = syncJson.data["flashcash-notebooks"];
        let notebooks = null;
        if (rawNotebooks) {
          notebooks = Array.isArray(rawNotebooks) ? rawNotebooks : rawNotebooks.notebooks;
        }
        if (Array.isArray(notebooks) && notebooks.length > 0) {
          await chrome.storage.local.set({ dland_notebooks: notebooks });
          downloadedCount = notebooks.length;
        }
      }
    }
  } catch (syncErr) {
    console.warn("Initial sync after login warning:", syncErr);
  }

  return {
    success: true,
    user,
    downloadedCount,
  };
}

// Logout
async function handleLogout() {
  await chrome.storage.local.remove(["dland_auth_token", "dland_user"]);
  return { success: true };
}

// Register a new user
async function handleRegister(username, password) {
  if (!username || !password) {
    throw new Error("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
  }
  const cleanUser = username.trim();
  const cleanPass = password.trim();

  if (cleanUser.length < 3 || cleanUser.length > 50) {
    throw new Error("Tên đăng nhập phải từ 3 đến 50 ký tự");
  }
  if (cleanPass.length < 6) {
    throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
  }

  const apiUrl = await getStoredApiUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40000);

  let response;
  try {
    response = await fetch(`${apiUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: cleanUser, password: cleanPass }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (netErr) {
    throw new Error(`Không thể kết nối đến máy chủ API (${apiUrl}): ${netErr.message}`);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác!");
    }
    throw new Error(data.error || `Đăng ký thất bại (HTTP ${response.status}).`);
  }

  const { token, user } = data;
  if (!token) throw new Error("Không nhận được mã xác thực từ máy chủ");

  await chrome.storage.local.set({
    dland_auth_token: token,
    dland_user: user,
  });

  return { success: true, user };
}

// Download notebooks from Database
async function handleDownloadFromDatabase() {
  const store = await chrome.storage.local.get(["dland_auth_token"]);
  const token = store.dland_auth_token;
  if (!token) throw new Error("Chưa đăng nhập. Vui lòng đăng nhập trước khi đồng bộ.");

  const apiUrl = await getStoredApiUrl();
  const response = await fetch(`${apiUrl}/api/sync/data`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    if (response.status === 401) {
      await chrome.storage.local.remove(["dland_auth_token", "dland_user"]);
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Lỗi máy chủ (${response.status})`);
  }

  const json = await response.json();
  if (!json.success || !json.data) throw new Error("Dữ liệu trả về không hợp lệ");

  const rawNotebooks = json.data["flashcash-notebooks"];
  let notebooks = [];
  if (rawNotebooks) {
    notebooks = Array.isArray(rawNotebooks) ? rawNotebooks : rawNotebooks.notebooks || [];
  }

  if (Array.isArray(notebooks) && notebooks.length > 0) {
    await chrome.storage.local.set({ dland_notebooks: notebooks });
  }

  return {
    success: true,
    notebooksCount: notebooks.length,
    timestamp: json.timestamp || new Date().toISOString(),
  };
}

// Upload local notebooks to Database
async function handleUploadToDatabase() {
  const store = await chrome.storage.local.get([
    "dland_auth_token",
    "dland_notebooks",
  ]);

  const token = store.dland_auth_token;
  if (!token) throw new Error("Chưa đăng nhập. Vui lòng đăng nhập trước khi tải lên.");

  const apiUrl = await getStoredApiUrl();
  const notebooks = store.dland_notebooks || [DEFAULT_NOTEBOOK];

  const response = await fetch(`${apiUrl}/api/sync/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: {
        "flashcash-notebooks": { notebooks },
      },
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Tải lên thất bại (${response.status})`);
  }

  return { success: true, count: notebooks.length };
}

// Check open tabs for Dland Web App and extract active session
async function handleSyncFromOpenTabs() {
  const store = await chrome.storage.local.get(["dland_web_url"]);
  const targetWebUrl = store.dland_web_url || DEFAULT_WEB_URL;

  // Query all tabs to find matches with web app domain
  const tabs = await chrome.tabs.query({});
  const matchedTab = tabs.find((t) => {
    if (!t.url) return false;
    return (
      t.url.includes("flashcard-japanese-eight.vercel.app") ||
      t.url.includes("localhost:3000") ||
      t.url.startsWith(targetWebUrl)
    );
  });

  if (matchedTab && matchedTab.id) {
    try {
      const response = await chrome.tabs.sendMessage(matchedTab.id, {
        action: "EXTRACT_WEBAPP_SESSION",
      });

      if (response && (response.authToken || response.notebooks)) {
        await handleSyncFromWebApp(response.notebooks, response.authToken, response.user);
        return {
          success: true,
          user: response.user,
          notebooksCount: response.notebooks?.length || 0,
          source: "active_tab",
        };
      }
    } catch (tabErr) {
      console.warn("Could not message open tab:", tabErr);
    }
  }

  // If no active session found or tab not open, open web app tab
  chrome.tabs.create({ url: targetWebUrl });
  return {
    success: false,
    openedTab: true,
    message: "Đã mở Web App. Vui lòng đăng nhập trên trang web rồi bấm 'Đồng bộ từ Web App'!",
  };
}

// Test server/database connectivity
async function handleTestConnection(url) {
  let targetUrl = url ? url.trim().replace(/\/$/, "") : await getStoredApiUrl();
  if (!targetUrl || targetUrl.includes("vercel.app") || targetUrl.includes("localhost")) {
    targetUrl = DEFAULT_API_URL;
  }
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = "https://" + targetUrl;
  }
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    // Render free-tier instances may sleep and need up to 25s to wake up
    const timeout = setTimeout(() => controller.abort(), 25000);

    let res;
    try {
      // 1. First attempt: standard GET to /health endpoint
      res = await fetch(`${targetUrl}/health`, {
        method: "GET",
        signal: controller.signal,
      });
    } catch (healthErr) {
      try {
        // 2. Second attempt: no-cors mode to /health (bypasses browser CORS checks)
        res = await fetch(`${targetUrl}/health`, {
          method: "GET",
          mode: "no-cors",
          signal: controller.signal,
        });
      } catch (noCorsErr) {
        // 3. Third attempt: no-cors mode to /api/sync/status
        res = await fetch(`${targetUrl}/api/sync/status`, {
          method: "GET",
          mode: "no-cors",
          signal: controller.signal,
        });
      }
    }

    clearTimeout(timeout);
    const latency = Date.now() - startTime;

    if (
      res &&
      (res.ok ||
        res.type === "opaque" ||
        res.status === 0 ||
        res.status === 200 ||
        res.status === 401 ||
        res.status === 404)
    ) {
      return {
        success: true,
        status: `Kết nối thành công (${latency}ms)`,
        latency,
      };
    }

    return {
      success: false,
      status: `Máy chủ phản hồi HTTP ${res.status}`,
    };
  } catch (err) {
    if (err.name === "AbortError") {
      return {
        success: false,
        status: "Quá thời gian chờ (Server Render có thể đang ngủ, vui lòng thử lại sau 15-20s)",
      };
    }
    return {
      success: false,
      status: `Không thể kết nối: ${err.message}`,
    };
  }
}

// Toggle Tooltip On/Off and broadcast to all tabs
async function handleSetTooltipEnabled(enabled) {
  const isEnabled = Boolean(enabled);
  await chrome.storage.local.set({ dland_tooltip_enabled: isEnabled });

  // Broadcast to all open tabs immediately
  try {
    const tabs = await chrome.tabs.query({});
    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          action: "SET_TOOLTIP_ENABLED",
          enabled: isEnabled,
        }).catch(() => {});
      }
    });
  } catch (err) {
    console.warn("Could not broadcast tooltip state to tabs:", err);
  }

  return { success: true, enabled: isEnabled };
}

// Save Settings (Client URL & API Server URL are strictly restricted to Admin)
async function handleSaveSettings(settings, adminKey) {
  const store = await chrome.storage.local.get(["dland_user"]);
  const currentUser = store.dland_user;
  const isCurrentAdmin = Boolean(
    currentUser &&
      (currentUser.isAdmin ||
        currentUser.username === "admin" ||
        currentUser.username === "datdm" ||
        currentUser.username === "admin@dland.com")
  );
  const isKeyValid = Boolean(
    adminKey &&
      VALID_ADMIN_KEYS.some((k) => k.toLowerCase() === String(adminKey).trim().toLowerCase())
  );
  const isAuthorized = isCurrentAdmin || isKeyValid;


  const toUpdate = {};

  // URL SETTINGS: ADMIN ONLY
  if (settings.apiUrl !== undefined || settings.webUrl !== undefined) {
    if (!isAuthorized) {
      throw new Error("⛔ Quyền bị từ chối: Chỉ Quản trị viên (Admin) mới có quyền thay đổi URL Client và URL API Server.");
    }
    if (settings.apiUrl !== undefined) {
      toUpdate.dland_api_url = settings.apiUrl.trim().replace(/\/$/, "");
    }
    if (settings.webUrl !== undefined) {
      toUpdate.dland_web_url = settings.webUrl.trim().replace(/\/$/, "");
    }
  }

  if (settings.autoSync !== undefined) {
    toUpdate.dland_auto_sync = Boolean(settings.autoSync);
  }
  if (settings.tooltipEnabled !== undefined) {
    toUpdate.dland_tooltip_enabled = Boolean(settings.tooltipEnabled);
  }

  await chrome.storage.local.set(toUpdate);

  if (settings.tooltipEnabled !== undefined) {
    await handleSetTooltipEnabled(settings.tooltipEnabled);
  }

  return { success: true, isAdmin: isAuthorized };
}


