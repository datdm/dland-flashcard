// Dland Language Flashcard - Content Script

(function () {
  let activeTooltip = null;
  let activeModal = null;
  let lastSelectionText = "";

  // =========================================================================
  // 1. AUTO-SYNC FROM WEB APP IF CURRENT TAB IS DLAND FLASHCARD (LOCALHOST:3000)
  // =========================================================================
  function syncWithDlandWebApp() {
    if (window.location.hostname === "localhost" && window.location.port === "3000") {
      try {
        const rawNotebooks = localStorage.getItem("flashcash-notebooks");
        const authToken = localStorage.getItem("flashcash-auth-token");
        const rawUser = localStorage.getItem("flashcash-user");

        let notebooks = null;
        let user = null;

        if (rawNotebooks) {
          const parsed = JSON.parse(rawNotebooks);
          notebooks = Array.isArray(parsed) ? parsed : parsed.notebooks;
        }
        if (rawUser) {
          user = JSON.parse(rawUser);
        }

        if (notebooks || authToken) {
          chrome.runtime.sendMessage({
            action: "SYNC_FROM_WEB_APP",
            notebooks,
            authToken,
            user,
          });
        }
      } catch (e) {
        console.warn("[Dland Extension] Auto-sync check:", e);
      }
    }
  }

  // Initial sync check
  syncWithDlandWebApp();
  window.addEventListener("notebooks-updated", syncWithDlandWebApp);

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
    // If clicking inside our own tooltip or modal, do not remove
    if (e.target.closest(".dland-tooltip-container") || e.target.closest(".dland-modal-overlay")) {
      return;
    }

    // Small delay to allow selection range to finalize
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        removeTooltip();
        return;
      }

      const text = selection.toString().trim();
      if (!text || text.length > 50 || text.includes("\n")) {
        removeTooltip();
        return;
      }

      // Check if selection is within an input/textarea
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        // Can still allow if user highlights inside input
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
    }, 10);
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

    // Position above selection if space available, otherwise below
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

    // Fetch user's notebooks first
    const notebooksRes = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: "GET_NOTEBOOKS" }, (res) => resolve(res || {}));
    });

    const notebooks = notebooksRes.notebooks || [
      { id: "nb-default-ja", name: "Sổ tay Tiếng Nhật", lang: "ja", vocabulary: [] },
    ];

    // Create Modal Elements
    const overlay = document.createElement("div");
    overlay.className = "dland-modal-overlay";

    const dialog = document.createElement("div");
    dialog.className = "dland-modal-dialog";

    dialog.innerHTML = `
      <div class="dland-modal-header">
        <h3 class="dland-modal-title">
          <span>📖</span> Tra Mazii & Thêm Vào Sổ Tay
        </h3>
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
          displayReading.textContent = [d.hiragana, d.onyomi ? `[${d.onyomi}]` : ""]
            .filter(Boolean)
            .join(" • ") || "Đã tìm thấy từ điển Mazii";
        } else {
          displayReading.textContent = "Không tìm thấy trong Mazii, hãy nhập nghĩa bên dưới";
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
            showToast(`✅ Đã thêm "${kanji || hiragana}" vào sổ tay ${saveRes.notebookName || ""}!`);
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

  // Helper
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Listen for Context Menu trigger
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === "OPEN_LOOKUP_DIALOG" && request.selectedText) {
      openLookupDialog(request.selectedText);
    }
  });
})();
