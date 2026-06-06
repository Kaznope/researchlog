const STORAGE_KEYS = {
  logs: "researchLogEntries",
  papers: "researchLogPaperNotes"
};

const STATUS_OPTIONS = ["Planned", "In Progress", "Completed"];

let researchLogs = [];
let paperNotes = [];

const logForm = document.getElementById("logForm");
const paperForm = document.getElementById("paperForm");
const logList = document.getElementById("logList");
const paperList = document.getElementById("paperList");
const recentLogList = document.getElementById("recentLogList");
const activityFilter = document.getElementById("activityFilter");
const statusFilter = document.getElementById("statusFilter");
const logSearch = document.getElementById("logSearch");
const logValidationMessage = document.getElementById("logValidationMessage");
const paperValidationMessage = document.getElementById("paperValidationMessage");
const loadSampleDataButton = document.getElementById("loadSampleData");
const clearAllDataButton = document.getElementById("clearAllData");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  researchLogs = loadFromStorage(STORAGE_KEYS.logs);
  paperNotes = loadFromStorage(STORAGE_KEYS.papers);
  logForm.setAttribute("novalidate", "");
  paperForm.setAttribute("novalidate", "");
  setDefaultDate();
  bindEvents();
  renderLogs();
  renderPaperNotes();
  updateDashboard();
}

function bindEvents() {
  logForm.addEventListener("submit", handleLogSubmit);
  paperForm.addEventListener("submit", handlePaperSubmit);
  activityFilter.addEventListener("change", renderLogs);
  statusFilter.addEventListener("change", renderLogs);
  logSearch.addEventListener("input", renderLogs);
  loadSampleDataButton.addEventListener("click", loadSampleData);
  clearAllDataButton.addEventListener("click", clearAllData);
  navToggle.addEventListener("click", toggleMobileNavigation);
  navLinks.addEventListener("click", closeMobileNavigation);
}

function setDefaultDate() {
  const dateInput = document.getElementById("logDate");
  dateInput.value = getTodayDate();
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
  saveToStorage(STORAGE_KEYS.logs, researchLogs);
  logForm.reset();
  setDefaultDate();
  renderLogs();
  updateDashboard();
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
  saveToStorage(STORAGE_KEYS.papers, paperNotes);
  paperForm.reset();
  renderPaperNotes();
  updateHeroSnapshot();
}

function renderLogs() {
  const filteredLogs = getFilteredLogs();
  logList.innerHTML = "";

  if (researchLogs.length === 0) {
    logList.innerHTML = '<p class="empty-state">No research logs yet. Add your first research activity.</p>';
    return;
  }

  if (filteredLogs.length === 0) {
    logList.innerHTML = '<p class="empty-state">No matching logs found.</p>';
    return;
  }

  filteredLogs.forEach((log) => {
    logList.appendChild(createLogCard(log));
  });
}

function renderRecentLogs() {
  recentLogList.innerHTML = "";

  if (researchLogs.length === 0) {
    recentLogList.innerHTML = '<p class="empty-state">No research logs yet. Add your first research activity.</p>';
    return;
  }

  getRecentLogs().forEach((log) => {
    recentLogList.appendChild(createLogCard(log, { compact: true }));
  });
}

function createLogCard(log, options = {}) {
  const card = document.createElement("article");
  card.className = "entry-card";

  const safeStatus = STATUS_OPTIONS.includes(log.status) ? log.status : "Planned";
  const statusOptions = STATUS_OPTIONS.map((status) => {
    const selected = status === safeStatus ? "selected" : "";
    return `<option value="${status}" ${selected}>${status}</option>`;
  }).join("");

  card.innerHTML = `
    <div class="entry-header">
      <h3>${escapeHtml(log.projectName || "Untitled project")}</h3>
      <div class="entry-actions">
        <select class="status-select" data-log-id="${escapeHtml(log.id)}" aria-label="Update status for ${escapeHtml(log.projectName || "research log")}">
          ${statusOptions}
        </select>
        <button class="delete-button" type="button" data-log-id="${escapeHtml(log.id)}">Delete</button>
      </div>
    </div>
    <div class="entry-meta">
      <span class="tag">${formatDate(log.date)}</span>
      <span class="tag teal">${escapeHtml(log.activityType || "Activity")}</span>
      <span class="tag">${escapeHtml(safeStatus)}</span>
    </div>
    <p><strong>Summary:</strong> ${escapeHtml(log.summary || "")}</p>
    ${options.compact ? "" : `<p><strong>Next Action:</strong> ${escapeHtml(log.nextAction || "No next action set.")}</p>`}
  `;

  card.querySelector(".delete-button").addEventListener("click", () => deleteLog(log.id));
  card.querySelector(".status-select").addEventListener("change", (event) => {
    updateLogStatus(log.id, event.target.value);
  });

  return card;
}

