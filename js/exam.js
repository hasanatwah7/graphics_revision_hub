/**
 * exam.js — Past Exam Solver Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const yearParam = getParam('year');
  if (!yearParam) {
    window.location.href = 'exams.html';
    return;
  }

  // Load exams database
  const exams = await loadData('exams.json');
  if (!exams) return;

  const exam = exams.find(e => e.year == yearParam);
  if (!exam) {
    alert('Exam paper not found!');
    window.location.href = 'exams.html';
    return;
  }

  // Active exam state
  const questions = exam.questions;
  const totalQuestions = questions.length;
  let currentIndex = 0;
  const userAnswers = {}; // { questionIndex: selectedOption }
  const flaggedIndices = new Set();
  
  // Timer State
  let secondsElapsed = 0;
  let timerInterval = null;

  function startTimer() {
    timerInterval = setInterval(() => {
      secondsElapsed++;
      const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
      const secs = (secondsElapsed % 60).toString().padStart(2, '0');
      document.getElementById('timer-display').textContent = `${mins}:${secs}`;
    }, 1000);
  }
  startTimer();

  // DOM elements
  const qCounter = document.getElementById('q-counter');
  const qPercent = document.getElementById('q-percent');
  const examProgressBar = document.getElementById('exam-progress-bar');
  const questionText = document.getElementById('question-text');
  const optionsContainer = document.getElementById('options-container');
  const explanationPanel = document.getElementById('explanation-panel');
  const explanationText = document.getElementById('explanation-text');
  const flagBtn = document.getElementById('flag-btn-exam');
  
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const navigatorGrid = document.getElementById('navigator-grid');
  const submitBtn = document.getElementById('submit-exam-btn');

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

      // Color coding based on state
      const isCurrent = idx === currentIndex;
      const isAnswered = userAnswers[idx] !== undefined;
      const isFlagged = flaggedIndices.has(idx);

      if (isCurrent) {
        btn.classList.add('btn-info');
        btn.style.borderColor = 'var(--accent-cyan)';
      } else if (isFlagged) {
        btn.classList.add('btn-warning', 'text-white');
      } else if (isAnswered) {
        btn.classList.add('btn-secondary');
      } else {
        btn.classList.add('btn-outline-secondary');
      }

      btn.addEventListener('click', () => {
        currentIndex = idx;
        renderCurrentQuestion();
      });
      navigatorGrid.appendChild(btn);
    });
  }

  // Render current question details
  function renderCurrentQuestion() {
    renderNavigator();
    const q = questions[currentIndex];
    
    // Update progress bars
    qCounter.textContent = `Question ${currentIndex + 1} of ${totalQuestions}`;
    const answeredCount = Object.keys(userAnswers).length;
    const progressPct = Math.round((answeredCount / totalQuestions) * 100);
    qPercent.textContent = `${progressPct}% Completed`;
    examProgressBar.style.width = `${progressPct}%`;
    examProgressBar.setAttribute('aria-valuenow', progressPct);

    // Update flag btn state
    if (flaggedIndices.has(currentIndex)) {
      flagBtn.innerHTML = '<i class="bi bi-flag-fill"></i>';
      flagBtn.className = 'btn btn-sm text-warning flag-btn p-0';
    } else {
      flagBtn.innerHTML = '<i class="bi bi-flag"></i>';
      flagBtn.className = 'btn btn-sm text-muted flag-btn p-0';
    }

    // Set text
    questionText.textContent = q.question;
    optionsContainer.innerHTML = '';

    // Render options
    Object.entries(q.options).forEach(([key, val]) => {
      const isSelected = userAnswers[currentIndex] === key;
      const isCorrect = q.answer === key;
      const isAnswered = userAnswers[currentIndex] !== undefined;

      const optBtn = document.createElement('button');
      optBtn.className = 'option-btn';
      
      // Highlight correct/incorrect if answered
      if (isAnswered) {
        if (isSelected) {
          optBtn.classList.add(isCorrect ? 'correct' : 'wrong');
        } else if (isCorrect) {
          optBtn.classList.add('correct');
        }
      } else if (isSelected) {
        optBtn.classList.add('selected');
      }

      optBtn.innerHTML = `
        <span class="option-badge">${key}</span>
        <span>${val}</span>
      `;

      // Disable after choice
      if (isAnswered) {
        optBtn.disabled = true;
      }

      optBtn.addEventListener('click', () => {
        if (userAnswers[currentIndex] !== undefined) return;
        userAnswers[currentIndex] = key;
        
        // Instant feedback details
        const isUserCorrect = key === q.answer;
        if (!isUserCorrect) {
          // Add to mistakes dynamically
          recordMistake({
            id: `exam_${yearParam}_q${currentIndex}`,
            type: 'exam',
            source: `${yearParam} Final Exam`,
            question: q.question,
            options: q.options,
            answer: q.answer,
            explanation: q.explanation || 'Refer to syllabus guidelines.'
          });
        }
        
        renderCurrentQuestion();
      });

      optionsContainer.appendChild(optBtn);
    });

    // Handle explanation rendering
    const hasBeenAnswered = userAnswers[currentIndex] !== undefined;
    if (hasBeenAnswered) {
      explanationPanel.classList.remove('d-none');
      explanationText.textContent = q.explanation || 'No detailed explanation provided for this question.';
    } else {
      explanationPanel.classList.add('d-none');
    }

    // Update nav buttons
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === totalQuestions - 1;
  }

  // Button Listeners
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderCurrentQuestion();
    }
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < totalQuestions - 1) {
      currentIndex++;
      renderCurrentQuestion();
    }
  });

  flagBtn.addEventListener('click', () => {
    if (flaggedIndices.has(currentIndex)) {
      flaggedIndices.delete(currentIndex);
    } else {
      flaggedIndices.add(currentIndex);
    }
    renderCurrentQuestion();
  });

  // Submit action
  submitBtn.addEventListener('click', () => {
    const answeredCount = Object.keys(userAnswers).length;
    if (answeredCount < totalQuestions) {
      const confirmSubmit = confirm(`You have only answered ${answeredCount} out of ${totalQuestions} questions. Are you sure you want to submit?`);
      if (!confirmSubmit) return;
    }

    // Calculate score
    clearInterval(timerInterval);
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) {
        correctCount++;
      } else {
        // Double-check logging all incorrect answers to mistakes
        recordMistake({
          id: `exam_${yearParam}_q${idx}`,
          type: 'exam',
          source: `${yearParam} Final Exam`,
          question: q.question,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation || 'Refer to syllabus guidelines.'
        });
      }
    });

    // Save exam stats
    saveExamScore(yearParam, correctCount, totalQuestions);

    // Hide solver panel
    document.getElementById('question-panel-col').classList.add('d-none');
    document.getElementById('nav-panel-col').classList.add('d-none');
    document.getElementById('timer-badge').classList.add('d-none');

    // Display Results Panel
    const resultsPanel = document.getElementById('results-panel');
    resultsPanel.classList.remove('d-none');
    
    document.getElementById('results-meta').textContent = `You attempted the ${yearParam} Final Exam. Duration: ${Math.floor(secondsElapsed / 60)}m ${secondsElapsed % 60}s.`;
    document.getElementById('results-score').textContent = `${correctCount} / ${totalQuestions}`;
    
    const pct = Math.round((correctCount / totalQuestions) * 100);
    document.getElementById('results-percentage').textContent = `${pct}% Accuracy`;
    
    const progressBar = document.getElementById('results-progress');
    progressBar.style.width = `${pct}%`;
    progressBar.setAttribute('aria-valuenow', pct);
  });

  // Initial draw
  renderCurrentQuestion();
});
