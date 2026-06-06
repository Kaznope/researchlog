const STORAGE_KEYS = {
  currentUser: "researchLogCurrentUser"
};

const STATUS_OPTIONS = ["Planned", "In Progress", "Completed"];
const STATUS_LABELS = {
  Planned: "예정",
  "In Progress": "진행 중",
  Completed: "완료"
};

let currentUser = null;
let researchLogs = [];
let paperNotes = [];

const pages = document.querySelectorAll("[data-page]");
const accountForm = document.getElementById("accountForm");
const accountInput = document.getElementById("accountInput");
const accountValidationMessage = document.getElementById("accountValidationMessage");
const projectForm = document.getElementById("projectForm");
const logList = document.getElementById("logList");
const dashboardProjectList = document.getElementById("dashboardProjectList");
const projectTodoInputs = document.getElementById("projectTodoInputs");
const addProjectTodoButton = document.getElementById("addProjectTodoButton");
const logDetailContent = document.getElementById("logDetailContent");
const statusFilter = document.getElementById("statusFilter");
const logSearch = document.getElementById("logSearch");
const logValidationMessage = document.getElementById("logValidationMessage");
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
  projectForm.setAttribute("novalidate", "");
  setDefaultDate();
  ensureProjectTodoRow();
  bindEvents();
  renderApp();
  routeToCurrentHash();
}

