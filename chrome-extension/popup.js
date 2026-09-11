// Dland Language Extension - Popup Script

document.addEventListener("DOMContentLoaded", () => {
  let allNotebooks = [];
  let expandedNotebookIds = new Set();
  let currentSearchQuery = "";

  // Elements
  const totalNotebooksCountEl = document.getElementById("totalNotebooksCount");
  const totalVocabCountEl = document.getElementById("totalVocabCount");
  const notebooksListEl = document.getElementById("notebooksList");
  const searchInputEl = document.getElementById("searchInput");
  const clearSearchBtnEl = document.getElementById("clearSearchBtn");
  const syncStatusTextEl = document.getElementById("syncStatusText");
  const syncDotEl = document.querySelector(".status-dot");

  // Modals
  const newNbModalEl = document.getElementById("newNbModal");
  const btnOpenNewNbModal = document.getElementById("btnOpenNewNbModal");
  const btnCloseNewNbModal = document.getElementById("btnCloseNewNbModal");
  const btnCancelNewNb = document.getElementById("btnCancelNewNb");
  const btnSubmitNewNb = document.getElementById("btnSubmitNewNb");
  const newNbNameInput = document.getElementById("newNbNameInput");
  const newNbLangSelect = document.getElementById("newNbLangSelect");

  const addWordModalEl = document.getElementById("addWordModal");
  const btnCloseAddWordModal = document.getElementById("btnCloseAddWordModal");
  const btnCancelAddWord = document.getElementById("btnCancelAddWord");
  const btnSubmitAddWord = document.getElementById("btnSubmitAddWord");
  const addWordKanji = document.getElementById("addWordKanji");
  const addWordHiragana = document.getElementById("addWordHiragana");
  const addWordOnyomi = document.getElementById("addWordOnyomi");
  const addWordMeaning = document.getElementById("addWordMeaning");
  const addWordType = document.getElementById("addWordType");
  const addWordTargetNotebook = document.getElementById("addWordTargetNotebook");

  // Load Initial Data
  async function loadData() {
    const data = await chrome.storage.local.get([
      "dland_notebooks",
      "dland_auth_token",
      "dland_user",
    ]);

    allNotebooks = data.dland_notebooks || [];
    if (!Array.isArray(allNotebooks) || allNotebooks.length === 0) {
      allNotebooks = [
        {
          id: "nb-default-ja",
          name: "Sổ tay Tiếng Nhật",
          lang: "ja",
          createdAt: new Date().toISOString(),
          vocabulary: [],
        },
      ];
      await chrome.storage.local.set({ dland_notebooks: allNotebooks });
    }

    // Check Sync / Login Status
    if (data.dland_auth_token) {
      syncDotEl.style.backgroundColor = "#10b981";
      const userName = data.dland_user?.username || "Tài khoản";
      syncStatusTextEl.textContent = `🟢 Đã kết nối (${userName})`;
    } else {
      syncDotEl.style.backgroundColor = "#f59e0b";
      syncStatusTextEl.textContent = "🟡 Chế độ Cục bộ (Chưa đăng nhập)";
    }

    // Default expand first notebook if nothing expanded yet
    if (expandedNotebookIds.size === 0 && allNotebooks.length > 0) {
      expandedNotebookIds.add(allNotebooks[0].id);
    }

    renderNotebooks();
  }

  // Render Notebooks List
  function renderNotebooks() {
    const q = currentSearchQuery.toLowerCase().trim();

    let totalWords = 0;
    allNotebooks.forEach((nb) => {
      totalWords += nb.vocabulary?.length || 0;
    });

    totalNotebooksCountEl.textContent = allNotebooks.length;
    totalVocabCountEl.textContent = totalWords;

    if (allNotebooks.length === 0) {
      notebooksListEl.innerHTML = `
        <div class="empty-state">
          <span style="font-size: 28px;">📭</span>
          <p>Chưa có sổ tay nào. Hãy bấm "➕ Tạo sổ mới" để bắt đầu!</p>
        </div>
      `;
      return;
    }

    notebooksListEl.innerHTML = "";

    allNotebooks.forEach((nb) => {
      const vocabList = nb.vocabulary || [];
      const isExpanded = expandedNotebookIds.has(nb.id) || q.length > 0;

      // Filter words if searching
      const filteredVocab = q
        ? vocabList.filter(
            (v) =>
              v.kanji?.toLowerCase().includes(q) ||
              v.hiragana?.toLowerCase().includes(q) ||
              v.meaning?.toLowerCase().includes(q) ||
              v.onyomi?.toLowerCase().includes(q)
          )
        : vocabList;

      // If searching and notebook name doesn't match and no words match, skip
      if (q && !nb.name.toLowerCase().includes(q) && filteredVocab.length === 0) {
        return;
      }

      const card = document.createElement("div");
      card.className = "nb-card";

      const flag = nb.lang === "en" ? "🇬🇧" : nb.lang === "de" ? "🇩🇪" : "🇯🇵";

      card.innerHTML = `
        <div class="nb-header" data-id="${nb.id}">
          <div class="nb-info">
            <span class="nb-icon">📓</span>
            <div>
              <div class="nb-name" title="${escapeHtml(nb.name)}">${escapeHtml(nb.name)}</div>
              <div class="nb-meta">${flag} ${vocabList.length} từ vựng</div>
            </div>
          </div>
          <div class="nb-actions">
            <button type="button" class="btn-add-word-quick" data-add-nb-id="${nb.id}" title="Thêm từ vào sổ tay này">
              ➕ Thêm từ
            </button>
            <span class="nb-expand-arrow ${isExpanded ? "open" : ""}">▶</span>
          </div>
        </div>

        <div class="nb-vocab-container" style="display: ${isExpanded ? "flex" : "none"};">
          ${
            filteredVocab.length === 0
              ? `<div style="text-align: center; color: #94a3b8; font-size: 11px; padding: 12px 0;">
                  ${q ? "Không tìm thấy từ vựng khớp tìm kiếm" : "Chưa có từ vựng nào trong sổ này"}
                </div>`
              : filteredVocab
                  .map(
                    (v) => `
                <div class="vocab-item" data-vocab-id="${v.id}">
                  <div class="vocab-word-box">
                    <div class="vocab-kanji">${escapeHtml(v.kanji || v.hiragana)}</div>
                    ${
                      v.kanji && v.hiragana
                        ? `<div class="vocab-hiragana">${escapeHtml(v.hiragana)}</div>`
                        : ""
                    }
                    <div class="vocab-meaning" title="${escapeHtml(v.meaning)}">
                      ${v.wordType ? `[${escapeHtml(v.wordType)}] ` : ""}${escapeHtml(v.meaning)}
                    </div>
                  </div>
                  <div class="vocab-controls">
                    <button type="button" class="btn-icon-small btn-speak" data-text="${escapeHtml(
                      v.kanji || v.hiragana
                    )}" title="Phát âm">
                      🔊
                    </button>
                    <button type="button" class="btn-icon-small delete btn-delete-vocab" data-nb-id="${nb.id}" data-vocab-id="${v.id}" title="Xóa từ vựng này">
                      🗑️
                    </button>
                  </div>
                </div>
              `
                  )
                  .join("")
          }
        </div>
      `;

      notebooksListEl.appendChild(card);
    });

    attachCardEvents();
  }

  // Attach dynamic event listeners for cards
  function attachCardEvents() {
    // Accordion toggle
    document.querySelectorAll(".nb-header").forEach((header) => {
      header.addEventListener("click", (e) => {
        if (e.target.closest(".btn-add-word-quick")) return;
        const nbId = header.getAttribute("data-id");
        if (expandedNotebookIds.has(nbId)) {
          expandedNotebookIds.delete(nbId);
        } else {
          expandedNotebookIds.add(nbId);
        }
        renderNotebooks();
      });
    });

    // Quick add word button
    document.querySelectorAll(".btn-add-word-quick").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const nbId = btn.getAttribute("data-add-nb-id");
        openAddWordModal(nbId);
      });
    });

    // Pronunciation button
    document.querySelectorAll(".btn-speak").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const text = btn.getAttribute("data-text");
        if (text && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = "ja-JP";
          u.rate = 0.85;
          window.speechSynthesis.speak(u);
        }
      });
    });

    // Delete word button
    document.querySelectorAll(".btn-delete-vocab").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const nbId = btn.getAttribute("data-nb-id");
        const vocabId = btn.getAttribute("data-vocab-id");
        if (confirm("Bạn có chắc muốn xóa từ vựng này khỏi sổ tay?")) {
          const nb = allNotebooks.find((n) => n.id === nbId);
          if (nb && Array.isArray(nb.vocabulary)) {
            nb.vocabulary = nb.vocabulary.filter((v) => v.id !== vocabId);
            await chrome.storage.local.set({ dland_notebooks: allNotebooks });
            renderNotebooks();
          }
        }
      });
    });
  }

  // Search handling
  searchInputEl.addEventListener("input", (e) => {
    currentSearchQuery = e.target.value;
    clearSearchBtnEl.style.display = currentSearchQuery ? "block" : "none";
    renderNotebooks();
  });

  clearSearchBtnEl.addEventListener("click", () => {
    searchInputEl.value = "";
    currentSearchQuery = "";
    clearSearchBtnEl.style.display = "none";
    renderNotebooks();
  });

  // Modal: New Notebook
  btnOpenNewNbModal.addEventListener("click", () => {
    newNbNameInput.value = "";
    newNbModalEl.style.display = "flex";
    newNbNameInput.focus();
  });

  const closeNewNbModal = () => (newNbModalEl.style.display = "none");
  btnCloseNewNbModal.addEventListener("click", closeNewNbModal);
  btnCancelNewNb.addEventListener("click", closeNewNbModal);

  btnSubmitNewNb.addEventListener("click", async () => {
    const name = newNbNameInput.value.trim();
    if (!name) {
      alert("Vui lòng nhập tên sổ tay");
      return;
    }

    const newNb = {
      id: `nb-${Date.now()}`,
      name: name,
      lang: newNbLangSelect.value || "ja",
      createdAt: new Date().toISOString(),
      vocabulary: [],
    };

    allNotebooks.unshift(newNb);
    expandedNotebookIds.add(newNb.id);
    await chrome.storage.local.set({ dland_notebooks: allNotebooks });
    closeNewNbModal();
    renderNotebooks();
  });

  // Modal: Add Word
  function openAddWordModal(preselectedNbId) {
    addWordKanji.value = "";
    addWordHiragana.value = "";
    addWordOnyomi.value = "";
    addWordMeaning.value = "";
    addWordType.value = "Danh từ";

    // Populate notebooks select
    addWordTargetNotebook.innerHTML = allNotebooks
      .map(
        (nb) =>
          `<option value="${nb.id}" ${
            nb.id === preselectedNbId ? "selected" : ""
          }>📓 ${escapeHtml(nb.name)} (${nb.vocabulary?.length || 0} từ)</option>`
      )
      .join("");

    addWordModalEl.style.display = "flex";
    addWordKanji.focus();
  }

  const closeAddWordModal = () => (addWordModalEl.style.display = "none");
  btnCloseAddWordModal.addEventListener("click", closeAddWordModal);
  btnCancelAddWord.addEventListener("click", closeAddWordModal);

  btnSubmitAddWord.addEventListener("click", async () => {
    const kanji = addWordKanji.value.trim();
    const hiragana = addWordHiragana.value.trim() || kanji;
    const onyomi = addWordOnyomi.value.trim();
    const meaning = addWordMeaning.value.trim();
    const wordType = addWordType.value;
    const targetNbId = addWordTargetNotebook.value;

    if (!kanji && !hiragana) {
      alert("Vui lòng nhập từ vựng tiếng Nhật");
      return;
    }

    btnSubmitAddWord.disabled = true;
    btnSubmitAddWord.textContent = "Đang lưu...";

    chrome.runtime.sendMessage(
      {
        action: "SAVE_VOCAB",
        notebookId: targetNbId,
        vocab: {
          kanji,
          hiragana,
          onyomi,
          meaning,
          wordType,
        },
      },
      (res) => {
        btnSubmitAddWord.disabled = false;
        btnSubmitAddWord.textContent = "💾 Lưu từ vựng";
        closeAddWordModal();
        loadData();
      }
    );
  });

  // Helpers
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Load data immediately
  loadData();
});