function renderPaperNotes() {
  paperList.innerHTML = "";
  document.getElementById("paperCount").textContent = formatCount(paperNotes.length, "note");

  if (paperNotes.length === 0) {
    paperList.innerHTML = '<p class="empty-state">No paper notes yet. Add your first paper note.</p>';
    return;
  }

  paperNotes.forEach((note) => {
    const card = document.createElement("article");
    card.className = "entry-card";
    card.innerHTML = `
      <div class="entry-header">
        <h3>${escapeHtml(note.title || "Untitled paper")}</h3>
        <button class="delete-button" type="button" data-paper-id="${escapeHtml(note.id)}">Delete</button>
      </div>
      <div class="entry-meta">
        <span class="tag teal">${escapeHtml(note.authors || "Authors not listed")}</span>
      </div>
      <p><strong>Key Finding:</strong> ${escapeHtml(note.keyFinding || "")}</p>
      <p><strong>Relevance:</strong> ${escapeHtml(note.relevance || "No relevance note added.")}</p>
    `;

    card.querySelector(".delete-button").addEventListener("click", () => deletePaperNote(note.id));
    paperList.appendChild(card);
  });
}

function getFilteredLogs() {
  const selectedActivity = activityFilter.value;
  const selectedStatus = statusFilter.value;
  const searchTerm = logSearch.value.trim().toLowerCase();

  return researchLogs.filter((log) => {
    const activityMatches = selectedActivity === "All" || log.activityType === selectedActivity;
    const statusMatches = selectedStatus === "All" || log.status === selectedStatus;
    const searchableText = [
      log.projectName,
      log.summary,
      log.nextAction,
      log.activityType
    ].join(" ").toLowerCase();
    const searchMatches = searchTerm === "" || searchableText.includes(searchTerm);

    return activityMatches && statusMatches && searchMatches;
  });
}

function getRecentLogs() {
  return [...researchLogs]
    .sort((first, second) => getLogTimestamp(second) - getLogTimestamp(first))
    .slice(0, 3);
}

function getLogTimestamp(log) {
  const dateTime = Date.parse(`${log.date || ""}T00:00:00`);
  const createdTime = Date.parse(log.createdAt || "");
  return Number.isNaN(dateTime) ? createdTime || 0 : dateTime;
}

function deleteLog(logId) {
  researchLogs = researchLogs.filter((log) => log.id !== logId);
  saveToStorage(STORAGE_KEYS.logs, researchLogs);
  renderLogs();
  updateDashboard();
}

function deletePaperNote(noteId) {
  paperNotes = paperNotes.filter((note) => note.id !== noteId);
  saveToStorage(STORAGE_KEYS.papers, paperNotes);
  renderPaperNotes();
  updateHeroSnapshot();
}

function updateLogStatus(logId, status) {
  if (!STATUS_OPTIONS.includes(status)) {
    return;
  }

  researchLogs = researchLogs.map((log) => {
    if (log.id !== logId) {
      return log;
    }

    return {
      ...log,
      status
    };
  });

  saveToStorage(STORAGE_KEYS.logs, researchLogs);
  renderLogs();
  updateDashboard();
}

function updateDashboard() {
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

  renderRecentLogs();
  updateHeroSnapshot();
}

function updateHeroSnapshot() {
  const today = getTodayDate();
  const todaysLogs = researchLogs.filter((log) => log.date === today).length;
  const completed = countLogsByStatus("Completed");
  const completionRate = researchLogs.length === 0 ? 0 : Math.round((completed / researchLogs.length) * 100);

  document.getElementById("heroToday").textContent = formatCount(todaysLogs, "log");
  document.getElementById("heroCompletion").textContent = `${completionRate}%`;
  document.getElementById("heroPapers").textContent = `${paperNotes.length} saved`;
}

