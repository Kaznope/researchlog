const STORAGE_KEYS = {
  currentUser: "researchLogCurrentUser",
  legacyLogs: "researchLogEntries",
  legacyPapers: "researchLogPaperNotes"
};

const STATUS_OPTIONS = ["Planned", "In Progress", "Completed"];
const STATUS_LABELS = {
  Planned: "예정",
  "In Progress": "진행 중",
  Completed: "완료"
};
const ACTIVITY_LABELS = {
  "Paper Reading": "논문 읽기",
  Experiment: "실험",
  Coding: "코딩",
  Meeting: "회의",
  Writing: "작성",
  Idea: "아이디어"
};

let currentUser = null;
let researchLogs = [];
let paperNotes = [];

const pages = document.querySelectorAll("[data-page]");
const accountForm = document.getElementById("accountForm");
const accountInput = document.getElementById("accountInput");
const accountValidationMessage = document.getElementById("accountValidationMessage");
const logForm = document.getElementById("logForm");
const paperForm = document.getElementById("paperForm");
const logList = document.getElementById("logList");
const pastLogPreview = document.getElementById("pastLogPreview");
const paperPreviewList = document.getElementById("paperPreviewList");
const logDetailContent = document.getElementById("logDetailContent");
const activityFilter = document.getElementById("activityFilter");
const statusFilter = document.getElementById("statusFilter");
const logSearch = document.getElementById("logSearch");
const logValidationMessage = document.getElementById("logValidationMessage");
const paperValidationMessage = document.getElementById("paperValidationMessage");
const loadSampleDataButton = document.getElementById("loadSampleData");
const clearAllDataButton = document.getElementById("clearAllData");
const logoutButton = document.getElementById("logoutButton");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navigationAnchors = document.querySelectorAll(".nav-links a");

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  currentUser = loadCurrentUser();
  if (currentUser) {
    loadUserData();
  }

  logForm.setAttribute("novalidate", "");
  paperForm.setAttribute("novalidate", "");
  accountForm.setAttribute("novalidate", "");
  setDefaultDate();
  bindEvents();
  renderApp();
  routeToCurrentHash();
}

function bindEvents() {
  accountForm.addEventListener("submit", handleAccountSubmit);
  logForm.addEventListener("submit", handleLogSubmit);
  paperForm.addEventListener("submit", handlePaperSubmit);
  activityFilter.addEventListener("change", renderHistory);
  statusFilter.addEventListener("change", renderHistory);
  logSearch.addEventListener("input", renderHistory);
  loadSampleDataButton.addEventListener("click", loadSampleData);
  clearAllDataButton.addEventListener("click", clearAllData);
  logoutButton.addEventListener("click", logout);
  navToggle.addEventListener("click", toggleMobileNavigation);
  navLinks.addEventListener("click", closeMobileNavigation);
  window.addEventListener("hashchange", routeToCurrentHash);
}

function handleAccountSubmit(event) {
  event.preventDefault();
  clearValidationMessage(accountValidationMessage);

  const accountValue = accountInput.value.trim();
  if (!accountValue) {
    showValidationMessage(accountValidationMessage, "이름 또는 이메일을 입력해 주세요.");
    return;
  }

  currentUser = {
    id: normalizeAccountId(accountValue),
    name: accountValue
  };
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser));
  loadUserData();
  renderApp();
  window.location.hash = "#dashboard";
}

function handleLogSubmit(event) {
  event.preventDefault();
  clearValidationMessage(logValidationMessage);

  const newLog = {
    id: createId(),
    date: getInputValue("logDate"),
    projectName: getInputValue("projectName"),
    activityType: getInputValue("activityType"),
    status: getInputValue("status"),
    summary: getInputValue("summary"),
    nextAction: getInputValue("nextAction"),
    createdAt: new Date().toISOString()
  };

  const validationError = validateResearchLog(newLog);
  if (validationError) {
    showValidationMessage(logValidationMessage, validationError);
    return;
  }

  researchLogs.unshift(newLog);
  saveUserData();
  logForm.reset();
  setDefaultDate();
  renderApp();
  window.location.hash = `#log-${newLog.id}`;
}

