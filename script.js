const STORAGE_KEYS = {
  currentUser: "researchLogCurrentUser"
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
const focusResearchButtons = document.querySelectorAll("[data-focus-target='research']");
const focusTodoButtons = document.querySelectorAll("[data-focus-target='todo']");
const focusPaperButtons = document.querySelectorAll("[data-focus-target='paper']");

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  currentUser = loadCurrentUser();
  if (currentUser) {
    loadUserData();
  }

  accountForm.setAttribute("novalidate", "");
  logForm.setAttribute("novalidate", "");
  paperForm.setAttribute("novalidate", "");
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
  focusResearchButtons.forEach((button) => button.addEventListener("click", () => openEditorAndFocus("summary")));
  focusTodoButtons.forEach((button) => button.addEventListener("click", () => openEditorAndFocus("nextAction")));
  focusPaperButtons.forEach((button) => button.addEventListener("click", () => openEditorAndFocus("paperProjectName")));
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
  document.getElementById("paperProjectName").value = newLog.projectName;
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
    projectName: getInputValue("paperProjectName"),
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
}

function routeToCurrentHash() {
  const hash = window.location.hash || "#home";

  if (!currentUser && hash !== "#home") {
    showPage("home");
    setActiveNavigation("#home");
    return;
  }

  const route = hash.replace("#", "") || "home";
  const allowedRoutes = ["home", "dashboard", "history", "log-new"];

  if (allowedRoutes.includes(route)) {
    showPage(route);
    setActiveNavigation(`#${route}`);
    return;
  }

  if (hash.startsWith("#log-")) {
    const logId = hash.replace("#log-", "");
    renderLogDetail(logId);
    showPage("log-detail");
    setActiveNavigation("#history");
    return;
  }

  showPage("dashboard");
  setActiveNavigation("#dashboard");
}

function showPage(pageName) {
  pages.forEach((page) => {
    page.classList.toggle("active-page", page.dataset.page === pageName);
  });
  window.scrollTo({ top: 0, behavior: "auto" });
}

