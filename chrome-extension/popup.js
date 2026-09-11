// Dland Language Flashcard - Popup Script (Manifest V3)

document.addEventListener("DOMContentLoaded", () => {
  // App State
  let notebooks = [];
  let user = null;
  let authToken = null;
  let settings = {
    webUrl: "https://flashcard-japanese-eight.vercel.app",
    apiUrl: "https://flashcard-japanese-eight.vercel.app",
    autoSync: true,
    tooltipEnabled: true,
  };
  let searchTerm = "";
  const expandedNotebookIds = new Set();

  // DOM Elements
  const statusDot = document.getElementById("statusDot");
  const syncStatusText = document.getElementById("syncStatusText");
  const authBar = document.getElementById("authBar");
  const headerWebLink = document.getElementById("headerWebLink");
  const btnOpenSettings = document.getElementById("btnOpenSettings");
  const totalNotebooksCount = document.getElementById("totalNotebooksCount");
  const totalVocabCount = document.getElementById("totalVocabCount");
  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const notebooksList = document.getElementById("notebooksList");
  const btnOpenNewNbModal = document.getElementById("btnOpenNewNbModal");

  const quickTooltipToggle = document.getElementById("quickTooltipToggle");
  const quickTooltipStatusText = document.getElementById("quickTooltipStatusText");

  // Modals
  const loginModal = document.getElementById("loginModal");
  const btnCloseLoginModal = document.getElementById("btnCloseLoginModal");
  const loginUsername = document.getElementById("loginUsername");
  const loginPassword = document.getElementById("loginPassword");
  const loginErrorMsg = document.getElementById("loginErrorMsg");
  const btnSubmitLogin = document.getElementById("btnSubmitLogin");
  const btnSyncFromWebInModal = document.getElementById("btnSyncFromWebInModal");

  const settingsModal = document.getElementById("settingsModal");
  const btnCloseSettingsModal = document.getElementById("btnCloseSettingsModal");
  const btnCancelSettings = document.getElementById("btnCancelSettings");
  const btnSaveSettings = document.getElementById("btnSaveSettings");
  const settingWebUrl = document.getElementById("settingWebUrl");
  const settingApiUrl = document.getElementById("settingApiUrl");
  const settingAutoSync = document.getElementById("settingAutoSync");
  const settingTooltipEnabled = document.getElementById("settingTooltipEnabled");
  const btnTestConnection = document.getElementById("btnTestConnection");
  const testResultBadge = document.getElementById("testResultBadge");
  const btnDownloadFromDb = document.getElementById("btnDownloadFromDb");
  const btnUploadToDb = document.getElementById("btnUploadToDb");
  const presetWebVercel = document.getElementById("presetWebVercel");
  const presetWebLocal = document.getElementById("presetWebLocal");
  const presetApiVercel = document.getElementById("presetApiVercel");
  const presetApiLocal = document.getElementById("presetApiLocal");

  // Admin Lock & Login Notice Elements
  const loginCurrentApiDisplay = document.getElementById("loginCurrentApiDisplay");
  const adminLockBanner = document.getElementById("adminLockBanner");
  const adminBadgeIcon = document.getElementById("adminBadgeIcon");
  const adminBadgeTitle = document.getElementById("adminBadgeTitle");
  const adminBadgeDesc = document.getElementById("adminBadgeDesc");
  const btnUnlockAdmin = document.getElementById("btnUnlockAdmin");
  const btnUnlockAdminText = document.getElementById("btnUnlockAdminText");
  const badgeWebUrl = document.getElementById("badgeWebUrl");
  const badgeApiUrl = document.getElementById("badgeApiUrl");

  const adminUnlockModal = document.getElementById("adminUnlockModal");
  const btnCloseAdminUnlockModal = document.getElementById("btnCloseAdminUnlockModal");
  const btnCancelAdminUnlock = document.getElementById("btnCancelAdminUnlock");
  const btnSubmitAdminUnlock = document.getElementById("btnSubmitAdminUnlock");
  const adminPasscodeInput = document.getElementById("adminPasscodeInput");
  const adminUnlockError = document.getElementById("adminUnlockError");

  let isAdminUnlocked = false;
  let sessionAdminKey = "";


  const newNbModal = document.getElementById("newNbModal");
  const btnCloseNewNbModal = document.getElementById("btnCloseNewNbModal");
  const btnCancelNewNb = document.getElementById("btnCancelNewNb");
  const btnSubmitNewNb = document.getElementById("btnSubmitNewNb");
  const newNbNameInput = document.getElementById("newNbNameInput");
  const newNbLangSelect = document.getElementById("newNbLangSelect");

  const addWordModal = document.getElementById("addWordModal");
  const btnCloseAddWordModal = document.getElementById("btnCloseAddWordModal");
  const btnCancelAddWord = document.getElementById("btnCancelAddWord");
  const btnSubmitAddWord = document.getElementById("btnSubmitAddWord");
  const addWordKanji = document.getElementById("addWordKanji");
  const addWordHiragana = document.getElementById("addWordHiragana");
  const addWordOnyomi = document.getElementById("addWordOnyomi");
  const addWordMeaning = document.getElementById("addWordMeaning");
  const addWordType = document.getElementById("addWordType");
  const addWordTargetNotebook = document.getElementById("addWordTargetNotebook");

  // =========================================================================
  // 1. INITIAL LOAD & DATA FETCHING
  // =========================================================================
  function loadData() {
    chrome.runtime.sendMessage({ action: "GET_NOTEBOOKS" }, (res) => {
      if (!res) return;

      notebooks = res.notebooks || [];
      authToken = res.authToken || null;
      user = res.user || null;
      settings.webUrl = res.webUrl || "https://flashcard-japanese-eight.vercel.app";
      settings.apiUrl = res.apiUrl || "http://localhost:3001";
      settings.autoSync = res.autoSync !== false;
      settings.tooltipEnabled = res.tooltipEnabled !== false;

      // Update Web App Link
      if (headerWebLink) {
        headerWebLink.href = settings.webUrl;
      }

      // Default expand first notebook
      if (notebooks.length > 0 && expandedNotebookIds.size === 0) {
        expandedNotebookIds.add(notebooks[0].id);
      }

      updateTooltipUI(settings.tooltipEnabled);
      setAdminUnlockedState(Boolean(user && user.isAdmin) || isAdminUnlocked);

      renderAuthBar();
      renderStats();
      renderNotebooks();
    });
  }

  // =========================================================================
  // ADMIN STATE & UNLOCK LOGIC
  // =========================================================================
  function setAdminUnlockedState(unlocked) {
    const isUserAdmin = Boolean(user && user.isAdmin);
    isAdminUnlocked = Boolean(unlocked) || isUserAdmin;

    if (isAdminUnlocked) {
      adminLockBanner?.classList.add("unlocked");
      if (adminBadgeIcon) adminBadgeIcon.textContent = "👑";
      if (adminBadgeTitle) {
        adminBadgeTitle.textContent = isUserAdmin
          ? `Admin: ${user?.username} (Đã xác thực)`
          : "Quyền Quản Trị Viên (Đã mở khóa)";
      }
      if (adminBadgeDesc) {
        adminBadgeDesc.textContent = "Bạn có toàn quyền chỉnh sửa URL Client và URL API Server bên dưới.";
      }
      if (btnUnlockAdminText) {
        btnUnlockAdminText.textContent = isUserAdmin ? "👑 Đã cấp quyền" : "🔒 Khóa lại";
      }
      if (btnUnlockAdmin && isUserAdmin) {
        btnUnlockAdmin.style.display = "none";
      } else if (btnUnlockAdmin) {
        btnUnlockAdmin.style.display = "block";
      }

      if (settingWebUrl) { settingWebUrl.readOnly = false; settingWebUrl.disabled = false; }
      if (settingApiUrl) { settingApiUrl.readOnly = false; settingApiUrl.disabled = false; }
      if (presetWebVercel) presetWebVercel.disabled = false;
      if (presetWebLocal) presetWebLocal.disabled = false;
      if (presetApiVercel) presetApiVercel.disabled = false;
      if (presetApiLocal) presetApiLocal.disabled = false;

      if (badgeWebUrl) { badgeWebUrl.textContent = "👑 Cho phép sửa"; badgeWebUrl.classList.add("unlocked"); }
      if (badgeApiUrl) { badgeApiUrl.textContent = "👑 Cho phép sửa"; badgeApiUrl.classList.add("unlocked"); }
    } else {
      adminLockBanner?.classList.remove("unlocked");
      if (adminBadgeIcon) adminBadgeIcon.textContent = "🔒";
      if (adminBadgeTitle) adminBadgeTitle.textContent = "Cấu hình URL (Chỉ Admin)";
      if (adminBadgeDesc) {
        adminBadgeDesc.textContent = "URL Client & API Server chỉ Quản trị viên mới được quyền chỉnh sửa.";
      }
      if (btnUnlockAdminText) btnUnlockAdminText.textContent = "🔓 Mở khóa Admin";
      if (btnUnlockAdmin) btnUnlockAdmin.style.display = "block";

      if (settingWebUrl) { settingWebUrl.readOnly = true; settingWebUrl.disabled = true; }
      if (settingApiUrl) { settingApiUrl.readOnly = true; settingApiUrl.disabled = true; }
      if (presetWebVercel) presetWebVercel.disabled = true;
      if (presetWebLocal) presetWebLocal.disabled = true;
      if (presetApiVercel) presetApiVercel.disabled = true;
      if (presetApiLocal) presetApiLocal.disabled = true;

      if (badgeWebUrl) { badgeWebUrl.textContent = "🔒 Chỉ Admin"; badgeWebUrl.classList.remove("unlocked"); }
      if (badgeApiUrl) { badgeApiUrl.textContent = "🔒 Chỉ Admin"; badgeApiUrl.classList.remove("unlocked"); }
    }
  }

  // =========================================================================
  // TOOLTIP ON/OFF QUICK CONTROL
  // =========================================================================

  function updateTooltipUI(isEnabled) {
    const enabled = isEnabled !== false;
    if (quickTooltipToggle) {
      quickTooltipToggle.checked = enabled;
    }
    if (quickTooltipStatusText) {
      if (enabled) {
        quickTooltipStatusText.textContent = "Đang BẬT (Hiện khi bôi đen)";
        quickTooltipStatusText.classList.remove("disabled");
      } else {
        quickTooltipStatusText.textContent = "Đang TẮT (Ẩn khi bôi đen)";
        quickTooltipStatusText.classList.add("disabled");
      }
    }
    if (settingTooltipEnabled) {
      settingTooltipEnabled.checked = enabled;
    }
  }

  quickTooltipToggle?.addEventListener("change", () => {
    const isEnabled = quickTooltipToggle.checked;
    updateTooltipUI(isEnabled);
    settings.tooltipEnabled = isEnabled;
    chrome.runtime.sendMessage({ action: "SET_TOOLTIP_ENABLED", enabled: isEnabled });
  });

  settingTooltipEnabled?.addEventListener("change", () => {
    const isEnabled = settingTooltipEnabled.checked;
    updateTooltipUI(isEnabled);
    settings.tooltipEnabled = isEnabled;
    chrome.runtime.sendMessage({ action: "SET_TOOLTIP_ENABLED", enabled: isEnabled });
  });


  // =========================================================================
  // 2. RENDER AUTH BAR & STATUS
  // =========================================================================
  function renderAuthBar() {
    if (authToken && user) {
      statusDot.className = "status-dot online";
      syncStatusText.textContent = `Online (${user.username})`;

      authBar.innerHTML = `
        <div class="auth-logged-in">
          <div class="user-info-badge">
            <span style="font-size: 14px;">👤</span>
            <span class="user-name">${escapeHtml(user.username)}</span>
            <span class="db-connected-tag">🟢 Đã kết nối DB</span>
          </div>
          <div class="user-actions">
            <button type="button" class="btn-auth btn-auth-outline" id="btnSyncDbNow" title="Tải dữ liệu mới nhất từ Database">
              <span>🔄 Đồng bộ DB</span>
            </button>
            <button type="button" class="btn-auth btn-auth-ghost" id="btnLogout" title="Đăng xuất tài khoản">
              <span>🚪 Thoát</span>
            </button>
          </div>
        </div>
      `;

      document.getElementById("btnSyncDbNow")?.addEventListener("click", handleSyncFromDatabase);
      document.getElementById("btnLogout")?.addEventListener("click", handleLogout);
    } else {
      statusDot.className = "status-dot offline";
      syncStatusText.textContent = "Chế độ lưu Offline";

      authBar.innerHTML = `
        <div class="auth-guest">
          <div class="guest-info">
            <span>💾 Lưu cục bộ</span>
          </div>
          <div class="guest-actions">
            <button type="button" class="btn-auth btn-auth-primary" id="btnOpenLoginModal">
              <span>🔑 Đăng nhập</span>
            </button>
            <button type="button" class="btn-auth btn-auth-outline" id="btnSyncFromWeb" title="Tự động đồng bộ từ tab Web App đang mở">
              <span>🔗 Đồng bộ từ Web App</span>
            </button>
          </div>
        </div>
      `;

      document.getElementById("btnOpenLoginModal")?.addEventListener("click", () => {
        loginErrorMsg.style.display = "none";
        if (loginCurrentApiDisplay) {
          loginCurrentApiDisplay.textContent = settings.apiUrl || "http://localhost:3001";
        }
        loginModal.style.display = "flex";
        loginUsername.focus();
      });

      document.getElementById("btnSyncFromWeb")?.addEventListener("click", handleSyncFromWeb);
    }
  }

  // =========================================================================
  // 3. STATS & NOTEBOOKS RENDERING
  // =========================================================================
  function renderStats() {
    totalNotebooksCount.textContent = notebooks.length;
    const totalWords = notebooks.reduce(
      (sum, nb) => sum + (Array.isArray(nb.vocabulary) ? nb.vocabulary.length : 0),
      0
    );
    totalVocabCount.textContent = totalWords;
  }

  function renderNotebooks() {
    notebooksList.innerHTML = "";

    if (!notebooks || notebooks.length === 0) {
      notebooksList.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 32px;">📓</div>
          <p>Chưa có sổ tay nào.</p>
          <button type="button" class="btn-primary" id="btnCreateFirstNb">➕ Tạo sổ tay đầu tiên</button>
        </div>
      `;
      document.getElementById("btnCreateFirstNb")?.addEventListener("click", () => {
        newNbModal.style.display = "flex";
        newNbNameInput.focus();
      });
      return;
    }

    const cleanFilter = searchTerm.toLowerCase().trim();

    notebooks.forEach((nb) => {
      const vocabList = Array.isArray(nb.vocabulary) ? nb.vocabulary : [];

      // Filter words if search is active
      const filteredVocab = cleanFilter
        ? vocabList.filter((v) => {
            return (
              (v.kanji && v.kanji.toLowerCase().includes(cleanFilter)) ||
              (v.hiragana && v.hiragana.toLowerCase().includes(cleanFilter)) ||
              (v.meaning && v.meaning.toLowerCase().includes(cleanFilter)) ||
              (v.onyomi && v.onyomi.toLowerCase().includes(cleanFilter)) ||
              (nb.name && nb.name.toLowerCase().includes(cleanFilter))
            );
          })
        : vocabList;

      // If searching and this notebook has no matching words and name doesn't match, skip
      if (cleanFilter && filteredVocab.length === 0 && !nb.name.toLowerCase().includes(cleanFilter)) {
        return;
      }

      const isExpanded = cleanFilter ? true : expandedNotebookIds.has(nb.id);

      const card = document.createElement("div");
      card.className = `notebook-card ${isExpanded ? "expanded" : ""}`;
      card.dataset.id = nb.id;

      card.innerHTML = `
        <div class="notebook-header" data-id="${nb.id}">
          <div class="notebook-title-wrap">
            <span class="notebook-icon">📓</span>
            <span class="notebook-name">${escapeHtml(nb.name)}</span>
            <span class="notebook-count-pill">${vocabList.length} từ</span>
          </div>
          <div class="notebook-header-right">
            <button type="button" class="btn-add-word-nb" data-nb-id="${nb.id}" title="Thêm từ vựng mới vào sổ này">
              ➕ Thêm từ
            </button>
            <span class="arrow-toggle">▼</span>
          </div>
        </div>

        <div class="notebook-vocab-list">
          ${
            filteredVocab.length === 0
              ? `<div style="text-align: center; color: #94a3b8; padding: 10px; font-size: 11px;">Chưa có từ vựng nào trong sổ tay này.</div>`
              : filteredVocab
                  .map(
                    (v) => `
              <div class="vocab-item" data-vocab-id="${v.id}">
                <div class="vocab-main">
                  <div class="vocab-top-row">
                    <span class="vocab-kanji">${escapeHtml(v.kanji || v.hiragana)}</span>
                    ${
                      v.hiragana && v.hiragana !== v.kanji
                        ? `<span class="vocab-reading">${escapeHtml(v.hiragana)}</span>`
                        : ""
                    }
                    ${v.onyomi ? `<span class="vocab-onyomi-tag">${escapeHtml(v.onyomi)}</span>` : ""}
                  </div>
                  <div class="vocab-bottom-row">
                    <span class="vocab-meaning">${escapeHtml(v.meaning || "Chưa có nghĩa")}</span>
                  </div>
                </div>
                <div class="vocab-actions">
                  <button type="button" class="btn-vocab-icon btn-speak-word" data-word="${escapeHtml(
                    v.kanji || v.hiragana
                  )}" title="Phát âm tiếng Nhật">🔊</button>
                  <button type="button" class="btn-vocab-icon danger btn-delete-word" data-nb-id="${
                    nb.id
                  }" data-vocab-id="${v.id}" title="Xóa từ này">🗑️</button>
                </div>
              </div>
            `
                  )
                  .join("")
          }
        </div>
      `;

      // Header click toggles expand
      card.querySelector(".notebook-header").addEventListener("click", (e) => {
        if (e.target.closest(".btn-add-word-nb")) return;
        if (expandedNotebookIds.has(nb.id)) {
          expandedNotebookIds.delete(nb.id);
          card.classList.remove("expanded");
        } else {
          expandedNotebookIds.add(nb.id);
          card.classList.add("expanded");
        }
      });

      // Add word button
      card.querySelector(".btn-add-word-nb").addEventListener("click", (e) => {
        e.stopPropagation();
        openAddWordModal(nb.id);
      });

      // Speak word buttons
      card.querySelectorAll(".btn-speak-word").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          speakWord(btn.dataset.word);
        });
      });

      // Delete word buttons
      card.querySelectorAll(".btn-delete-word").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteWord(btn.dataset.nbId, btn.dataset.vocabId);
        });
      });

      notebooksList.appendChild(card);
    });

    if (notebooksList.children.length === 0 && cleanFilter) {
      notebooksList.innerHTML = `
        <div class="empty-state">
          <p>Không tìm thấy từ vựng nào khớp với "<b>${escapeHtml(cleanFilter)}</b>".</p>
        </div>
      `;
    }
  }

  // =========================================================================
  // 4. AUTH & SYNC ACTIONS
  // =========================================================================
  async function handleLogin() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value.trim();

    if (!username || !password) {
      showLoginError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu");
      return;
    }

    btnSubmitLogin.disabled = true;
    btnSubmitLogin.textContent = "Đang đăng nhập...";
    loginErrorMsg.style.display = "none";

    chrome.runtime.sendMessage(
      { action: "LOGIN_WITH_CREDENTIALS", username, password },
      (res) => {
        btnSubmitLogin.disabled = false;
        btnSubmitLogin.textContent = "Đăng nhập";

        if (res && res.success) {
          loginModal.style.display = "none";
          loginPassword.value = "";
          alert(`✅ Đăng nhập thành công! Chào mừng ${res.user?.username || ""}.`);
          loadData();
        } else {
          showLoginError(res?.error || "Đăng nhập thất bại. Kiểm tra lại thông tin hoặc URL Server.");
        }
      }
    );
  }

  function showLoginError(msg) {
    loginErrorMsg.textContent = msg;
    loginErrorMsg.style.display = "block";
  }

  function handleLogout() {
    if (confirm("Bạn có chắc chắn muốn đăng xuất tài khoản trên extension không?")) {
      chrome.runtime.sendMessage({ action: "LOGOUT" }, () => {
        authToken = null;
        user = null;
        renderAuthBar();
      });
    }
  }

  function handleSyncFromWeb() {
    syncStatusText.textContent = "Đang đồng bộ...";
    chrome.runtime.sendMessage({ action: "SYNC_LOGIN_FROM_OPEN_TABS" }, (res) => {
      if (res && res.success) {
        alert(
          `✅ Đã đồng bộ thành công tài khoản "${res.user?.username || ""}" và ${
            res.notebooksCount || 0
          } sổ tay từ Web App!`
        );
        loadData();
      } else {
        alert(res?.message || "Không tìm thấy phiên đăng nhập trên tab Web App nào.");
      }
    });
  }

  function handleSyncFromDatabase() {
    syncStatusText.textContent = "Đang tải DB...";
    chrome.runtime.sendMessage({ action: "SYNC_FROM_DATABASE_NOW" }, (res) => {
      if (res && res.success) {
        alert(`✅ Đã đồng bộ ${res.notebooksCount} sổ tay mới nhất từ Database!`);
        loadData();
      } else {
        alert(`⚠️ Lỗi đồng bộ Database: ${res?.error || "Không thể kết nối máy chủ"}`);
        syncStatusText.textContent = `Online (${user?.username || ""})`;
      }
    });
  }

  // =========================================================================
  // 5. SETTINGS MODAL ACTIONS
  // =========================================================================
  btnOpenSettings?.addEventListener("click", () => {
    settingWebUrl.value = settings.webUrl || "https://flashcard-japanese-eight.vercel.app";
    settingApiUrl.value = settings.apiUrl || "http://localhost:3001";
    settingAutoSync.checked = settings.autoSync !== false;
    settingTooltipEnabled.checked = settings.tooltipEnabled !== false;

    testResultBadge.className = "test-result-badge";
    testResultBadge.textContent = "Chưa kiểm tra";

    // Refresh Admin locked/unlocked state
    setAdminUnlockedState(isAdminUnlocked || Boolean(user && user.isAdmin));

    settingsModal.style.display = "flex";
  });

  btnCloseSettingsModal?.addEventListener("click", () => (settingsModal.style.display = "none"));
  btnCancelSettings?.addEventListener("click", () => (settingsModal.style.display = "none"));

  // Admin Unlock Buttons & Handlers
  btnUnlockAdmin?.addEventListener("click", () => {
    if (user && user.isAdmin) {
      setAdminUnlockedState(true);
      return;
    }

    if (isAdminUnlocked) {
      // Toggle back to locked
      setAdminUnlockedState(false);
      sessionAdminKey = "";
    } else {
      adminUnlockError.style.display = "none";
      adminPasscodeInput.value = "";
      adminUnlockModal.style.display = "flex";
      adminPasscodeInput.focus();
    }
  });

  btnCloseAdminUnlockModal?.addEventListener("click", () => (adminUnlockModal.style.display = "none"));
  btnCancelAdminUnlock?.addEventListener("click", () => (adminUnlockModal.style.display = "none"));

  btnSubmitAdminUnlock?.addEventListener("click", () => {
    const key = adminPasscodeInput.value.trim();
    if (!key) {
      adminUnlockError.textContent = "Vui lòng nhập mã Quản trị viên (Admin Key)";
      adminUnlockError.style.display = "block";
      return;
    }

    btnSubmitAdminUnlock.disabled = true;
    btnSubmitAdminUnlock.textContent = "Đang kiểm tra...";

    chrome.runtime.sendMessage({ action: "VERIFY_ADMIN_KEY", key }, (res) => {
      btnSubmitAdminUnlock.disabled = false;
      btnSubmitAdminUnlock.textContent = "Xác nhận";

      if (res && res.isValid) {
        sessionAdminKey = key;
        setAdminUnlockedState(true);
        adminUnlockModal.style.display = "none";
        alert("👑 Đã mở khóa quyền Admin thành công! Bạn có thể chỉnh sửa URL Client và API Server.");
      } else {
        adminUnlockError.textContent = "Mã Admin không đúng. Mặc định là 'admin', hoặc kiểm tra lại với quản trị viên.";
        adminUnlockError.style.display = "block";
      }
    });
  });

  // Presets (Only work when unlocked by Admin)
  presetWebVercel?.addEventListener("click", () => {
    if (!presetWebVercel.disabled) {
      settingWebUrl.value = "https://flashcard-japanese-eight.vercel.app";
    }
  });
  presetWebLocal?.addEventListener("click", () => {
    if (!presetWebLocal.disabled) {
      settingWebUrl.value = "http://localhost:3000";
    }
  });
  presetApiVercel?.addEventListener("click", () => {
    if (!presetApiVercel.disabled) {
      settingApiUrl.value = "https://flashcard-japanese-eight.vercel.app";
    }
  });
  presetApiLocal?.addEventListener("click", () => {
    if (!presetApiLocal.disabled) {
      settingApiUrl.value = "http://localhost:3001";
    }
  });

  // Test Connection
  btnTestConnection?.addEventListener("click", () => {
    const urlToTest = settingApiUrl.value.trim();
    testResultBadge.className = "test-result-badge";
    testResultBadge.textContent = "Đang kiểm tra...";

    chrome.runtime.sendMessage({ action: "TEST_SERVER_CONNECTION", apiUrl: urlToTest }, (res) => {
      if (res && res.success) {
        testResultBadge.className = "test-result-badge success";
        testResultBadge.textContent = `🟢 ${res.status}`;
      } else {
        testResultBadge.className = "test-result-badge error";
        testResultBadge.textContent = `🔴 ${res?.status || "Lỗi"}`;
      }
    });
  });

  // Database operations inside Settings
  btnDownloadFromDb?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "SYNC_FROM_DATABASE_NOW" }, (res) => {
      if (res && res.success) {
        alert(`✅ Đã tải ${res.notebooksCount} sổ tay từ Database thành công!`);
        loadData();
      } else {
        alert(`⚠️ Thất bại: ${res?.error || "Chưa đăng nhập hoặc không kết nối được Database"}`);
      }
    });
  });

  btnUploadToDb?.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "UPLOAD_TO_DATABASE_NOW" }, (res) => {
      if (res && res.success) {
        alert(`☁️ Đã đẩy toàn bộ dữ liệu máy lên Database thành công!`);
      } else {
        alert(`⚠️ Thất bại: ${res?.error || "Chưa đăng nhập hoặc không kết nối được Database"}`);
      }
    });
  });

  // Save Settings
  btnSaveSettings?.addEventListener("click", () => {
    const newSettings = {
      webUrl: settingWebUrl.value.trim() || "https://flashcard-japanese-eight.vercel.app",
      apiUrl: settingApiUrl.value.trim() || "http://localhost:3001",
      autoSync: settingAutoSync.checked,
      tooltipEnabled: settingTooltipEnabled.checked,
    };

    // Check if non-admin is trying to modify URL fields
    const urlChanged = (newSettings.webUrl !== settings.webUrl) || (newSettings.apiUrl !== settings.apiUrl);
    const isUserAdmin = Boolean(user && user.isAdmin);
    if (urlChanged && !isAdminUnlocked && !isUserAdmin) {
      alert("⛔ Quyền bị từ chối: Chỉ Quản trị viên (Admin) mới có quyền thay đổi URL Client và URL API Server. Vui lòng bấm '🔓 Mở khóa Admin' trước.");
      return;
    }

    btnSaveSettings.disabled = true;
    btnSaveSettings.textContent = "Đang lưu...";

    chrome.runtime.sendMessage(
      { action: "SAVE_SETTINGS", settings: newSettings, adminKey: sessionAdminKey },
      (res) => {
        btnSaveSettings.disabled = false;
        btnSaveSettings.textContent = "💾 Lưu Cài Đặt";

        if (res && res.success) {
          settings = newSettings;
          updateTooltipUI(newSettings.tooltipEnabled);
          if (headerWebLink) headerWebLink.href = settings.webUrl;
          settingsModal.style.display = "none";
          alert("✅ Đã lưu cài đặt kết nối và cấu hình Database!");
        } else {
          alert(`⚠️ ${res?.error || "Không thể lưu cài đặt"}`);
        }
      }
    );
  });


  // Login Modal buttons
  btnCloseLoginModal?.addEventListener("click", () => (loginModal.style.display = "none"));
  btnSubmitLogin?.addEventListener("click", handleLogin);
  btnSyncFromWebInModal?.addEventListener("click", () => {
    loginModal.style.display = "none";
    handleSyncFromWeb();
  });

  // =========================================================================
  // 6. SEARCH & ACTIONS
  // =========================================================================
  searchInput?.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    clearSearchBtn.style.display = searchTerm ? "block" : "none";
    renderNotebooks();
  });

  clearSearchBtn?.addEventListener("click", () => {
    searchTerm = "";
    searchInput.value = "";
    clearSearchBtn.style.display = "none";
    renderNotebooks();
  });

  // Speech TTS
  function speakWord(word) {
    if (!word) return;
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.lang = "ja-JP";
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    }
  }

  // Delete word
  function deleteWord(nbId, vocabId) {
    if (!confirm("Bạn có chắc muốn xóa từ vựng này khỏi sổ tay?")) return;

    const targetNb = notebooks.find((n) => n.id === nbId);
    if (!targetNb) return;

    targetNb.vocabulary = targetNb.vocabulary.filter((v) => v.id !== vocabId);

    chrome.storage.local.set({ dland_notebooks: notebooks }, () => {
      renderStats();
      renderNotebooks();
    });
  }

  // =========================================================================
  // 7. NEW NOTEBOOK & ADD WORD MODALS
  // =========================================================================
  btnOpenNewNbModal?.addEventListener("click", () => {
    newNbNameInput.value = "";
    newNbModal.style.display = "flex";
    newNbNameInput.focus();
  });

  btnCloseNewNbModal?.addEventListener("click", () => (newNbModal.style.display = "none"));
  btnCancelNewNb?.addEventListener("click", () => (newNbModal.style.display = "none"));

  btnSubmitNewNb?.addEventListener("click", () => {
    const name = newNbNameInput.value.trim();
    if (!name) {
      alert("Vui lòng nhập tên sổ tay");
      return;
    }

    const newNb = {
      id: `nb-${Date.now()}`,
      name,
      lang: newNbLangSelect.value || "ja",
      createdAt: new Date().toISOString(),
      vocabulary: [],
    };

    notebooks.push(newNb);
    expandedNotebookIds.add(newNb.id);

    chrome.storage.local.set({ dland_notebooks: notebooks }, () => {
      newNbModal.style.display = "none";
      renderStats();
      renderNotebooks();
    });
  });

  function openAddWordModal(targetNbId) {
    addWordTargetNotebook.innerHTML = notebooks
      .map(
        (nb) =>
          `<option value="${nb.id}" ${nb.id === targetNbId ? "selected" : ""}>${escapeHtml(
            nb.name
          )}</option>`
      )
      .join("");

    addWordKanji.value = "";
    addWordHiragana.value = "";
    addWordOnyomi.value = "";
    addWordMeaning.value = "";

    addWordModal.style.display = "flex";
    addWordKanji.focus();
  }

  btnCloseAddWordModal?.addEventListener("click", () => (addWordModal.style.display = "none"));
  btnCancelAddWord?.addEventListener("click", () => (addWordModal.style.display = "none"));

  btnSubmitAddWord?.addEventListener("click", () => {
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

    chrome.runtime.sendMessage(
      {
        action: "SAVE_VOCAB",
        notebookId: targetNbId,
        vocab: { kanji, hiragana, onyomi, meaning, wordType },
      },
      (res) => {
        addWordModal.style.display = "none";
        loadData();
      }
    );
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

  // Start App
  loadData();
});