function handlePaperSubmit(event) {
  event.preventDefault();
  clearValidationMessage(paperValidationMessage);

  const newPaperNote = {
    id: createId(),
    title: getInputValue("paperTitle"),
    authors: getInputValue("authors"),
    keyFinding: getInputValue("keyFinding"),
    relevance: getInputValue("relevance"),
    createdAt: new Date().toISOString()
  };

  const validationError = validatePaperNote(newPaperNote);
  if (validationError) {
    showValidationMessage(paperValidationMessage, validationError);
    return;
  }

  paperNotes.unshift(newPaperNote);
  saveUserData();
  paperForm.reset();
  renderApp();
  window.location.hash = "#dashboard";
}

function routeToCurrentHash() {
  const hash = window.location.hash || "#home";

  if (!currentUser && hash !== "#home") {
    showPage("home");
    setActiveNavigation("#home");
    return;
  }

  if (hash.startsWith("#log-")) {
    const logId = hash.replace("#log-", "");
    renderLogDetail(logId);
    showPage("log-detail");
    setActiveNavigation("#history");
    return;
  }

  const route = hash.replace("#", "") || "home";
  const allowedRoutes = ["home", "dashboard", "history", "log-new", "paper-new"];
  showPage(allowedRoutes.includes(route) ? route : "dashboard");
  setActiveNavigation(`#${allowedRoutes.includes(route) ? route : "dashboard"}`);
}

function showPage(pageName) {
  pages.forEach((page) => {
    page.classList.toggle("active-page", page.dataset.page === pageName);
  });
  window.scrollTo({ top: 0, behavior: "auto" });
}

function renderApp() {
  renderNavigationState();
  renderDashboard();
  renderHistory();
  renderPaperPreview();
}

function renderNavigationState() {
  document.querySelectorAll("[data-auth-link]").forEach((link) => {
    link.hidden = !currentUser;
  });
  logoutButton.hidden = !currentUser;
  document.getElementById("dashboardUserName").textContent = currentUser ? currentUser.name : "내";
}

function renderDashboard() {
  const total = researchLogs.length;
  const completed = countLogsByStatus("Completed");
  const inProgress = countLogsByStatus("In Progress");
  const planned = countLogsByStatus("Planned");
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("totalLogs").textContent = total;
  document.getElementById("completedLogs").textContent = completed;
  document.getElementById("inProgressLogs").textContent = inProgress;
  document.getElementById("plannedLogs").textContent = planned;
  document.getElementById("completionRate").textContent = `${completionRate}%`;
  document.getElementById("progressText").textContent = `${completionRate}%`;
  document.getElementById("progressFill").style.width = `${completionRate}%`;

  renderPastLogPreview();
}

function renderPastLogPreview() {
  pastLogPreview.innerHTML = "";

  if (researchLogs.length === 0) {
    pastLogPreview.innerHTML = '<p class="empty-state">아직 연구 기록이 없습니다. 연구 기록 추가 버튼으로 첫 기록을 남겨 보세요.</p>';
    return;
  }

  getSortedLogs().slice(0, 4).forEach((log) => {
    pastLogPreview.appendChild(createLogSummaryCard(log));
  });
}

function renderHistory() {
  const filteredLogs = getFilteredLogs();
  logList.innerHTML = "";

  if (researchLogs.length === 0) {
    logList.innerHTML = '<p class="empty-state">아직 과거 연구 기록이 없습니다.</p>';
    return;
  }

  if (filteredLogs.length === 0) {
    logList.innerHTML = '<p class="empty-state">조건에 맞는 연구 기록이 없습니다.</p>';
    return;
  }

  filteredLogs.forEach((log) => {
    logList.appendChild(createLogSummaryCard(log, { detailed: true }));
  });
}

