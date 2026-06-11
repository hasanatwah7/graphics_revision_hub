/**
 * mistakes.js — Mistakes Review Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('mistakes-container');
  const clearAllBtn = document.getElementById('clear-all-mistakes-btn');

  if (!container) return;

  function renderMistakesList() {
    const progress = getProgress();
    const mistakes = progress.mistakes || [];

    // Clear loading state
    container.innerHTML = '';

    if (mistakes.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <div class="panel-glass p-5 d-inline-block text-center shadow-lg" style="max-width: 500px;">
            <div class="fs-1 text-success mb-3"><i class="bi bi-patch-check-fill animate__animated animate__bounceIn"></i></div>
            <h3 class="h4 mb-2">Zero Active Mistakes!</h3>
            <p class="text-muted small mb-0">You've successfully solved all flagged questions. Keep revising to maintain your edge!</p>
          </div>
        </div>
      `;
      clearAllBtn.style.display = 'none';
      return;
    }

    clearAllBtn.style.display = 'inline-block';

    mistakes.forEach((m, idx) => {
      // Type badges
      let typeBadge = '';
      if (m.type === 'exam') {
        typeBadge = '<span class="badge bg-primary-subtle text-primary border border-primary-subtle">Exam MCQ</span>';
      } else if (m.type === 'mock') {
        typeBadge = '<span class="badge bg-warning-subtle text-warning border border-warning-subtle">Mock Calculation</span>';
      } else {
        typeBadge = '<span class="badge bg-info-subtle text-info border border-info-subtle">Topic Practice</span>';
      }

      // Check if MCQ
      let optionsHTML = '';
      let interactiveArea = '';

      if (m.options) {
        optionsHTML = '<div class="d-flex flex-column gap-2 mb-3">';
        Object.entries(m.options).forEach(([key, val]) => {
          optionsHTML += `
            <button class="option-btn mcq-option-btn" data-mistake-id="${m.id}" data-choice="${key}">
              <span class="option-badge">${key}</span>
              <span>${val}</span>
            </button>
          `;
        });
        optionsHTML += '</div>';
      } else {
        // Calculation / Short answer workspace
        interactiveArea = `
          <div class="mb-3">
            <textarea class="form-control bg-dark border-secondary text-white small" rows="4" placeholder="Draft your steps here to practice..." style="font-family: monospace;"></textarea>
          </div>
        `;
      }

      const cardHTML = `
        <div class="col-lg-6" id="mistake-card-${m.id}">
          <div class="panel-glass p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-3">
                <span class="text-muted small fw-bold"><i class="bi bi-folder2-open"></i> ${m.source}</span>
                ${typeBadge}
              </div>

              <h5 class="h6 mb-3 text-light" style="line-height: 1.5;">${m.question}</h5>
              
              ${optionsHTML}
              ${interactiveArea}

              <!-- Answer / Explanation -->
              <div class="answer-panel d-none mt-3" id="explanation-mistake-${idx}">
                <p class="mb-2 small text-light"><strong>Correct Answer:</strong></p>
                <pre class="bg-dark p-2.5 rounded text-info small" style="white-space: pre-wrap; font-size: 0.85rem;">${m.answer}</pre>
                ${m.explanation ? `<p class="text-muted small mb-0"><strong>Explanation:</strong> ${m.explanation}</p>` : ''}
              </div>
            </div>

            <!-- Card Actions -->
            <div class="d-flex gap-2 mt-4 pt-3 border-top" style="border-color: rgba(255,255,255,0.06) !important;">
              <button class="btn btn-sm btn-outline-info flex-grow-1 reveal-mistake-btn" data-index="${idx}">
                Reveal Solution
              </button>
              <button class="btn btn-sm btn-outline-success flex-grow-1 resolve-mistake-btn" data-mistake-id="${m.id}">
                <i class="bi bi-check-circle"></i> Mark Solved
              </button>
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', cardHTML);
    });
  }

  // Handle MCQ selection & action buttons
  container.addEventListener('click', (e) => {
    const mcqBtn = e.target.closest('.mcq-option-btn');
    const revealBtn = e.target.closest('.reveal-mistake-btn');
    const resolveBtn = e.target.closest('.resolve-mistake-btn');

    if (mcqBtn) {
      const mistakeId = mcqBtn.getAttribute('data-mistake-id');
      const choice = mcqBtn.getAttribute('data-choice');
      
      const progress = getProgress();
      const mistake = progress.mistakes.find(m => m.id === mistakeId);

      if (mistake) {
        const isCorrect = choice === mistake.answer;
        
        // Highlight correct/incorrect options in the card
        const card = document.getElementById(`mistake-card-${mistakeId}`);
        const allOptionBtns = card.querySelectorAll('.mcq-option-btn');
        
        allOptionBtns.forEach(btn => {
          btn.disabled = true; // disable after select
          const btnChoice = btn.getAttribute('data-choice');
          if (btnChoice === mistake.answer) {
            btn.classList.add('correct');
          } else if (btnChoice === choice) {
            btn.classList.add('wrong');
          }
        });

        if (isCorrect) {
          alert('Correct! This question has been resolved.');
          removeMistake(mistakeId);
          renderMistakesList();
          renderNavbar(); // Refresh navbar badge
        } else {
          alert('Incorrect option. Try reviewing the explanation below.');
          // Auto reveal explanation
          const index = Array.from(container.children).indexOf(card);
          const panel = document.getElementById(`explanation-mistake-${index}`);
          if (panel) panel.classList.remove('d-none');
        }
      }
    }

    if (revealBtn) {
      const idx = revealBtn.getAttribute('data-index');
      const panel = document.getElementById(`explanation-mistake-${idx}`);
      panel.classList.toggle('d-none');
      revealBtn.textContent = panel.classList.contains('d-none') ? 'Reveal Solution' : 'Hide Solution';
    }

    if (resolveBtn) {
      const mistakeId = resolveBtn.getAttribute('data-mistake-id');
      removeMistake(mistakeId);
      alert('Question removed from active mistakes list.');
      renderMistakesList();
      renderNavbar(); // Refresh navbar badge
    }
  });

  // Clear All Mistakes Action
  clearAllBtn.addEventListener('click', () => {
    const conf = confirm('Are you sure you want to clear all logged mistakes?');
    if (conf) {
      clearMistakes();
      alert('All mistakes cleared.');
      renderMistakesList();
      renderNavbar();
    }
  });

  // Initial draw
  renderMistakesList();
});
