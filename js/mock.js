/**
 * mock.js — Mock Exam Simulation & Self Grading Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Load mock exam data
  const mockData = await loadData('mock_exam.json');
  if (!mockData) return;

  const questions = mockData.questions;
  const totalQuestions = questions.length;
  
  // Simulation State
  let currentIndex = 0;
  const userDrafts = {}; // { index: text_draft }
  let timeLeft = 1200; // 20 minutes in seconds
  let timerInterval = null;
  const selfGrades = {}; // { index: true/false } (correct/incorrect)

  // DOM Views
  const setupView = document.getElementById('setup-view');
  const examView = document.getElementById('exam-view');
  const gradingView = document.getElementById('grading-view');
  const resultView = document.getElementById('result-view');

  // DOM Elements
  const startBtn = document.getElementById('start-mock-btn');
  const timerDisplay = document.getElementById('mock-timer');
  
  const qNumDisplay = document.getElementById('mock-q-num');
  const qPointsDisplay = document.getElementById('mock-q-points');
  const qTextDisplay = document.getElementById('mock-question-text');
  const scratchpad = document.getElementById('mock-scratchpad');

  const prevBtn = document.getElementById('mock-prev-btn');
  const nextBtn = document.getElementById('mock-next-btn');
  const navigatorGrid = document.getElementById('mock-navigator-grid');
  const submitBtn = document.getElementById('mock-submit-btn');

  const gradingContainer = document.getElementById('grading-cards-container');
  const finalizeBtn = document.getElementById('mock-finalize-btn');

  const scoreDisplay = document.getElementById('mock-score-display');
  const percentDisplay = document.getElementById('mock-percent-display');
  const progressBar = document.getElementById('mock-progress-bar');

  // Initialize draft templates
  questions.forEach((_, idx) => {
    userDrafts[idx] = '';
  });

  // Start Exam Simulation
  startBtn.addEventListener('click', () => {
    setupView.classList.add('d-none');
    examView.classList.remove('d-none');
    
    // Start timer countdown
    timerInterval = setInterval(() => {
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        alert('Time is up! Auto-submitting your mock exam answers.');
        triggerSubmission();
        return;
      }
      timeLeft--;
      const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
      const secs = (timeLeft % 60).toString().padStart(2, '0');
      timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);

    renderQuestion();
  });

  // Render question navigator grid
  function renderNavigator() {
    navigatorGrid.innerHTML = '';
    questions.forEach((_, idx) => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-sm text-center border d-flex align-items-center justify-content-center';
      btn.style.width = '38px';
      btn.style.height = '38px';
      btn.style.fontWeight = '600';
      btn.textContent = idx + 1;

      const isCurrent = idx === currentIndex;
      const isDrafted = userDrafts[idx] && userDrafts[idx].trim().length > 0;

      if (isCurrent) {
        btn.classList.add('btn-info');
        btn.style.borderColor = 'var(--accent-cyan)';
      } else if (isDrafted) {
        btn.classList.add('btn-secondary');
      } else {
        btn.classList.add('btn-outline-secondary');
      }

      btn.addEventListener('click', () => {
        saveCurrentDraft();
        currentIndex = idx;
        renderQuestion();
      });
      navigatorGrid.appendChild(btn);
    });
  }

  // Render active question details
  function renderQuestion() {
    renderNavigator();
    const q = questions[currentIndex];
    
    qNumDisplay.textContent = `Question ${currentIndex + 1} of ${totalQuestions}`;
    qPointsDisplay.textContent = `${q.points} Points`;
    qTextDisplay.textContent = q.question;
    
    // Restore user draft
    scratchpad.value = userDrafts[currentIndex] || '';

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === totalQuestions - 1;
  }

  // Save drafts when switching questions
  function saveCurrentDraft() {
    userDrafts[currentIndex] = scratchpad.value;
  }

  // Next / Prev listeners
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      saveCurrentDraft();
      currentIndex--;
      renderQuestion();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < totalQuestions - 1) {
      saveCurrentDraft();
      currentIndex++;
      renderQuestion();
    }
  });

  // Capture text draft changes instantly
  scratchpad.addEventListener('input', () => {
    userDrafts[currentIndex] = scratchpad.value;
  });

  // Submit mock exam
  submitBtn.addEventListener('click', () => {
    saveCurrentDraft();
    
    // Check if any question drafts are blank
    let unattemptedCount = 0;
    questions.forEach((_, idx) => {
      if (!userDrafts[idx] || userDrafts[idx].trim().length === 0) {
        unattemptedCount++;
      }
    });

    if (unattemptedCount > 0) {
      const conf = confirm(`You have left ${unattemptedCount} workspace drafts blank. Submit anyway?`);
      if (!conf) return;
    }

    triggerSubmission();
  });

  function triggerSubmission() {
    clearInterval(timerInterval);
    examView.classList.add('d-none');
    gradingView.classList.remove('d-none');
    renderGradingInterface();
  }

  // Render comparative grading interface
  function renderGradingInterface() {
    gradingContainer.innerHTML = '';
    questions.forEach((q, idx) => {
      const userDraft = userDrafts[idx] && userDrafts[idx].trim().length > 0
        ? userDrafts[idx]
        : '[No draft provided]';

      const card = document.createElement('div');
      card.className = 'panel-glass p-4 mb-4';
      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
          <span class="badge bg-secondary-subtle text-info">Question ${idx + 1} (${q.points} Pts)</span>
          <div class="btn-group" role="group" aria-label="Self grading">
            <button type="button" class="btn btn-sm btn-outline-success grade-btn" id="grade-correct-${idx}" data-idx="${idx}" data-val="true">
              <i class="bi bi-check-circle"></i> Correct
            </button>
            <button type="button" class="btn btn-sm btn-outline-danger grade-btn" id="grade-incorrect-${idx}" data-idx="${idx}" data-val="false">
              <i class="bi bi-x-circle"></i> Incorrect
            </button>
          </div>
        </div>

        <h5 class="h6 mb-3 text-light">${q.question}</h5>
        
        <div class="row g-3">
          <!-- Draft -->
          <div class="col-md-6">
            <label class="form-label text-muted small">Your Drafted Answer:</label>
            <pre class="bg-dark p-3 rounded text-light small border border-secondary" style="white-space: pre-wrap; height: 160px; overflow-y: auto;">${userDraft}</pre>
          </div>
          <!-- Solution -->
          <div class="col-md-6">
            <label class="form-label text-info small">Model Solution:</label>
            <pre class="bg-dark p-3 rounded text-info small border border-info" style="white-space: pre-wrap; height: 160px; overflow-y: auto;">${q.answer}</pre>
          </div>
        </div>
      `;
      gradingContainer.appendChild(card);
    });

    // Handle grade buttons
    gradingContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.grade-btn');
      if (!btn) return;

      const idx = parseInt(btn.getAttribute('data-idx'));
      const val = btn.getAttribute('data-val') === 'true';

      selfGrades[idx] = val;

      // Toggle active states
      const correctBtn = document.getElementById(`grade-correct-${idx}`);
      const incorrectBtn = document.getElementById(`grade-incorrect-${idx}`);

      if (val) {
        correctBtn.className = 'btn btn-sm btn-success grade-btn';
        incorrectBtn.className = 'btn btn-sm btn-outline-danger grade-btn';
      } else {
        correctBtn.className = 'btn btn-sm btn-outline-success grade-btn';
        incorrectBtn.className = 'btn btn-sm btn-danger grade-btn';
      }
    });
  }

  // Finalize score calculation
  finalizeBtn.addEventListener('click', () => {
    // Check if all graded
    const gradedCount = Object.keys(selfGrades).length;
    if (gradedCount < totalQuestions) {
      alert(`Please grade all ${totalQuestions} questions before finalizing.`);
      return;
    }

    let earnedPoints = 0;
    let maxPoints = 0;

    questions.forEach((q, idx) => {
      maxPoints += q.points;
      if (selfGrades[idx] === true) {
        earnedPoints += q.points;
      } else {
        // Log to mistakes
        recordMistake({
          id: `mock_${q.id}`,
          type: 'mock',
          source: 'Mock Exam Simulation',
          question: q.question,
          answer: q.answer,
          explanation: `Worth ${q.points} points. Make sure to walk through intermediate steps carefully.`
        });
      }
    });

    // Save mock score
    saveMockResult(earnedPoints, maxPoints);

    // Hide grading
    gradingView.classList.add('d-none');
    resultView.classList.remove('d-none');

    // Display scores
    scoreDisplay.textContent = `${earnedPoints} / ${maxPoints} Points`;
    const pct = Math.round((earnedPoints / maxPoints) * 100);
    percentDisplay.textContent = `${pct}% Accuracy`;
    
    progressBar.style.width = `${pct}%`;
    progressBar.setAttribute('aria-valuenow', pct);
  });

});