function createLogSummaryCard(log, options = {}) {
  const card = document.createElement("article");
  card.className = "entry-card clickable-card";
  card.innerHTML = `
    <a class="card-link" href="#log-${escapeHtml(log.id)}" aria-label="${escapeHtml(log.projectName || "연구 기록")} 상세 보기">
      <div class="entry-header">
        <h3>${escapeHtml(log.projectName || "제목 없는 프로젝트")}</h3>
        <span class="tag ${getStatusClass(log.status)}">${escapeHtml(getStatusLabel(log.status))}</span>
      </div>
      <div class="entry-meta">
        <span class="tag">${formatDate(log.date)}</span>
        <span class="tag teal">${escapeHtml(getActivityLabel(log.activityType))}</span>
      </div>
      <p><strong>요약:</strong> ${escapeHtml(log.summary || "등록된 요약이 없습니다.")}</p>
      ${options.detailed ? `<p><strong>다음 할 일:</strong> ${escapeHtml(log.nextAction || "등록된 다음 할 일이 없습니다.")}</p>` : ""}
    </a>
  `;
  return card;
}

function renderLogDetail(logId) {
  const log = researchLogs.find((item) => item.id === logId);
  const detailTitle = document.getElementById("detailTitle");

  if (!log) {
    detailTitle.textContent = "연구 기록을 찾을 수 없습니다";
    logDetailContent.innerHTML = '<p class="empty-state">삭제되었거나 존재하지 않는 연구 기록입니다.</p>';
    return;
  }

  detailTitle.textContent = log.projectName || "제목 없는 프로젝트";
  logDetailContent.innerHTML = `
    <div class="detail-meta">
      <span class="tag">${formatDate(log.date)}</span>
      <span class="tag teal">${escapeHtml(getActivityLabel(log.activityType))}</span>
      <span class="tag ${getStatusClass(log.status)}">${escapeHtml(getStatusLabel(log.status))}</span>
    </div>
    <section>
      <h3>진행한 연구 내용</h3>
      <p>${escapeHtml(log.summary || "등록된 요약이 없습니다.")}</p>
    </section>
    <section>
      <h3>정리된 후속 작업</h3>
      <p>${escapeHtml(log.nextAction || "등록된 다음 할 일이 없습니다.")}</p>
    </section>
    <div class="detail-actions">
      <select class="status-select" id="detailStatusSelect" aria-label="연구 기록 상태 변경">
        ${STATUS_OPTIONS.map((status) => `<option value="${status}" ${status === log.status ? "selected" : ""}>${getStatusLabel(status)}</option>`).join("")}
      </select>
      <button class="delete-button" id="detailDeleteButton" type="button">이 기록 삭제</button>
    </div>
  `;

  document.getElementById("detailStatusSelect").addEventListener("change", (event) => {
    updateLogStatus(log.id, event.target.value);
    renderLogDetail(log.id);
  });
  document.getElementById("detailDeleteButton").addEventListener("click", () => {
    deleteLog(log.id);
    window.location.hash = "#history";
  });
}

function renderPaperPreview() {
  paperPreviewList.innerHTML = "";
  document.getElementById("paperCount").textContent = formatKoreanCount(paperNotes.length);

  if (paperNotes.length === 0) {
    paperPreviewList.innerHTML = '<p class="empty-state">아직 논문 노트가 없습니다. 논문 노트 작성 버튼으로 첫 노트를 남겨 보세요.</p>';
    return;
  }

  paperNotes.slice(0, 4).forEach((note) => {
    const card = document.createElement("article");
    card.className = "entry-card";
    card.innerHTML = `
      <div class="entry-header">
        <h3>${escapeHtml(note.title || "제목 없는 논문")}</h3>
        <button class="delete-button" type="button" data-paper-id="${escapeHtml(note.id)}">삭제</button>
      </div>
      <div class="entry-meta">
        <span class="tag teal">${escapeHtml(note.authors || "저자 미기재")}</span>
      </div>
      <p><strong>핵심 내용:</strong> ${escapeHtml(note.keyFinding || "")}</p>
      <p><strong>관련성:</strong> ${escapeHtml(note.relevance || "등록된 관련성 메모가 없습니다.")}</p>
    `;
    card.querySelector(".delete-button").addEventListener("click", () => deletePaperNote(note.id));
    paperPreviewList.appendChild(card);
  });
}