function countLogsByStatus(status) {
  return researchLogs.filter((log) => log.status === status).length;
}

function loadSampleData() {
  const hasExistingData = researchLogs.length > 0 || paperNotes.length > 0;
  if (hasExistingData && !confirm("Sample data will be added to your existing data. Continue?")) {
    return;
  }

  const sampleData = createSampleData();
  researchLogs = [...sampleData.logs, ...researchLogs];
  paperNotes = [...sampleData.papers, ...paperNotes];
  saveToStorage(STORAGE_KEYS.logs, researchLogs);
  saveToStorage(STORAGE_KEYS.papers, paperNotes);
  clearValidationMessage(logValidationMessage);
  clearValidationMessage(paperValidationMessage);
  renderLogs();
  renderPaperNotes();
  updateDashboard();
}

function clearAllData() {
  if (!confirm("Delete all research logs and paper notes? This cannot be undone.")) {
    return;
  }

  researchLogs = [];
  paperNotes = [];
  saveToStorage(STORAGE_KEYS.logs, researchLogs);
  saveToStorage(STORAGE_KEYS.papers, paperNotes);
  clearValidationMessage(logValidationMessage);
  clearValidationMessage(paperValidationMessage);
  renderLogs();
  renderPaperNotes();
  updateDashboard();
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
        projectName: "Literature review on retrieval-augmented generation",
        activityType: "Paper Reading",
        status: "Completed",
        summary: "Reviewed evaluation methods for grounding quality and citation accuracy.",
        nextAction: "Compare the metrics against the current benchmark plan.",
        createdAt: new Date().toISOString()
      },
      {
        id: createId(),
        date: toDateInputValue(yesterday),
        projectName: "Protein folding experiment baseline",
        activityType: "Experiment",
        status: "In Progress",
        summary: "Ran the first training sweep and logged unstable validation loss after epoch 18.",
        nextAction: "Reduce the learning rate and rerun with a fixed random seed.",
        createdAt: yesterday.toISOString()
      },
      {
        id: createId(),
        date: toDateInputValue(lastWeek),
        projectName: "Lab meeting on annotation workflow",
        activityType: "Meeting",
        status: "Planned",
        summary: "Outlined open questions for inter-rater agreement and review cadence.",
        nextAction: "Prepare a short agenda and assign annotation examples.",
        createdAt: lastWeek.toISOString()
      }
    ],
    papers: [
      {
        id: createId(),
        title: "Attention Is All You Need",
        authors: "Vaswani et al.",
        keyFinding: "Self-attention can replace recurrent sequence modeling while improving parallel training.",
        relevance: "Provides background for the model architecture notes in the current literature review.",
        createdAt: new Date().toISOString()
      },
      {
        id: createId(),
        title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
        authors: "Lewis et al.",
        keyFinding: "Combining parametric generation with retrieved passages improves knowledge-heavy tasks.",
        relevance: "Useful for planning experiments around grounded responses and citation behavior.",
        createdAt: yesterday.toISOString()
      }
    ]
  };
}

function validateResearchLog(log) {
  if (!log.date) {
    return "Please choose a date for this research log.";
  }

  if (!log.projectName) {
    return "Please enter a project name.";
  }

  if (!log.activityType) {
    return "Please choose an activity type.";
  }

  if (!log.status) {
    return "Please choose a status.";
  }

  if (!log.summary) {
    return "Please add a summary before saving.";
  }

  return "";
}

function validatePaperNote(note) {
  if (!note.title) {
    return "Please enter the paper title.";
  }

  if (!note.keyFinding) {
    return "Please add the key finding before saving.";
  }

  return "";
}

function showValidationMessage(element, message) {
  element.textContent = message;
  element.classList.add("visible");
}

function clearValidationMessage(element) {
  element.textContent = "";
  element.classList.remove("visible");
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
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
    return "No date";
  }

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function formatCount(count, label) {
  const safeCount = Number.isFinite(count) ? count : 0;
  return `${safeCount} ${label}${safeCount === 1 ? "" : "s"}`;
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
}

function closeMobileNavigation(event) {
  if (event.target.tagName !== "A") {
    return;
  }

  navLinks.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
}