function bindEvents() {
  accountForm.addEventListener("submit", handleAccountSubmit);
  projectForm.addEventListener("submit", handleProjectSubmit);
  addProjectTodoButton.addEventListener("click", () => addTodoInput(projectTodoInputs));
  statusFilter.addEventListener("change", renderHistory);
  logSearch.addEventListener("input", renderHistory);
  loadSampleDataButton.addEventListener("click", loadSampleData);
  clearAllDataButton.addEventListener("click", clearAllData);
  logoutButton.addEventListener("click", logout);
  navToggle.addEventListener("click", toggleMobileNavigation);
  navLinks.addEventListener("click", closeMobileNavigation);
  focusResearchButtons.forEach((button) => button.addEventListener("click", () => focusDashboardEditor("summary")));
  focusTodoButtons.forEach((button) => button.addEventListener("click", () => focusDashboardEditor("todo")));
  focusPaperButtons.forEach((button) => button.addEventListener("click", () => focusDashboardEditor("paper")));
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

function handleProjectSubmit(event) {
  event.preventDefault();
  clearValidationMessage(logValidationMessage);

  const newProject = {
    id: createId(),
    date: getInputValue("logDate"),
    projectName: getInputValue("projectName"),
    status: "In Progress",
    summary: getInputValue("summary"),
    todos: collectTodoInputs(projectTodoInputs),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const validationError = validateProject(newProject);
  if (validationError) {
    showValidationMessage(logValidationMessage, validationError);
    return;
  }

  researchLogs.unshift(newProject);
  saveUserData();
  projectForm.reset();
  projectTodoInputs.innerHTML = "";
  ensureProjectTodoRow();
  setDefaultDate();
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

function renderApp() {
  renderNavigationState();
  migrateProjectShape();
  renderDashboard();
  renderHistory();
}

function renderNavigationState() {
  document.querySelectorAll("[data-auth-link]").forEach((link) => {
    link.hidden = !currentUser;
  });
  document.querySelectorAll("[data-public-link]").forEach((link) => {
    link.hidden = Boolean(currentUser);
  });
  logoutButton.hidden = !currentUser;
  document.getElementById("dashboardUserName").textContent = currentUser ? currentUser.name : "내";
}

function renderDashboard() {
  const total = researchLogs.length;
  const completed = countProjectsByStatus("Completed");
  const inProgress = countProjectsByStatus("In Progress");
  const planned = countProjectsByStatus("Planned");
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("totalLogs").textContent = total;
  document.getElementById("completedLogs").textContent = completed;
  document.getElementById("inProgressLogs").textContent = inProgress;
  document.getElementById("plannedLogs").textContent = planned;
  document.getElementById("paperCountStat").textContent = paperNotes.length;
  document.getElementById("progressText").textContent = `${completionRate}%`;
  document.getElementById("progressFill").style.width = `${completionRate}%`;

  renderDashboardProjectList();
}

function renderDashboardProjectList() {
  dashboardProjectList.innerHTML = "";

  if (researchLogs.length === 0) {
    dashboardProjectList.innerHTML = '<p class="empty-state">아직 프로젝트가 없습니다. 새 프로젝트를 먼저 만들어 주세요.</p>';
    return;
  }

  getSortedProjects().forEach((project) => {
    dashboardProjectList.appendChild(createDashboardSummaryCard(project));
  });
}

function createDashboardSummaryCard(project) {
  const card = document.createElement("article");
  card.className = "entry-card dashboard-summary-card";
  const nextTodo = (project.todos || []).find((todo) => todo.text || todo.dueDate);
  card.innerHTML = `
    <div class="entry-header">
      <div>
        <h3>${escapeHtml(project.projectName || "제목 없는 프로젝트")}</h3>
        <div class="entry-meta">
          <span class="tag">${formatDate(project.date)}</span>
          <span class="tag ${getStatusClass(project.status)}">${escapeHtml(getStatusLabel(project.status))}</span>
          <span class="tag teal">논문 ${getRelatedPapers(project.projectName).length}개</span>
        </div>
      </div>
      <a class="button secondary small-button" href="#log-${escapeHtml(project.id)}">상세 보기</a>
    </div>
    <p><strong>연구 과정:</strong> ${escapeHtml(truncateText(project.summary || "등록된 연구 과정이 없습니다.", 150))}</p>
    <p><strong>다음 할 일:</strong> ${nextTodo ? `${escapeHtml(nextTodo.text || "할 일 미입력")} ${nextTodo.dueDate ? `(${formatDate(nextTodo.dueDate)})` : ""}` : "등록된 할 일이 없습니다."}</p>
  `;
  card.addEventListener("click", (event) => {
    if (event.target.closest("a, button, input, select, textarea")) {
      return;
    }
    window.location.hash = `#log-${project.id}`;
  });
  return card;
}

function renderHistory() {
  const filteredProjects = getFilteredProjects();
  logList.innerHTML = "";

  if (researchLogs.length === 0) {
    logList.innerHTML = '<p class="empty-state">아직 과거 연구 기록이 없습니다.</p>';
    return;
  }

  if (filteredProjects.length === 0) {
    logList.innerHTML = '<p class="empty-state">조건에 맞는 프로젝트가 없습니다.</p>';
    return;
  }

  filteredProjects.forEach((project) => {
    logList.appendChild(createProjectSummaryCard(project));
  });
}

function createProjectSummaryCard(project) {
  const card = document.createElement("article");
  card.className = "entry-card";
  card.innerHTML = `
    <div class="entry-header">
      <h3>${escapeHtml(project.projectName || "제목 없는 프로젝트")}</h3>
      <span class="tag ${getStatusClass(project.status)}">${escapeHtml(getStatusLabel(project.status))}</span>
    </div>
    <div class="entry-meta">
      <span class="tag">${formatDate(project.date)}</span>
      <span class="tag teal">논문 ${getRelatedPapers(project.projectName).length}개</span>
    </div>
    <p><strong>연구 과정:</strong> ${escapeHtml(project.summary || "등록된 연구 과정이 없습니다.")}</p>
    ${renderTodoSummary(project.todos)}
    <div class="card-actions">
      <a class="button secondary small-button" href="#log-${escapeHtml(project.id)}">상세 보기</a>
    </div>
  `;
  return card;
}

function renderLogDetail(projectId) {
  const project = researchLogs.find((item) => item.id === projectId);
  const detailTitle = document.getElementById("detailTitle");

  if (!project) {
    detailTitle.textContent = "연구 기록을 찾을 수 없습니다";
    logDetailContent.innerHTML = '<p class="empty-state">삭제되었거나 존재하지 않는 프로젝트입니다.</p>';
    return;
  }

  detailTitle.textContent = project.projectName || "제목 없는 프로젝트";
  logDetailContent.innerHTML = `
    <div class="detail-meta">
      <span class="tag">${formatDate(project.date)}</span>
      <span class="tag ${getStatusClass(project.status)}">${escapeHtml(getStatusLabel(project.status))}</span>
    </div>
    <section>
      <h3>연구 과정</h3>
      <p>${escapeHtml(project.summary || "등록된 연구 과정이 없습니다.")}</p>
    </section>
    <section>
      <h3>다음 할 일</h3>
      ${renderTodoList(project.todos)}
    </section>
    <section>
      <h3>관련 논문</h3>
      ${renderRelatedPapersMarkup(project.projectName)}
    </section>
    <div class="detail-actions">
      <button class="button primary" id="editProjectButton" type="button">수정하기</button>
    </div>
  `;
  document.getElementById("editProjectButton").addEventListener("click", () => renderProjectEditMode(project.id));
}

function renderProjectEditMode(projectId) {
  const project = researchLogs.find((item) => item.id === projectId);
  if (!project) {
    return;
  }

  logDetailContent.innerHTML = `
    <div class="detail-meta">
      <span class="tag">${formatDate(project.date)}</span>
      <span class="tag ${getStatusClass(project.status)}">${escapeHtml(getStatusLabel(project.status))}</span>
    </div>

    <label>
      연구 과정
      <textarea data-edit-summary rows="7">${escapeHtml(project.summary || "")}</textarea>
    </label>

    <div class="form-row two-columns">
      <label>
        상태
        <select data-edit-status>
          ${STATUS_OPTIONS.map((status) => `<option value="${status}" ${status === project.status ? "selected" : ""}>${getStatusLabel(status)}</option>`).join("")}
        </select>
      </label>
    </div>

    <div class="todo-editor-block">
      <div class="list-heading">
        <h3>다음 할 일</h3>
        <button class="button secondary small-button" type="button" data-add-todo>할 일 추가</button>
      </div>
      <div class="todo-input-list" data-edit-todos></div>
    </div>

    <div class="paper-editor-block">
      <div class="list-heading">
        <h3>관련 논문</h3>
        <button class="button secondary small-button" type="button" data-toggle-paper>논문 작성</button>
      </div>
      <div data-paper-list>${renderRelatedPapersMarkup(project.projectName)}</div>
      <div class="inline-paper-form" data-paper-form hidden>
        <label>
          논문 제목
          <input data-paper-title type="text" placeholder="논문 제목">
        </label>
        <label>
          저자
          <input data-paper-authors type="text" placeholder="저자명">
        </label>
        <label>
          내용 정리
          <textarea data-paper-finding rows="4" placeholder="논문 핵심 내용"></textarea>
        </label>
        <label>
          연구 관련성
          <textarea data-paper-relevance rows="3" placeholder="내 연구와의 관련성"></textarea>
        </label>
        <button class="button primary small-button" type="button" data-save-paper>논문 노트 저장</button>
      </div>
    </div>

    <div class="detail-actions">
      <button class="button primary" type="button" data-save-project>수정 저장</button>
      <button class="button secondary" type="button" data-cancel-edit>취소</button>
      <button class="delete-button" type="button" data-delete-project>프로젝트 삭제</button>
    </div>
  `;

  const todoContainer = logDetailContent.querySelector("[data-edit-todos]");
  renderTodoInputs(todoContainer, project.todos || []);

  logDetailContent.querySelector("[data-add-todo]").addEventListener("click", () => addTodoInput(todoContainer));
  logDetailContent.querySelector("[data-save-project]").addEventListener("click", () => {
    saveProjectEdits(project.id, logDetailContent);
    renderLogDetail(project.id);
  });
  logDetailContent.querySelector("[data-cancel-edit]").addEventListener("click", () => renderLogDetail(project.id));
  logDetailContent.querySelector("[data-delete-project]").addEventListener("click", () => {
    deleteProject(project.id);
    window.location.hash = "#dashboard";
  });
  logDetailContent.querySelector("[data-toggle-paper]").addEventListener("click", () => {
    const form = logDetailContent.querySelector("[data-paper-form]");
    form.hidden = !form.hidden;
  });
  logDetailContent.querySelector("[data-save-paper]").addEventListener("click", () => {
    savePaperFromCard(project.projectName, logDetailContent);
    renderProjectEditMode(project.id);
  });
}

function saveProjectEdits(projectId, card) {
  const project = researchLogs.find((item) => item.id === projectId);
  if (!project) {
    return;
  }

  project.summary = card.querySelector("[data-edit-summary]").value.trim();
  project.status = card.querySelector("[data-edit-status]").value;
  project.todos = collectTodoInputs(card.querySelector("[data-edit-todos]"));
  project.updatedAt = new Date().toISOString();
  saveUserData();
  renderApp();
}

function savePaperFromCard(projectName, card) {
  const title = card.querySelector("[data-paper-title]").value.trim();
  const authors = card.querySelector("[data-paper-authors]").value.trim();
  const keyFinding = card.querySelector("[data-paper-finding]").value.trim();
  const relevance = card.querySelector("[data-paper-relevance]").value.trim();

  if (!title || !keyFinding) {
    alert("논문 제목과 내용 정리를 입력해 주세요.");
    return;
  }

  paperNotes.unshift({
    id: createId(),
    projectName,
    title,
    authors,
    keyFinding,
    relevance,
    createdAt: new Date().toISOString()
  });

  saveUserData();
  renderApp();
}

function deleteProject(projectId) {
  const project = researchLogs.find((item) => item.id === projectId);
  if (!project || !confirm("이 프로젝트를 삭제할까요? 연결된 논문 노트는 유지됩니다.")) {
    return;
  }
  researchLogs = researchLogs.filter((item) => item.id !== projectId);
  saveUserData();
  renderApp();
}

function renderTodoInputs(container, todos) {
  container.innerHTML = "";
  if (!todos || todos.length === 0) {
    addTodoInput(container);
    return;
  }
  todos.forEach((todo) => addTodoInput(container, todo));
}

function addTodoInput(container, todo = {}) {
  const row = document.createElement("div");
  row.className = "todo-input-row";
  row.innerHTML = `
    <input type="text" data-todo-text placeholder="해야 할 일" value="${escapeHtml(todo.text || "")}">
    <input type="date" data-todo-due value="${escapeHtml(todo.dueDate || "")}" aria-label="Due date">
    <button class="delete-button" type="button">삭제</button>
  `;
  row.querySelector(".delete-button").addEventListener("click", () => row.remove());
  container.appendChild(row);
}

function ensureProjectTodoRow() {
  if (projectTodoInputs.children.length === 0) {
    addTodoInput(projectTodoInputs);
  }
}

function collectTodoInputs(container) {
  return [...container.querySelectorAll(".todo-input-row")]
    .map((row) => ({
      text: row.querySelector("[data-todo-text]").value.trim(),
      dueDate: row.querySelector("[data-todo-due]").value
    }))
    .filter((todo) => todo.text || todo.dueDate);
}

function renderTodoSummary(todos = []) {
  const activeTodos = todos.filter((todo) => todo.text || todo.dueDate);
  if (activeTodos.length === 0) {
    return '<p><strong>다음 할 일:</strong> 등록된 할 일이 없습니다.</p>';
  }
  return `
    <div class="todo-summary">
      <strong>다음 할 일</strong>
      ${activeTodos.slice(0, 3).map((todo) => `
        <span>${escapeHtml(todo.text || "할 일 미입력")} ${todo.dueDate ? `<em>${formatDate(todo.dueDate)}</em>` : ""}</span>
      `).join("")}
    </div>
  `;
}

function renderTodoList(todos = []) {
  const activeTodos = todos.filter((todo) => todo.text || todo.dueDate);
  if (activeTodos.length === 0) {
    return '<p class="empty-state compact-empty">등록된 다음 할 일이 없습니다.</p>';
  }
  return `
    <div class="todo-list">
      ${activeTodos.map((todo) => `
        <div class="todo-item">
          <span>${escapeHtml(todo.text || "할 일 미입력")}</span>
          <strong>${todo.dueDate ? formatDate(todo.dueDate) : "Due date 없음"}</strong>
        </div>
      `).join("")}
    </div>
  `;
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

function getFilteredProjects() {
  const selectedStatus = statusFilter.value;
  const searchTerm = logSearch.value.trim().toLowerCase();

  return getSortedProjects().filter((project) => {
    const statusMatches = selectedStatus === "All" || project.status === selectedStatus;
    const searchableText = [
      project.projectName,
      project.summary,
      ...(project.todos || []).map((todo) => `${todo.text} ${todo.dueDate}`)
    ].join(" ").toLowerCase();

    return statusMatches && (searchTerm === "" || searchableText.includes(searchTerm));
  });
}

function getSortedProjects() {
  return [...researchLogs].sort((first, second) => getProjectTimestamp(second) - getProjectTimestamp(first));
}

function getProjectTimestamp(project) {
  const updatedTime = Date.parse(project.updatedAt || "");
  const dateTime = Date.parse(`${project.date || ""}T00:00:00`);
  const createdTime = Date.parse(project.createdAt || "");
  return updatedTime || (Number.isNaN(dateTime) ? createdTime || 0 : dateTime);
}

function getRelatedPapers(projectName) {
  return paperNotes.filter((paper) => normalizeProjectName(paper.projectName) === normalizeProjectName(projectName));
}

function normalizeProjectName(value) {
  return String(value || "").trim().toLowerCase();
}

function focusDashboardEditor(target) {
  if (window.location.hash !== "#dashboard") {
    window.location.hash = "#dashboard";
  }
  window.setTimeout(() => {
    const firstCard = dashboardProjectList.querySelector(".dashboard-summary-card");
    if (!firstCard) {
      window.location.hash = "#log-new";
      return;
    }
    const detailLink = firstCard.querySelector("a[href^='#log-']");
    detailLink?.click();
    window.setTimeout(() => {
      document.getElementById("editProjectButton")?.click();
      const selector = target === "todo" ? "[data-todo-text]" : target === "paper" ? "[data-toggle-paper]" : "[data-edit-summary]";
      const element = logDetailContent.querySelector(selector);
      if (target === "paper") {
        element?.click();
      }
      element?.focus();
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, 80);
}

function truncateText(text, maxLength) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
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
  migrateProjectShape();
}

function saveUserData() {
  if (!currentUser) {
    return;
  }
  localStorage.setItem(getUserStorageKey("logs"), JSON.stringify(researchLogs));
  localStorage.setItem(getUserStorageKey("papers"), JSON.stringify(paperNotes));
}

function migrateProjectShape() {
  researchLogs = researchLogs.map((project) => ({
    ...project,
    status: project.status || "In Progress",
    todos: Array.isArray(project.todos)
      ? project.todos
      : project.nextAction
        ? [{ text: project.nextAction, dueDate: "" }]
        : []
  }));
}

function getUserStorageKey(type) {
  return `researchLog:${currentUser.id}:${type}`;
}

function validateProject(project) {
  if (!project.date) {
    return "시작일을 선택해 주세요.";
  }
  if (!project.projectName) {
    return "프로젝트명을 입력해 주세요.";
  }
  if (!project.summary) {
    return "진행 중인 연구 내용을 입력해 주세요.";
  }
  return "";
}

function createSampleData() {
  const today = new Date();
  const threeDaysAgo = addDays(today, -3);
  const lastWeek = addDays(today, -8);
  const ragProject = "검색 증강 생성 평가 연구";
  const bioProject = "단백질 접힘 예측 실험";

  return {
    logs: [
      {
        id: createId(),
        date: toDateInputValue(threeDaysAgo),
        projectName: ragProject,
        status: "In Progress",
        summary: "검색 증강 생성 모델의 답변 품질을 평가하는 연구입니다. 동일한 질문 120개에 대해 기본 생성 모델과 검색 결합 모델을 비교했고, 근거 포함 여부, 인용 문장 정확도, 환각 문장 수를 지표로 정리하고 있습니다. 현재 top-k 3 설정이 가장 안정적이며, 검색 문서 길이가 너무 길 때 잘못된 인용이 증가하는 패턴을 확인했습니다.",
        todos: [
          { text: "검색 점수 임계값을 적용한 실험 다시 실행", dueDate: toDateInputValue(addDays(today, 2)) },
          { text: "실패 사례 5개를 보고서 표로 정리", dueDate: toDateInputValue(addDays(today, 4)) },
          { text: "최종 평가 지표 정의 문단 작성", dueDate: toDateInputValue(addDays(today, 6)) }
        ],
        createdAt: threeDaysAgo.toISOString(),
        updatedAt: today.toISOString()
      },
      {
        id: createId(),
        date: toDateInputValue(lastWeek),
        projectName: bioProject,
        status: "Planned",
        summary: "단백질 접힘 예측 모델의 베이스라인을 검증하는 연구입니다. 초기 학습에서는 18 에폭 이후 검증 손실이 흔들렸고, 긴 서열에서 예측 오차가 크게 증가했습니다. 전체 평균 성능만 보면 짧은 서열에 편향될 수 있어서 서열 길이별 성능을 따로 분석하려고 합니다.",
        todos: [
          { text: "서열 길이를 3개 구간으로 나누어 성능 재계산", dueDate: toDateInputValue(addDays(today, 3)) },
          { text: "positional encoding 설정 변경 실험 준비", dueDate: toDateInputValue(addDays(today, 7)) }
        ],
        createdAt: lastWeek.toISOString(),
        updatedAt: lastWeek.toISOString()
      }
    ],
    papers: [
      {
        id: createId(),
        projectName: ragProject,
        title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
        authors: "Patrick Lewis 외",
        keyFinding: "검색된 문서와 생성 모델을 결합하면 지식이 많이 필요한 질의응답에서 정확도가 개선됩니다.",
        relevance: "답변 정확도뿐 아니라 검색 문서가 실제 답변의 근거로 쓰였는지를 평가해야 한다는 방향을 잡는 데 사용했습니다.",
        createdAt: threeDaysAgo.toISOString()
      },
      {
        id: createId(),
        projectName: ragProject,
        title: "Self-RAG: Learning to Retrieve, Generate, and Critique",
        authors: "Akari Asai 외",
        keyFinding: "모델이 언제 검색해야 하는지, 생성 결과를 어떻게 비판적으로 점검할지 학습하는 방식입니다.",
        relevance: "검색이 오히려 답변을 흐리는 실패 사례를 설명하는 참고 논문으로 연결했습니다.",
        createdAt: today.toISOString()
      },
      {
        id: createId(),
        projectName: bioProject,
        title: "Highly Accurate Protein Structure Prediction with AlphaFold",
        authors: "John Jumper 외",
        keyFinding: "진화 정보와 딥러닝 구조 모듈을 결합해 단백질 구조 예측 정확도를 크게 높였습니다.",
        relevance: "전체 평균 성능만 보지 않고 서열 길이별 성능을 따로 봐야 한다는 근거로 사용했습니다.",
        createdAt: lastWeek.toISOString()
      }
    ]
  };
}

function setDefaultDate() {
  document.getElementById("logDate").value = getTodayDate();
}

function countProjectsByStatus(status) {
  return researchLogs.filter((project) => project.status === status).length;
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

function getStatusLabel(status) {
  return STATUS_LABELS[status] || "예정";
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

function normalizeAccountId(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9가-힣_-]+/g, "-").replace(/^-+|-+$/g, "") || createId();
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