function getFilteredLogs() {
  const selectedActivity = activityFilter.value;
  const selectedStatus = statusFilter.value;
  const searchTerm = logSearch.value.trim().toLowerCase();

  return getSortedLogs().filter((log) => {
    const activityMatches = selectedActivity === "All" || log.activityType === selectedActivity;
    const statusMatches = selectedStatus === "All" || log.status === selectedStatus;
    const searchableText = [
      log.projectName,
      log.summary,
      log.nextAction,
      getActivityLabel(log.activityType),
      getStatusLabel(log.status)
    ].join(" ").toLowerCase();

    return activityMatches && statusMatches && (searchTerm === "" || searchableText.includes(searchTerm));
  });
}

function getSortedLogs() {
  return [...researchLogs].sort((first, second) => getLogTimestamp(second) - getLogTimestamp(first));
}

function getLogTimestamp(log) {
  const dateTime = Date.parse(`${log.date || ""}T00:00:00`);
  const createdTime = Date.parse(log.createdAt || "");
  return Number.isNaN(dateTime) ? createdTime || 0 : dateTime;
}

function updateLogStatus(logId, status) {
  if (!STATUS_OPTIONS.includes(status)) {
    return;
  }

  researchLogs = researchLogs.map((log) => log.id === logId ? { ...log, status } : log);
  saveUserData();
  renderApp();
}

function deleteLog(logId) {
  researchLogs = researchLogs.filter((log) => log.id !== logId);
  saveUserData();
  renderApp();
}

function deletePaperNote(noteId) {
  paperNotes = paperNotes.filter((note) => note.id !== noteId);
  saveUserData();
  renderApp();
}

function loadSampleData() {
  const hasExistingData = researchLogs.length > 0 || paperNotes.length > 0;
  if (hasExistingData && !confirm("샘플 데이터가 현재 계정 데이터에 추가됩니다. 계속할까요?")) {
    return;
  }

  const sampleData = createSampleData();
  researchLogs = [...sampleData.logs, ...researchLogs];
  paperNotes = [...sampleData.papers, ...paperNotes];
  saveUserData();
  renderApp();
}

function clearAllData() {
  if (!confirm("현재 계정의 모든 연구 기록과 논문 노트를 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) {
    return;
  }

  researchLogs = [];
  paperNotes = [];
  saveUserData();
  renderApp();
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
  currentUser = null;
  researchLogs = [];
  paperNotes = [];
  renderApp();
  window.location.hash = "#home";
}

function loadCurrentUser() {
  try {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
    return user && user.id && user.name ? user : null;
  } catch {
    return null;
  }
}

function loadUserData() {
  researchLogs = loadFromStorage(getUserStorageKey("logs"));
  paperNotes = loadFromStorage(getUserStorageKey("papers"));
}

function saveUserData() {
  if (!currentUser) {
    return;
  }
  localStorage.setItem(getUserStorageKey("logs"), JSON.stringify(researchLogs));
  localStorage.setItem(getUserStorageKey("papers"), JSON.stringify(paperNotes));
}

function getUserStorageKey(type) {
  return `researchLog:${currentUser.id}:${type}`;
}

function normalizeAccountId(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9가-힣_-]+/g, "-").replace(/^-+|-+$/g, "") || createId();
}

function validateResearchLog(log) {
  if (!log.date) {
    return "연구 기록 날짜를 선택해 주세요.";
  }
  if (!log.projectName) {
    return "프로젝트명을 입력해 주세요.";
  }
  if (!log.activityType) {
    return "활동 유형을 선택해 주세요.";
  }
  if (!log.status) {
    return "상태를 선택해 주세요.";
  }
  if (!log.summary) {
    return "저장하기 전에 요약을 입력해 주세요.";
  }
  return "";
}

function validatePaperNote(note) {
  if (!note.title) {
    return "논문 제목을 입력해 주세요.";
  }
  if (!note.keyFinding) {
    return "저장하기 전에 핵심 내용을 입력해 주세요.";
  }
  return "";
}

