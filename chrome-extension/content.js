// Dland Language Flashcard - Content Script (Manifest V3)

(function () {
  let activeTooltip = null;
  let activeModal = null;
  let lastSelectionText = "";
  let isTooltipEnabled = true;

  // Initialize tooltip enabled state from local storage
  chrome.storage.local.get(["dland_tooltip_enabled"], (res) => {
    if (res && res.dland_tooltip_enabled !== undefined) {
      isTooltipEnabled = Boolean(res.dland_tooltip_enabled);
    }
  });

  // Listen for realtime storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local") {
      if (changes.dland_tooltip_enabled) {
        isTooltipEnabled = changes.dland_tooltip_enabled.newValue !== false;
        if (!isTooltipEnabled) {
          removeTooltip();
        }
      }
      if (changes.dland_notebooks && activeModal) {
        const newNbs = changes.dland_notebooks.newValue;
        if (Array.isArray(newNbs) && newNbs.length > 0) {
          const nbSelect = activeModal.querySelector("#dland-select-notebook");
          if (nbSelect) {
            const curVal = nbSelect.value;
            nbSelect.innerHTML = `
              ${newNbs
                .map(
                  (nb) =>
                    `<option value="${nb.id}" ${nb.id === curVal ? "selected" : ""}>📓 ${escapeHtml(nb.name)} (${nb.vocabulary?.length || 0} từ)</option>`
                )
                .join("")}
              <option value="__NEW__">➕ Tạo sổ tay mới...</option>
            `;
          }
        }
      }
    }
  });

  // Helper
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Check if current site is the Dland Web App
  function isDlandWebApp() {
    const host = window.location.hostname;
    const href = window.location.href;
    return (
      host === "flashcard-japanese-eight.vercel.app" ||
      (host === "localhost" && window.location.port === "3000") ||
      href.includes("flashcard-japanese-eight.vercel.app")
    );
  }

  // =========================================================================
  // 1. AUTO-SYNC FROM WEB APP (flashcard-japanese-eight.vercel.app / localhost:3000)
  // =========================================================================
  function extractSessionData() {
    try {
      const rawNotebooks = localStorage.getItem("flashcash-notebooks");
      const authToken = localStorage.getItem("flashcash-auth-token");
      const rawUser = localStorage.getItem("flashcash-user");

      let notebooks = null;
      let user = null;

      if (rawNotebooks) {
        const parsed = JSON.parse(rawNotebooks);
        notebooks = Array.isArray(parsed) ? parsed : parsed.notebooks || null;
      }
      if (rawUser) {
        user = JSON.parse(rawUser);
      }

      return { notebooks, authToken, user };
    } catch (err) {
      console.warn("[Dland Extension] Error extracting session:", err);
      return { notebooks: null, authToken: null, user: null };
    }
  }

  function syncWithDlandWebApp() {
    if (isDlandWebApp()) {
      const session = extractSessionData();
      if (session.notebooks || session.authToken || session.user) {
        chrome.runtime.sendMessage({
          action: "SYNC_FROM_WEB_APP",
          notebooks: session.notebooks,
          authToken: session.authToken,
          user: session.user,
        });
      }
    }
  }

  // Initial sync check if browsing web app
  if (isDlandWebApp()) {
    syncWithDlandWebApp();
    window.addEventListener("auth-state-changed", syncWithDlandWebApp);
    window.addEventListener("notebooks-updated", syncWithDlandWebApp);
    window.addEventListener("storage", (e) => {
      if (
        e.key === "flashcash-auth-token" ||
        e.key === "flashcash-user" ||
        e.key === "flashcash-notebooks"
      ) {
        syncWithDlandWebApp();
      }
    });
  }

  // Listen for direct request from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "EXTRACT_WEBAPP_SESSION") {
      const session = extractSessionData();
      sendResponse(session);
      return true;
    }

    if (request.action === "OPEN_LOOKUP_DIALOG" && request.selectedText) {
      openLookupDialog(request.selectedText);
      sendResponse({ success: true });
      return true;
    }

    if (request.action === "SET_TOOLTIP_ENABLED") {
      isTooltipEnabled = Boolean(request.enabled);
      if (!isTooltipEnabled) {
        removeTooltip();
      }
      sendResponse({ success: true, isTooltipEnabled });
      return true;
    }
  });

  // =========================================================================
  // 2. TEXT SELECTION & FLOATING TOOLTIP
  // =========================================================================
  function removeTooltip() {
    if (activeTooltip && activeTooltip.parentNode) {
      activeTooltip.parentNode.removeChild(activeTooltip);
      activeTooltip = null;
    }
  }

  function getSelectionData(e) {
    const active = document.activeElement;
    const target =
      e && e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        ? e.target
        : active;

    // 1. Check <input> and <textarea> elements (DOM selection API returns empty for form controls)
    if (
      target &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA") &&
      target.type !== "password" &&
      typeof target.selectionStart === "number" &&
      typeof target.selectionEnd === "number" &&
      target.selectionStart !== target.selectionEnd
    ) {
      const rawText = target.value.substring(target.selectionStart, target.selectionEnd);
      const text = rawText.replace(/[\r\n]+/g, " ").trim();
      if (text && text.length <= 100) {
        const rect = target.getBoundingClientRect();
        if (rect && (rect.width > 0 || rect.height > 0)) {
          return { text, rect };
        }
      }
    }

    // 2. Check standard DOM selection (window.getSelection)
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return null;
    }

    const rawText = selection.toString();
    const text = rawText.replace(/[\r\n\t\u00A0\u200B]+/g, " ").trim();
    if (!text || text.length > 100) {
      return null;
    }

    try {
      const range = selection.getRangeAt(0);
      let rect = range.getBoundingClientRect();

      // Fallback for elements with empty bounding rect (e.g. PDF layers, SVG, inline wrappers)
      if (!rect || (rect.width === 0 && rect.height === 0)) {
        const rects = range.getClientRects();
        if (rects && rects.length > 0) {
          for (let i = 0; i < rects.length; i++) {
            if (rects[i].width > 0 || rects[i].height > 0) {
              rect = rects[i];
              break;
            }
          }
        }
      }

      if (!rect || (rect.width === 0 && rect.height === 0)) {
        const node = selection.anchorNode
          ? selection.anchorNode.nodeType === 3
            ? selection.anchorNode.parentElement
            : selection.anchorNode
          : null;
        if (node && typeof node.getBoundingClientRect === "function") {
          rect = node.getBoundingClientRect();
        }
      }

      if (!rect || (rect.width === 0 && rect.height === 0)) {
        return null;
      }

      return { text, rect };
    } catch (err) {
      return null;
    }
  }

  let selectionTimer = null;

  function handleSelection(e) {
    if (!isTooltipEnabled) {
      removeTooltip();
      return;
    }

    if (
      e &&
      e.target &&
      (e.target.closest?.(".dland-tooltip-container") || e.target.closest?.(".dland-modal-overlay"))
    ) {
      return;
    }

    if (selectionTimer) clearTimeout(selectionTimer);

    selectionTimer = setTimeout(() => {
      if (!isTooltipEnabled) {
        removeTooltip();
        return;
      }

      const data = getSelectionData(e);
      if (!data || !data.text) {
        removeTooltip();
        return;
      }

      lastSelectionText = data.text;
      showTooltip(data.rect, data.text);
    }, 20);
  }

  function showTooltip(rect, text) {
    removeTooltip();

    const container = document.createElement("div");
    container.className = "dland-tooltip-container";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "dland-tooltip-btn";
    button.innerHTML = `
      <span class="dland-tooltip-icon">🔍</span>
      <span>Tra & Thêm Mazii</span>
    `;

    let opened = false;
    const triggerOpen = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (opened) return;
      opened = true;
      removeTooltip();
      openLookupDialog(text);
    };

    button.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    button.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    button.addEventListener("click", triggerOpen);

    container.appendChild(button);
    (document.body || document.documentElement).appendChild(container);

    let top = rect.top - 42;
    if (rect.top < 50) {
      top = rect.bottom + 8;
    }

    let left = rect.left + rect.width / 2 - 60;
    const maxLeft = Math.max(10, (window.innerWidth || document.documentElement.clientWidth || 360) - 140);
    if (left < 10) left = 10;
    if (left > maxLeft) left = maxLeft;

    container.style.position = "fixed";
    container.style.top = `${Math.max(5, top)}px`;
    container.style.left = `${left}px`;
    container.style.zIndex = "2147483646";

    activeTooltip = container;
  }

  // Dismiss tooltip when clicking outside
  document.addEventListener("pointerdown", (e) => {
    if (
      (activeTooltip && activeTooltip.contains(e.target)) ||
      (activeModal && activeModal.contains(e.target))
    ) {
      return;
    }
    removeTooltip();
  });

  document.addEventListener("mouseup", handleSelection);
  document.addEventListener("pointerup", handleSelection);
  document.addEventListener("touchend", handleSelection);
  document.addEventListener("keyup", handleSelection);
  document.addEventListener("dblclick", handleSelection);
  document.addEventListener("selectionchange", () => {
    if (!isTooltipEnabled) return;
    if (selectionTimer) clearTimeout(selectionTimer);
    selectionTimer = setTimeout(() => {
      const data = getSelectionData(null);
      if (data && data.text) {
        handleSelection(null);
      }
    }, 120);
  });

  // =========================================================================
  // 3. LOOKUP & ADD TO NOTEBOOK MODAL DIALOG
  // =========================================================================
  function closeModal() {
    if (activeModal && activeModal.parentNode) {
      activeModal.parentNode.removeChild(activeModal);
      activeModal = null;
    }
  }

  function renderKanjiCards(container, kanjiDetails, onWordClick) {
    if (!container || !Array.isArray(kanjiDetails) || kanjiDetails.length === 0) {
      if (container) container.innerHTML = "";
      return;
    }

    container.innerHTML = kanjiDetails
      .map(
        (k) => `
        <div class="dland-kanji-card">
          <div class="dland-kanji-header">
            <span class="dland-kanji-char">${escapeHtml(k.kanji)}</span>
            <div class="dland-kanji-meta">
              <div class="dland-kanji-han">
                <strong>${escapeHtml(k.han || "HÁN")}</strong>
                ${k.level ? `<span class="dland-kanji-level-badge">${escapeHtml(k.level)}</span>` : ""}
              </div>
              <div class="dland-kanji-readings">
                ${k.on ? `<span><strong>On:</strong> ${escapeHtml(k.on)}</span>` : ""}
                ${k.kun ? `<span><strong>Kun:</strong> ${escapeHtml(k.kun)}</span>` : ""}
              </div>
            </div>
          </div>
          ${k.detail ? `<div class="dland-kanji-detail-text">${escapeHtml(k.detail)}</div>` : ""}
          ${
            k.examples && k.examples.length > 0
              ? `
            <div class="dland-kanji-ex-title">📚 Từ vựng chứa ${escapeHtml(k.kanji)}:</div>
            <div class="dland-kanji-ex-grid">
              ${k.examples
                .map(
                  (ex) => `
                <button type="button" class="dland-kanji-ex-chip" data-word="${escapeHtml(ex.w)}" title="Nhấp để tra từ '${escapeHtml(ex.w)}'">
                  <span class="dland-ex-w">${escapeHtml(ex.w)}</span>
                  ${ex.p ? `<span class="dland-ex-p">(${escapeHtml(ex.p)})</span>` : ""}
                  <span class="dland-ex-m">: ${escapeHtml(ex.m)}</span>
                </button>
              `
                )
                .join("")}
            </div>
          `
              : ""
          }
        </div>
      `
      )
      .join("");

    container.querySelectorAll(".dland-kanji-ex-chip").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const word = btn.getAttribute("data-word");
        if (word && typeof onWordClick === "function") {
          onWordClick(word);
        }
      });
    });
  }

  function openLookupDialog(wordToLookup) {
    closeModal();

    // Default fallback notebooks
    let notebooks = [
      { id: "nb-default-ja", name: "Sổ tay Tiếng Nhật", lang: "ja", vocabulary: [] },
    ];

    // Create and attach modal IMMEDIATELY to avoid delay or failure
    const overlay = document.createElement("div");
    overlay.className = "dland-modal-overlay";

    const dialog = document.createElement("div");
    dialog.className = "dland-modal-dialog";

    dialog.innerHTML = `
      <div class="dland-modal-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h3 class="dland-modal-title">
            <span>📖</span> Tra Mazii & Thêm Vào Sổ Tay
          </h3>
          <div class="dland-sync-badge local" id="dland-modal-auth-badge">💾 Đang tải...</div>
        </div>
        <button type="button" class="dland-modal-close-btn" title="Đóng">✕</button>
      </div>

      <div class="dland-modal-body">
        <div class="dland-modal-error" id="dland-modal-error" style="display: none;"></div>

        <!-- Preview & Audio -->
        <div class="dland-preview-box">
          <div>
            <div class="dland-preview-word" id="dland-display-word">${escapeHtml(wordToLookup)}</div>
            <div class="dland-preview-reading" id="dland-display-reading">Đang tra từ điển Mazii...</div>
          </div>
          <button type="button" class="dland-speak-btn" id="dland-speak-btn" title="Phát âm tiếng Nhật">🔊</button>
        </div>

        <!-- Form fields -->
        <div class="dland-form-group">
          <label class="dland-form-label">Từ vựng (Kanji / Từ gốc)</label>
          <input type="text" class="dland-input-text" id="dland-input-kanji" value="${escapeHtml(wordToLookup)}" />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="dland-form-group">
            <label class="dland-form-label">Hiragana / Cách đọc</label>
            <input type="text" class="dland-input-text" id="dland-input-hiragana" placeholder="Cách đọc..." />
          </div>
          <div class="dland-form-group">
            <label class="dland-form-label">Âm Hán Việt (Onyomi)</label>
            <input type="text" class="dland-input-text" id="dland-input-onyomi" placeholder="Hán việt..." />
          </div>
        </div>

        <div class="dland-form-group">
          <label class="dland-form-label">Nghĩa tiếng Việt</label>
          <textarea class="dland-textarea" id="dland-input-meaning" placeholder="Nghĩa của từ vựng..."></textarea>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="dland-form-group">
            <label class="dland-form-label">Loại từ</label>
            <select class="dland-select" id="dland-select-wordtype">
              <option value="Danh từ">Danh từ</option>
              <option value="Động từ">Động từ</option>
              <option value="Tính từ">Tính từ</option>
              <option value="Phó từ">Phó từ</option>
              <option value="Liên từ">Liên từ</option>
              <option value="Trợ từ">Trợ từ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div class="dland-form-group">
            <label class="dland-form-label">Lưu vào Sổ tay</label>
            <select class="dland-select" id="dland-select-notebook">
              <option value="nb-default-ja">📓 Sổ tay Tiếng Nhật</option>
              <option value="__NEW__">➕ Tạo sổ tay mới...</option>
            </select>
          </div>
        </div>

        <!-- Hidden input for creating new notebook -->
        <div class="dland-form-group" id="dland-new-nb-group" style="display: none;">
          <label class="dland-form-label">Tên sổ tay mới</label>
          <input type="text" class="dland-input-text" id="dland-input-new-nb" placeholder="Ví dụ: Từ vựng N3 đọc báo..." />
        </div>

        <!-- Kanji & Related Vocabulary Section -->
        <div class="dland-form-group" id="dland-kanji-group" style="display: none;">
          <label class="dland-form-label">⛩️ Hán tự & Từ vựng liên quan (Mazii)</label>
          <div id="dland-kanji-container" class="dland-kanji-section"></div>
        </div>
      </div>

      <div class="dland-modal-footer">
        <button type="button" class="dland-btn-cancel" id="dland-btn-cancel">Hủy</button>
        <button type="button" class="dland-btn-save" id="dland-btn-save">💾 Lưu vào Sổ tay</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    activeModal = overlay;

    // Elements
    const closeBtn = dialog.querySelector(".dland-modal-close-btn");
    const cancelBtn = dialog.querySelector("#dland-btn-cancel");
    const saveBtn = dialog.querySelector("#dland-btn-save");
    const speakBtn = dialog.querySelector("#dland-speak-btn");
    const kanjiInput = dialog.querySelector("#dland-input-kanji");
    const hiraganaInput = dialog.querySelector("#dland-input-hiragana");
    const onyomiInput = dialog.querySelector("#dland-input-onyomi");
    const meaningInput = dialog.querySelector("#dland-input-meaning");
    const wordTypeSelect = dialog.querySelector("#dland-select-wordtype");
    const nbSelect = dialog.querySelector("#dland-select-notebook");
    const newNbGroup = dialog.querySelector("#dland-new-nb-group");
    const newNbInput = dialog.querySelector("#dland-input-new-nb");
    const displayWord = dialog.querySelector("#dland-display-word");
    const displayReading = dialog.querySelector("#dland-display-reading");
    const authBadge = dialog.querySelector("#dland-modal-auth-badge");
    const kanjiGroup = dialog.querySelector("#dland-kanji-group");
    const kanjiContainer = dialog.querySelector("#dland-kanji-container");

    // Close handlers
    closeBtn.addEventListener("click", closeModal);
    cancelBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });

    // Toggle new notebook input
    nbSelect.addEventListener("change", () => {
      if (nbSelect.value === "__NEW__") {
        newNbGroup.style.display = "flex";
        newNbInput.focus();
      } else {
        newNbGroup.style.display = "none";
      }
    });

    // Audio TTS handler
    speakBtn.addEventListener("click", () => {
      const textToSpeak = kanjiInput.value || hiraganaInput.value || wordToLookup;
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(textToSpeak);
        u.lang = "ja-JP";
        u.rate = 0.85;
        window.speechSynthesis.speak(u);
      }
    });

    // Check if extension context is valid
    if (!chrome.runtime?.id) {
      displayReading.innerHTML = `⚠️ Tiện ích vừa được cập nhật. <a href="javascript:location.reload()" style="color: #4f46e5; text-decoration: underline; font-weight: 700;">Bấm F5 tải lại trang</a> để tra Mazii!`;
      if (authBadge) {
        authBadge.textContent = "⚠️ Vui lòng F5";
        authBadge.className = "dland-sync-badge local";
      }
      return;
    }

    function updateNotebookOptions(list) {
      if (!Array.isArray(list) || list.length === 0) return;
      notebooks = list;
      const curSelected = nbSelect.value;
      nbSelect.innerHTML = `
        ${notebooks
          .map(
            (nb) =>
              `<option value="${nb.id}" ${nb.id === curSelected ? "selected" : ""}>📓 ${escapeHtml(nb.name)} (${nb.vocabulary?.length || 0} từ)</option>`
          )
          .join("")}
        <option value="__NEW__">➕ Tạo sổ tay mới...</option>
      `;
    }

    // 1. Immediately read latest notebooks from storage to populate select without any delay
    chrome.storage.local.get(["dland_notebooks", "dland_auth_token", "dland_user"], (stored) => {
      if (stored && stored.dland_notebooks) {
        updateNotebookOptions(stored.dland_notebooks);
      }
      if (stored && authBadge) {
        if (stored.dland_auth_token) {
          authBadge.className = "dland-sync-badge synced";
          authBadge.textContent = `☁️ ${stored.dland_user?.username || "Đã kết nối DB"}`;
          authBadge.title = "Dữ liệu sẽ tự động đồng bộ lên Database";
        } else {
          authBadge.className = "dland-sync-badge local";
          authBadge.textContent = "💾 Lưu cục bộ";
          authBadge.title = "Dữ liệu lưu tại máy. Mở popup để đăng nhập đồng bộ.";
        }
      }
    });

    // 2. Also request fresh sync from Database and background service worker
    try {
      chrome.runtime.sendMessage({ action: "GET_NOTEBOOKS", forceSync: true }, (res) => {
        if (chrome.runtime.lastError || !res) return;

        if (res.notebooks && Array.isArray(res.notebooks) && res.notebooks.length > 0) {
          updateNotebookOptions(res.notebooks);
        }

        if (authBadge) {
          if (res.authToken) {
            authBadge.className = "dland-sync-badge synced";
            authBadge.textContent = `☁️ ${res.user?.username || "Đã kết nối DB"}`;
            authBadge.title = "Dữ liệu sẽ tự động đồng bộ lên Database";
          } else {
            authBadge.className = "dland-sync-badge local";
            authBadge.textContent = "💾 Lưu cục bộ";
            authBadge.title = "Dữ liệu lưu tại máy. Mở popup để đăng nhập đồng bộ.";
          }
        }
      });
    } catch (err) {
      console.warn("[Dland Extension] GET_NOTEBOOKS error:", err);
    }

    // Asynchronously fetch Mazii lookup data
    try {
      chrome.runtime.sendMessage(
        { action: "LOOKUP_MAZII", query: wordToLookup },
        (res) => {
          if (chrome.runtime.lastError || !res) {
            displayReading.textContent = "Không tìm thấy trong Mazii, bạn có thể tự nhập nghĩa";
            return;
          }
          if (res && res.success && res.data) {
            const d = res.data;
            kanjiInput.value = d.kanji || wordToLookup;
            hiraganaInput.value = d.hiragana || "";
            onyomiInput.value = d.onyomi || "";
            meaningInput.value = d.meaning || "";

            if (d.wordType) {
              wordTypeSelect.value = d.wordType;
            }

            displayWord.textContent = d.kanji || wordToLookup;
            displayReading.textContent =
              [d.hiragana, d.onyomi ? `[${d.onyomi}]` : ""].filter(Boolean).join(" • ") ||
              "Đã tìm thấy từ điển Mazii";

            // Render Kanji & Related Vocabulary Cards
            if (kanjiGroup && kanjiContainer) {
              if (d.kanjiDetails && d.kanjiDetails.length > 0) {
                kanjiGroup.style.display = "flex";
                renderKanjiCards(kanjiContainer, d.kanjiDetails, (selectedWord) => {
                  openLookupDialog(selectedWord);
                });
              } else {
                kanjiGroup.style.display = "none";
              }
            }
          } else {
            displayReading.textContent = "Không tìm thấy trong Mazii, bạn có thể tự nhập nghĩa";
          }
        }
      );
    } catch (err) {
      displayReading.textContent = "Vui lòng bấm F5 tải lại trang để kích hoạt từ điển Mazii";
    }

    // Save handler
    saveBtn.addEventListener("click", async () => {
      const kanji = kanjiInput.value.trim();
      const hiragana = hiraganaInput.value.trim() || kanji;
      const onyomi = onyomiInput.value.trim();
      const meaning = meaningInput.value.trim();
      const wordType = wordTypeSelect.value;

      if (!kanji && !hiragana) {
        alert("Vui lòng nhập từ vựng tiếng Nhật");
        return;
      }

      saveBtn.disabled = true;
      saveBtn.textContent = "Đang lưu...";

      let targetNotebookId = nbSelect.value;

      // If creating new notebook
      if (targetNotebookId === "__NEW__") {
        const newName = newNbInput.value.trim() || "Sổ tay mới";
        const newId = `nb-${Date.now()}`;
        const newNb = {
          id: newId,
          name: newName,
          lang: "ja",
          createdAt: new Date().toISOString(),
          vocabulary: [],
        };
        notebooks.push(newNb);
        targetNotebookId = newId;
        chrome.storage.local.set({ dland_notebooks: notebooks });
      }

      try {
        chrome.runtime.sendMessage(
          {
            action: "SAVE_VOCAB",
            notebookId: targetNotebookId,
            vocab: {
              kanji,
              hiragana,
              onyomi,
              meaning,
              wordType,
            },
          },
          (saveRes) => {
            if (saveRes && saveRes.success) {
              closeModal();
              if (saveRes.synced) {
                showToast(`✅ Đã lưu "${kanji || hiragana}" và đồng bộ Database!`);
              } else if (saveRes.syncError) {
                showToast(`💾 Đã lưu vào sổ tay máy (Chưa đồng bộ DB: ${saveRes.syncError})`);
              } else {
                showToast(`✅ Đã lưu "${kanji || hiragana}" vào sổ tay ${saveRes.notebookName || ""}!`);
              }
            } else {
              // Re-enable save button so user can edit
              saveBtn.disabled = false;
              saveBtn.textContent = "💾 Lưu vào Sổ tay";

              // Show RED ERROR banner inside the dialog
              const modalError = dialog.querySelector("#dland-modal-error");
              if (modalError) {
                modalError.textContent = `❌ ${saveRes?.error || "Từ vựng này đã tồn tại trong sổ tay!"}`;
                modalError.style.display = "flex";
                modalError.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }

              // Also show a red toast error
              showToast(`❌ ${saveRes?.error || "Từ vựng này đã tồn tại!"}`, "error");
            }
          }
        );
      } catch (err) {
        saveBtn.disabled = false;
        saveBtn.textContent = "💾 Lưu vào Sổ tay";
        showToast("⚠️ Vui lòng tải lại trang (F5) để lưu từ vựng!", "error");
      }
    });
  }

  // Toast Notification (Supports "normal" and "error" types)
  function showToast(message, type = "normal") {
    const toast = document.createElement("div");
    toast.className = `dland-toast ${type === "error" ? "error" : ""}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }
})();