function openEditorAndFocus(inputId) {
  if (window.location.hash !== "#log-new") {
    window.location.hash = "#log-new";
  }

  window.setTimeout(() => {
    const target = document.getElementById(inputId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 80);
}

function renderApp() {
  renderNavigationState();
  renderProjectOptions();
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

function renderProjectOptions() {
  const datalist = document.getElementById("projectNameOptions");
  const projectNames = getProjectNames();
  datalist.innerHTML = projectNames.map((name) => `<option value="${escapeHtml(name)}"></option>`).join("");
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
  document.getElementById("paperCountStat").textContent = paperNotes.length;
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
    pastLogPreview.appendChild(createLogCard(log));
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
    logList.appendChild(createLogCard(log, { detailed: true }));
  });
}

function createLogCard(log, options = {}) {
  const relatedCount = getRelatedPapers(log.projectName).length;
  const card = document.createElement("article");
  card.className = "entry-card";
  card.innerHTML = `
    <div class="entry-header">
      <h3>${escapeHtml(log.projectName || "제목 없는 프로젝트")}</h3>
      <span class="tag ${getStatusClass(log.status)}">${escapeHtml(getStatusLabel(log.status))}</span>
    </div>
    <div class="entry-meta">
      <span class="tag">${formatDate(log.date)}</span>
      <span class="tag teal">${escapeHtml(getActivityLabel(log.activityType))}</span>
    </div>
    <p><strong>진행 내용:</strong> ${escapeHtml(log.summary || "등록된 진행 내용이 없습니다.")}</p>
    ${options.detailed ? `<p><strong>다음 정리:</strong> ${escapeHtml(log.nextAction || "등록된 다음 할 일이 없습니다.")}</p>` : ""}
    <div class="card-actions">
      <a class="button secondary small-button" href="#log-${escapeHtml(log.id)}">상세 보기</a>
      <button class="button ghost small-button" type="button" data-related-project="${escapeHtml(log.projectName)}">관련 논문 ${relatedCount}개</button>
    </div>
    <div class="related-paper-box" hidden></div>
  `;

  card.querySelector("[data-related-project]").addEventListener("click", () => {
    toggleRelatedPapers(card, log.projectName);
  });
  return card;
}

function toggleRelatedPapers(card, projectName) {
  const box = card.querySelector(".related-paper-box");
  const isOpen = !box.hidden;
  box.hidden = isOpen;
  if (isOpen) {
    return;
  }
  box.innerHTML = renderRelatedPapersMarkup(projectName);
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
      <p>${escapeHtml(log.summary || "등록된 진행 내용이 없습니다.")}</p>
    </section>
    <section>
      <h3>다음 할 일 또는 완료 정리</h3>
      <p>${escapeHtml(log.nextAction || "등록된 다음 할 일이 없습니다.")}</p>
    </section>
    <section>
      <h3>관련 논문</h3>
      ${renderRelatedPapersMarkup(log.projectName)}
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

function renderRelatedPapersMarkup(projectName) {
  const relatedPapers = getRelatedPapers(projectName);
  if (relatedPapers.length === 0) {
    return '<p class="empty-state compact-empty">이 프로젝트에 연결된 논문 노트가 없습니다.</p>';
  }

  return `
    <div class="related-paper-list">
      ${relatedPapers.map((paper) => `
        <article class="paper-mini-card">
          <h4>${escapeHtml(paper.title || "제목 없는 논문")}</h4>
          <p class="paper-authors">${escapeHtml(paper.authors || "저자 미기재")}</p>
          <p><strong>내용 정리:</strong> ${escapeHtml(paper.keyFinding || "")}</p>
          <p><strong>연구 관련성:</strong> ${escapeHtml(paper.relevance || "등록된 관련성 메모가 없습니다.")}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function renderPaperPreview() {
  paperPreviewList.innerHTML = "";
  document.getElementById("paperCount").textContent = formatKoreanCount(paperNotes.length);

  if (paperNotes.length === 0) {
    paperPreviewList.innerHTML = '<p class="empty-state">아직 논문 노트가 없습니다. 연구 기록 추가 페이지에서 논문 노트를 연결해 보세요.</p>';
    return;
  }

  getProjectNames().forEach((projectName) => {
    const papers = getRelatedPapers(projectName);
    if (papers.length === 0) {
      return;
    }

    const card = document.createElement("article");
    card.className = "entry-card";
    card.innerHTML = `
      <div class="entry-header">
        <h3>${escapeHtml(projectName)}</h3>
        <span class="tag teal">${papers.length}개 논문</span>
      </div>
      ${renderRelatedPapersMarkup(projectName)}
    `;
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

function getProjectNames() {
  return [...new Set([
    ...researchLogs.map((log) => log.projectName).filter(Boolean),
    ...paperNotes.map((paper) => paper.projectName).filter(Boolean)
  ])].sort((a, b) => a.localeCompare(b, "ko"));
}

function getRelatedPapers(projectName) {
  return paperNotes.filter((paper) => normalizeProjectName(paper.projectName) === normalizeProjectName(projectName));
}

function normalizeProjectName(value) {
  return String(value || "").trim().toLowerCase();
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

function loadSampleData() {
  const hasExistingData = researchLogs.length > 0 || paperNotes.length > 0;
  if (hasExistingData && !confirm("상세 샘플 데이터가 현재 계정 데이터에 추가됩니다. 계속할까요?")) {
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
    return "저장하기 전에 진행 내용을 입력해 주세요.";
  }
  return "";
}

function validatePaperNote(note) {
  if (!note.projectName) {
    return "논문을 연결할 프로젝트명을 입력해 주세요.";
  }
  if (!note.title) {
    return "논문 제목을 입력해 주세요.";
  }
  if (!note.keyFinding) {
    return "저장하기 전에 논문 내용 정리를 입력해 주세요.";
  }
  return "";
}

function createSampleData() {
  const today = new Date();
  const yesterday = addDays(today, -1);
  const threeDaysAgo = addDays(today, -3);
  const fiveDaysAgo = addDays(today, -5);
  const lastWeek = addDays(today, -8);

  const ragProject = "검색 증강 생성 평가 연구";
  const bioProject = "단백질 접힘 예측 실험";

  return {
    logs: [
      {
        id: createId(),
        date: toDateInputValue(today),
        projectName: ragProject,
        activityType: "Writing",
        status: "Completed",
        summary: "검색 증강 생성 모델의 평가 결과를 정리했습니다. 동일한 질문 120개에 대해 기본 생성 모델과 검색 결합 모델을 비교했고, 답변의 근거 포함 여부, 인용 문장 정확도, 불필요한 환각 문장 수를 표로 정리했습니다. 검색 결합 모델은 근거 포함률이 62%에서 88%로 높아졌고, 잘못된 인용은 주로 검색 문서가 너무 길 때 발생한다는 패턴을 확인했습니다.",
        nextAction: "완료 정리: 검색 문서 길이를 800자 내외로 제한하고 상위 3개 문단만 넣는 설정이 가장 안정적이었습니다. 최종 보고서에는 평가 지표 정의, 실패 사례 5개, 추천 파이프라인 구조를 포함합니다.",
        createdAt: today.toISOString()
      },
      {
        id: createId(),
        date: toDateInputValue(yesterday),
        projectName: ragProject,
        activityType: "Experiment",
        status: "Completed",
        summary: "문서 검색 top-k 값을 1, 3, 5로 바꾸며 실험했습니다. top-k 1은 답변이 간결하지만 근거 누락이 많았고, top-k 5는 정보량은 늘었지만 서로 충돌하는 문장이 함께 들어와 답변 품질이 흔들렸습니다. top-k 3에서 정확도와 응답 길이의 균형이 가장 좋았습니다.",
        nextAction: "다음에는 검색 점수 임계값을 추가해 낮은 관련도의 문단을 제거하고, 인용 문장 생성 프롬프트를 더 엄격하게 조정합니다.",
        createdAt: yesterday.toISOString()
      },
      {
        id: createId(),
        date: toDateInputValue(threeDaysAgo),
        projectName: ragProject,
        activityType: "Paper Reading",
        status: "Completed",
        summary: "검색 증강 생성 관련 선행연구 3편을 읽고 평가 방식의 차이를 비교했습니다. 일부 논문은 정답 정확도만 평가했지만, 실제 연구 기록 도구에서는 답변이 어떤 문헌에 근거하는지도 중요하므로 인용 정확도와 근거 문장 일치율을 별도 지표로 두기로 했습니다.",
        nextAction: "논문별 평가 지표를 표로 정리하고, 내 실험에서 재현 가능한 지표와 어려운 지표를 구분합니다.",
        createdAt: threeDaysAgo.toISOString()
      },
      {
        id: createId(),
        date: toDateInputValue(fiveDaysAgo),
        projectName: bioProject,
        activityType: "Experiment",
        status: "In Progress",
        summary: "단백질 접힘 예측 모델의 베이스라인 학습을 실행했습니다. 초기 설정에서는 18 에폭 이후 검증 손실이 흔들렸고, 긴 서열에서 예측 오차가 크게 증가했습니다. 학습률을 절반으로 낮추고 배치 크기를 줄이자 손실 곡선은 안정화되었지만 학습 시간이 약 1.7배 늘었습니다.",
        nextAction: "서열 길이별 성능을 분리해 확인하고, 긴 서열에 대해서는 데이터 증강보다 positional encoding 설정 변경이 더 효과적인지 비교합니다.",
        createdAt: fiveDaysAgo.toISOString()
      },
      {
        id: createId(),
        date: toDateInputValue(lastWeek),
        projectName: bioProject,
        activityType: "Meeting",
        status: "Planned",
        summary: "연구실 회의에서 실험 설계를 검토했습니다. 현재 데이터셋은 짧은 서열이 많아 전체 정확도만 보면 모델이 좋아 보일 수 있다는 지적을 받았습니다. 따라서 길이 구간별 MAE와 구조적 유사도 지표를 함께 보고하기로 했습니다.",
        nextAction: "다음 회의 전까지 서열 길이 기준을 3개 구간으로 나누고, 각 구간의 데이터 수와 성능을 요약합니다.",
        createdAt: lastWeek.toISOString()
      }
    ],
    papers: [
      {
        id: createId(),
        projectName: ragProject,
        title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
        authors: "Patrick Lewis 외",
        keyFinding: "검색된 문서와 생성 모델을 결합하면 지식이 많이 필요한 질의응답에서 정확도가 개선됩니다. 특히 모델 내부 지식만 사용하는 방식보다 최신 문서나 외부 근거를 반영하기 쉽다는 점이 중요했습니다.",
        relevance: "내 프로젝트에서는 답변 정확도뿐 아니라 검색 문서가 실제 답변의 근거로 쓰였는지를 평가해야 한다는 방향을 잡는 데 도움이 되었습니다.",
        createdAt: threeDaysAgo.toISOString()
      },
      {
        id: createId(),
        projectName: ragProject,
        title: "REALM: Retrieval-Augmented Language Model Pre-Training",
        authors: "Kelvin Guu 외",
        keyFinding: "언어 모델 학습 단계부터 검색 모듈을 함께 사용하는 접근을 제안합니다. 검색 결과가 단순 부가 정보가 아니라 모델 예측 과정에 직접 영향을 준다는 점이 핵심입니다.",
        relevance: "검색 모듈을 후처리처럼 붙이는 방식과 학습 과정에 통합하는 방식의 차이를 이해하는 데 사용했습니다.",
        createdAt: yesterday.toISOString()
      },
      {
        id: createId(),
        projectName: ragProject,
        title: "Self-RAG: Learning to Retrieve, Generate, and Critique",
        authors: "Akari Asai 외",
        keyFinding: "모델이 언제 검색해야 하는지, 생성 결과를 어떻게 비판적으로 점검할지 학습하는 방식입니다. 무조건 검색하는 것이 아니라 검색 필요성을 판단한다는 점이 인상적이었습니다.",
        relevance: "실패 사례 분석에서 검색이 오히려 답변을 흐리는 경우를 설명하는 참고 논문으로 연결했습니다.",
        createdAt: today.toISOString()
      },
      {
        id: createId(),
        projectName: bioProject,
        title: "Highly Accurate Protein Structure Prediction with AlphaFold",
        authors: "John Jumper 외",
        keyFinding: "진화 정보와 딥러닝 구조 모듈을 결합해 단백질 구조 예측 정확도를 크게 높였습니다. 모델 구조뿐 아니라 평가 지표를 길이와 난이도에 따라 나누어 보는 방식이 중요했습니다.",
        relevance: "단백질 접힘 예측 실험에서 전체 평균 성능만 보지 않고 서열 길이별 성능을 따로 봐야 한다는 근거로 사용했습니다.",
        createdAt: fiveDaysAgo.toISOString()
      },
      {
        id: createId(),
        projectName: bioProject,
        title: "Improved Protein Structure Prediction Using Potentials from Deep Learning",
        authors: "Andrew Senior 외",
        keyFinding: "딥러닝 기반 거리 예측과 구조 최적화를 연결해 단백질 구조 예측을 개선했습니다. 예측값 자체보다 후속 최적화 과정이 결과 품질에 큰 영향을 줄 수 있음을 보여줍니다.",
        relevance: "현재 베이스라인 모델의 오차가 모델 출력 단계에서 생기는지, 후처리 구조 변환 단계에서 커지는지 분리해 볼 필요가 있다는 아이디어를 얻었습니다.",
        createdAt: lastWeek.toISOString()
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