function createSampleData() {
  const today = new Date();
  const yesterday = addDays(today, -1);
  const lastWeek = addDays(today, -6);

  return {
    logs: [
      {
        id: createId(),
        date: toDateInputValue(today),
        projectName: "검색 증강 생성 관련 문헌 검토",
        activityType: "Paper Reading",
        status: "Completed",
        summary: "근거 품질과 인용 정확도를 평가하는 방법을 검토했습니다.",
        nextAction: "현재 벤치마크 계획과 평가 지표를 비교합니다.",
        createdAt: new Date().toISOString()
      },
      {
        id: createId(),
        date: toDateInputValue(yesterday),
        projectName: "단백질 접힘 실험 베이스라인",
        activityType: "Experiment",
        status: "In Progress",
        summary: "첫 학습 스윕을 실행했고 18 에폭 이후 검증 손실이 불안정해지는 현상을 기록했습니다.",
        nextAction: "학습률을 낮추고 고정된 랜덤 시드로 다시 실행합니다.",
        createdAt: yesterday.toISOString()
      },
      {
        id: createId(),
        date: toDateInputValue(lastWeek),
        projectName: "어노테이션 워크플로우 연구실 회의",
        activityType: "Meeting",
        status: "Planned",
        summary: "평가자 간 일치도와 검토 주기에 대한 주요 질문을 정리했습니다.",
        nextAction: "짧은 회의 안건을 준비하고 어노테이션 예시를 배정합니다.",
        createdAt: lastWeek.toISOString()
      }
    ],
    papers: [
      {
        id: createId(),
        title: "어텐션 기반 시퀀스 모델 연구",
        authors: "Vaswani 외",
        keyFinding: "셀프 어텐션이 순환 구조 기반 시퀀스 모델링을 대체하면서 병렬 학습 효율을 높일 수 있음을 보였습니다.",
        relevance: "현재 문헌 검토에서 모델 아키텍처를 설명하는 배경 자료로 활용할 수 있습니다.",
        createdAt: new Date().toISOString()
      },
      {
        id: createId(),
        title: "지식 집약 작업을 위한 검색 증강 생성 연구",
        authors: "Lewis 외",
        keyFinding: "검색된 문서와 생성 모델을 결합하면 지식 집약적인 작업 성능을 높일 수 있음을 보였습니다.",
        relevance: "근거 기반 응답과 인용 동작을 평가하는 실험 계획에 유용합니다.",
        createdAt: yesterday.toISOString()
      }
    ]
  };
}

function setDefaultDate() {
  document.getElementById("logDate").value = getTodayDate();
}

function countLogsByStatus(status) {
  return researchLogs.filter((log) => log.status === status).length;
}

function showValidationMessage(element, message) {
  element.textContent = message;
  element.classList.add("visible");
}

function clearValidationMessage(element) {
  element.textContent = "";
  element.classList.remove("visible");
}

function loadFromStorage(key) {
  const storedValue = localStorage.getItem(key);
  if (!storedValue) {
    return [];
  }
  try {
    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
}

function formatDate(dateString) {
  if (!dateString) {
    return "날짜 없음";
  }

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "날짜 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(date);
}

function formatKoreanCount(count) {
  const safeCount = Number.isFinite(count) ? count : 0;
  return `${safeCount}개`;
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] || "예정";
}

function getActivityLabel(activity) {
  return ACTIVITY_LABELS[activity] || "활동";
}

function getStatusClass(status) {
  return `status-${String(status || "Planned").toLowerCase().replace(/\s+/g, "-")}`;
}

function getInputValue(id) {
  return document.getElementById(id).value.trim();
}

function getTodayDate() {
  return toDateInputValue(new Date());
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toggleMobileNavigation() {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
}

function closeMobileNavigation(event) {
  if (event.target.tagName !== "A" && event.target.tagName !== "BUTTON") {
    return;
  }

  navLinks.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "메뉴 열기");
}

function setActiveNavigation(activeHash) {
  navigationAnchors.forEach((anchor) => {
    anchor.classList.toggle("active", anchor.getAttribute("href") === activeHash);
  });
}
