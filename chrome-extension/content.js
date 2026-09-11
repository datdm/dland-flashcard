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
    if (namespace === "local" && changes.dland_tooltip_enabled) {
      isTooltipEnabled = changes.dland_tooltip_enabled.newValue !== false;
      if (!isTooltipEnabled) {
        removeTooltip();
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

  function handleSelection(e) {
    if (!isTooltipEnabled) {
      removeTooltip();
      return;
    }

    if (e.target.closest(".dland-tooltip-container") || e.target.closest(".dland-modal-overlay")) {
      return;
    }

    setTimeout(() => {
      if (!isTooltipEnabled) {
        removeTooltip();
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        removeTooltip();
        return;
      }

      const text = selection.toString().trim();
      if (!text || text.length > 60 || text.includes("\n")) {
        removeTooltip();
        return;
      }

      lastSelectionText = text;


      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (!rect || (rect.width === 0 && rect.height === 0)) {
          removeTooltip();
          return;
        }

        showTooltip(rect, text);
      } catch (err) {
        removeTooltip();
      }
    }, 15);
  }

  function showTooltip(rect, text) {
    removeTooltip();

    const container = document.createElement("div");
    container.className = "dland-tooltip-container";

    const button = document.createElement("button");
    button.className = "dland-tooltip-btn";
    button.innerHTML = `
      <span class="dland-tooltip-icon">🔍</span>
      <span>Tra & Thêm Mazii</span>
    `;

    button.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeTooltip();
      openLookupDialog(text);
    });

    container.appendChild(button);
    document.body.appendChild(container);

    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let top = rect.top + scrollY - 38;
    if (rect.top < 45) {
      top = rect.bottom + scrollY + 8;
    }

    let left = rect.left + scrollX + rect.width / 2 - 60;
    if (left < 10) left = 10;

    container.style.top = `${top}px`;
    container.style.left = `${left}px`;

    activeTooltip = container;
  }

  document.addEventListener("mouseup", handleSelection);
  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      removeTooltip();
    }
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

  async function openLookupDialog(wordToLookup) {
    closeModal();

    // Fetch user's notebooks & auth state from extension storage
    const store = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "GET_NOTEBOOKS" }, (res) => resolve(res || {}));
    });

    const notebooks = store.notebooks || [
      { id: "nb-default-ja", name: "Sổ tay Tiếng Nhật", lang: "ja", vocabulary: [] },
    ];
    const user = store.user;
    const isAuthenticated = !!store.authToken;

    // Create Modal Elements
    const overlay = document.createElement("div");
    overlay.className = "dland-modal-overlay";

    const dialog = document.createElement("div");
    dialog.className = "dland-modal-dialog";

    const authBadgeHtml = isAuthenticated
      ? `<div class="dland-sync-badge synced" title="Dữ liệu sẽ tự động đồng bộ lên Database">☁️ ${escapeHtml(user?.username || "Đã kết nối Database")}</div>`
      : `<div class="dland-sync-badge local" title="Dữ liệu lưu tại máy. Mở popup để đăng nhập đồng bộ.">💾 Lưu cục bộ</div>`;

    dialog.innerHTML = `
      <div class="dland-modal-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h3 class="dland-modal-title">
            <span>📖</span> Tra Mazii & Thêm Vào Sổ Tay
          </h3>
          ${authBadgeHtml}
        </div>
        <button class="dland-modal-close-btn" title="Đóng">✕</button>
      </div>

      <div class="dland-modal-body">
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
              ${notebooks
                .map(
                  (nb) =>
                    `<option value="${nb.id}">📓 ${escapeHtml(nb.name)} (${nb.vocabulary?.length || 0} từ)</option>`
                )
                .join("")}
              <option value="__NEW__">➕ Tạo sổ tay mới...</option>
            </select>
          </div>
        </div>

        <!-- Hidden input for creating new notebook -->
        <div class="dland-form-group" id="dland-new-nb-group" style="display: none;">
          <label class="dland-form-label">Tên sổ tay mới</label>
          <input type="text" class="dland-input-text" id="dland-input-new-nb" placeholder="Ví dụ: Từ vựng N3 đọc báo..." />
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

    // Asynchronously fetch Mazii lookup data
    chrome.runtime.sendMessage(
      { action: "LOOKUP_MAZII", query: wordToLookup },
      (res) => {
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
        } else {
          displayReading.textContent = "Không tìm thấy trong Mazii, bạn có thể tự nhập nghĩa";
        }
      }
    );

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
      }

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
          closeModal();
          if (saveRes && saveRes.success) {
            if (saveRes.synced) {
              showToast(`✅ Đã lưu "${kanji || hiragana}" và đồng bộ Database!`);
            } else if (saveRes.syncError) {
              showToast(`💾 Đã lưu vào sổ tay máy (Chưa đồng bộ DB: ${saveRes.syncError})`);
            } else {
              showToast(`✅ Đã lưu "${kanji || hiragana}" vào sổ tay ${saveRes.notebookName || ""}!`);
            }
          } else {
            showToast(`⚠️ Không thể lưu: ${saveRes?.error || "Đã xảy ra lỗi"}`);
          }
        }
      );
    });
  }

  // Toast Notification
  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "dland-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3500);
  }
})();
