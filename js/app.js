/**
 * app.js — Shared utilities, localStorage helpers, navbar/footer injection
 * Loaded on every page.
 */

// ============================================================
// Constants
// ============================================================

const STORAGE_KEY = 'cg_progress_v1';

const PAGES = [
  { label: 'Home',       href: 'index.html',       icon: 'bi-house-door' },
  { label: 'Topics',     href: 'topics.html',      icon: 'bi-journal-bookmark' },
  { label: 'Past Exams', href: 'exams.html',       icon: 'bi-file-earmark-text' },
  { label: 'Predictions',href: 'predictions.html', icon: 'bi-lightbulb' },
  { label: 'Mock Exam',  href: 'mock.html',        icon: 'bi-stopwatch' },
  { label: 'Dashboard',  href: 'dashboard.html',   icon: 'bi-graph-up-arrow' },
  { label: 'Mistakes',   href: 'mistakes.html',    icon: 'bi-exclamation-triangle' },
];

// ============================================================
// localStorage Helpers
// ============================================================

/**
 * Returns the full progress object from localStorage.
 * @returns {object}
 */
function getProgress() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    // Default initial schema
    const defaultProgress = {
      topics: {},
      exams: {},
      mock_exam: null,
      mistakes: []
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProgress));
    return defaultProgress;
  }
  return JSON.parse(data);
}

/**
 * Saves the full progress object back to localStorage.
 * @param {object} progress
 */
function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/**
 * Marks a topic as viewed and updates localStorage.
 * @param {string} topicId
 */
function markTopicViewed(topicId) {
  const progress = getProgress();
  if (!progress.topics[topicId]) {
    progress.topics[topicId] = {
      viewed: true,
      masteredConcepts: [],
      questionsCorrect: 0,
      questionsTotal: 0
    };
  } else {
    progress.topics[topicId].viewed = true;
  }
  saveProgress(progress);
}

/**
 * Records a mistake (wrong answer) for later review.
 * @param {object} mistakeData - { id, type, source, question, options, answer, explanation }
 */
function recordMistake(mistakeData) {
  const progress = getProgress();
  // Avoid duplicate mistakes
  if (!progress.mistakes.find(m => m.id === mistakeData.id)) {
    progress.mistakes.push(mistakeData);
    saveProgress(progress);
  }
}

/**
 * Clears or removes a mistake after it's solved correctly.
 * @param {string} id
 */
function removeMistake(id) {
  const progress = getProgress();
  progress.mistakes = progress.mistakes.filter(m => m.id !== id);
  saveProgress(progress);
}

/**
 * Saves an exam attempt score.
 * @param {number|string} year
 * @param {number} score
 * @param {number} total
 */
function saveExamScore(year, score, total) {
  const progress = getProgress();
  progress.exams[year] = {
    score,
    total,
    date: new Date().toLocaleDateString()
  };
  saveProgress(progress);
}

/**
 * Saves a mock exam result.
 * @param {number} score
 * @param {number} total
 */
function saveMockResult(score, total) {
  const progress = getProgress();
  progress.mock_exam = {
    score,
    total,
    date: new Date().toLocaleDateString()
  };
  saveProgress(progress);
}

/**
 * Clears all recorded mistakes.
 */
function clearMistakes() {
  const progress = getProgress();
  progress.mistakes = [];
  saveProgress(progress);
}

// ============================================================
// Data Loading
// ============================================================

/**
 * Loads a JSON data file from the /data directory.
 * @param {string} filename - e.g. 'topics.json'
 * @returns {Promise<any>}
 */
async function loadData(filename) {
  try {
    const res = await fetch(`data/${filename}`);
    if (!res.ok) {
      throw new Error(`Failed to load data/${filename}`);
    }
    return await res.json();
  } catch (err) {
    console.error(err);
    alert(`Error loading revision data: ${err.message}`);
    return null;
  }
}

// ============================================================
// URL Helpers
// ============================================================

/**
 * Reads a query parameter from the current URL.
 * @param {string} key
 * @returns {string|null}
 */
function getParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

// ============================================================
// Navbar & Footer Injection
// ============================================================

/**
 * Injects the shared navbar into #navbar.
 */
function renderNavbar() {
  const navContainer = document.getElementById('navbar');
  if (!navContainer) return;

  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  
  // Calculate total mistakes badge count
  const progress = getProgress();
  const mistakesCount = progress.mistakes ? progress.mistakes.length : 0;
  const mistakesBadge = mistakesCount > 0 
    ? `<span class="badge rounded-pill bg-danger ms-1 animate__animated animate__pulse animate__infinite">${mistakesCount}</span>` 
    : '';

  let navLinksHTML = '';
  for (const page of PAGES) {
    const isActive = (currentFile === page.href || (page.href === 'index.html' && currentFile === '')) ? 'active' : '';
    const label = page.label === 'Mistakes' ? `${page.label} ${mistakesBadge}` : page.label;
    navLinksHTML += `
      <li class="nav-item">
        <a class="nav-link nav-link-custom ${isActive}" href="${page.href}">
          <i class="bi ${page.icon}"></i> ${label}
        </a>
      </li>
    `;
  }

  navContainer.className = 'navbar navbar-expand-lg navbar-dark navbar-custom sticky-top';
  navContainer.innerHTML = `
    <div class="container">
      <a class="navbar-brand navbar-brand-custom" href="index.html" style="color: #ffffff !important; -webkit-text-fill-color: #ffffff !important;">
        <i class="bi bi-cpu-fill" style="color: #00f2fe;"></i> GFX Revision
      </a>
      <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav ms-auto gap-1">
          ${navLinksHTML}
        </ul>
      </div>
    </div>
  `;
}

/**
 * Injects the shared footer into #footer.
 */
function renderFooter() {
  const footerContainer = document.getElementById('footer');
  if (!footerContainer) return;

  footerContainer.innerHTML = `
    <div class="container text-center">
      <p class="mb-1">Computer Graphics Revision Hub &copy; ${new Date().getFullYear()}</p>
      <p class="text-muted mb-0 small">Designed for final exam preparation. Solve past papers, practice predictions, and master core formulas.</p>
    </div>
  `;
}

// ============================================================
// Init (runs on every page)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Initialize progress schema in localStorage if missing
  getProgress();
  renderNavbar();
  renderFooter();
});
